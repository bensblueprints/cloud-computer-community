const express = require("express");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const crypto = require("crypto");
const { PrismaClient } = require("@prisma/client");
const rateLimit = require("express-rate-limit");
const { Resend } = require("resend");
const auth = require("../middleware/auth");
const { addVMUserQueue } = require("../jobs/addVMUser");

const router = express.Router();
const prisma = new PrismaClient();
const resend = new Resend(process.env.RESEND_API_KEY);
const JWT_SECRET = process.env.JWT_SECRET;

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  message: { error: "Too many attempts, please try again later" }
});

function setTokenCookie(res, userId) {
  const token = jwt.sign({ userId }, JWT_SECRET, { expiresIn: "7d" });
  res.cookie("token", token, {
    httpOnly: true,
    secure: true,
    sameSite: "lax",
    domain: ".cloudcode.space",
    path: "/",
    maxAge: 7 * 24 * 60 * 60 * 1000
  });
  return token;
}

router.post("/register", authLimiter, async (req, res, next) => {
  try {
    const { name, email, password } = req.body;
    if (!name || !email || !password) {
      return res.status(400).json({ error: "Name, email, and password are required" });
    }
    if (password.length < 8) {
      return res.status(400).json({ error: "Password must be at least 8 characters" });
    }

    const existing = await prisma.user.findUnique({ where: { email } });
    if (existing) {
      return res.status(409).json({ error: "Email already registered" });
    }

    const passwordHash = await bcrypt.hash(password, 12);

    const user = await prisma.$transaction(async (tx) => {
      const newUser = await tx.user.create({
        data: { name, email, passwordHash, orgRole: "OWNER" }
      });

      const org = await tx.organization.create({
        data: {
          name: `${name}'s Organization`,
          ownerId: newUser.id,
          plan: "FREE",
          seatLimit: 1,
          members: { connect: { id: newUser.id } }
        }
      });

      return tx.user.findUnique({
        where: { id: newUser.id },
        include: { org: true }
      });
    });

    // Send welcome email
    const emailFrom = process.env.EMAIL_FROM || "noreply@cloudcode.space";
    resend.emails.send({
      from: `Cloud Computer <${emailFrom}>`,
      to: email,
      subject: "Welcome to Cloud Computer!",
      html: `
        <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto;">
          <h1 style="color: #0891b2;">Welcome to Cloud Computer!</h1>
          <p>Hi ${name},</p>
          <p>Your account has been created. Choose a plan to get your cloud server running in minutes:</p>
          <div style="margin: 24px 0;">
            <a href="https://app.cloudcode.space/dashboard/billing" style="background: linear-gradient(to right, #06b6d4, #2563eb); color: white; padding: 12px 32px; border-radius: 8px; text-decoration: none; font-weight: 600;">Choose Your Plan</a>
          </div>
          <p style="color: #6b7280; font-size: 14px;">Every plan includes a free Go High Level CRM account with unlimited users.</p>
          <p style="color: #6b7280; font-size: 14px;">3-day free trial on all plans. Cancel anytime.</p>
        </div>
      `
    }).catch(err => console.error("Welcome email error:", err));

    setTokenCookie(res, user.id);
    res.status(201).json({ user: { id: user.id, name: user.name, email: user.email, org: user.org } });
  } catch (err) {
    next(err);
  }
});

router.post("/login", authLimiter, async (req, res, next) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ error: "Email and password are required" });
    }

    const user = await prisma.user.findUnique({
      where: { email },
      include: { org: true }
    });

    if (!user || !(await bcrypt.compare(password, user.passwordHash))) {
      return res.status(401).json({ error: "Invalid email or password" });
    }

    if (user.suspended) {
      return res.status(403).json({ error: "Account suspended" });
    }

    await prisma.user.update({
      where: { id: user.id },
      data: { lastLoginAt: new Date() }
    });

    setTokenCookie(res, user.id);
    res.json({ user: { id: user.id, name: user.name, email: user.email, siteRole: user.siteRole, org: user.org } });
  } catch (err) {
    next(err);
  }
});

router.post("/logout", auth, (req, res) => {
  res.clearCookie("token", {
    domain: ".cloudcode.space",
    path: "/"
  });
  res.json({ message: "Logged out" });
});

router.get("/me", auth, async (req, res, next) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.userId },
      include: { org: { include: { subscription: true } } }
    });
    // Prevent browser caching so impersonate/masquerade works correctly
    res.set('Cache-Control', 'no-store, no-cache, must-revalidate');
    res.set('Pragma', 'no-cache');
    res.json({
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        siteRole: user.siteRole,
        orgRole: user.orgRole,
        org: user.org
      }
    });
  } catch (err) {
    next(err);
  }
});

// Update profile
router.put("/profile", auth, async (req, res, next) => {
  try {
    const { name } = req.body;

    const user = await prisma.user.update({
      where: { id: req.userId },
      data: { name },
      include: { org: true }
    });

    res.json({
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        siteRole: user.siteRole,
        orgRole: user.orgRole,
        org: user.org
      }
    });
  } catch (err) {
    next(err);
  }
});

// Delete account
router.delete("/account", auth, async (req, res, next) => {
  try {
    const userId = req.userId;

    // Get user's org and subscription
    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: {
        org: { include: { subscription: true } },
        vms: true
      }
    });

    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    // Cancel Stripe subscription if exists
    if (user.org?.subscription?.stripeId) {
      const Stripe = require("stripe");
      const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);
      try {
        await stripe.subscriptions.cancel(user.org.subscription.stripeId);
      } catch (e) {
        console.error("Failed to cancel Stripe subscription:", e.message);
      }
    }

    // Delete VMs in Proxmox
    const proxmoxService = require("../services/ProxmoxService");
    for (const vm of user.vms) {
      try {
        await proxmoxService.deleteVM(vm.vmid);
      } catch (e) {
        console.error(`Failed to delete VM ${vm.vmid}:`, e.message);
      }
    }

    // Delete all user data
    await prisma.$transaction([
      prisma.vM.deleteMany({ where: { userId } }),
      prisma.subscription.deleteMany({ where: { orgId: user.orgId } }),
      prisma.invite.deleteMany({ where: { orgId: user.orgId } }),
      prisma.organization.deleteMany({ where: { ownerId: userId } }),
      prisma.user.delete({ where: { id: userId } })
    ]);

    // Clear cookie
    res.clearCookie("token", {
      domain: ".cloudcode.space",
      path: "/"
    });

    res.json({ message: "Account deleted successfully" });
  } catch (err) {
    next(err);
  }
});

// Set password for new users created via Stripe checkout
router.post("/setup-password", async (req, res, next) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: "Email and password are required" });
    }
    if (password.length < 8) {
      return res.status(400).json({ error: "Password must be at least 8 characters" });
    }

    const user = await prisma.user.findUnique({
      where: { email },
      include: { org: true }
    });

    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    const passwordHash = await bcrypt.hash(password, 12);

    await prisma.user.update({
      where: { id: user.id },
      data: { passwordHash }
    });

    setTokenCookie(res, user.id);

    res.json({
      message: "Password set successfully",
      user: { id: user.id, name: user.name, email: user.email, org: user.org }
    });
  } catch (err) {
    next(err);
  }
});

router.post("/accept-invite/:token", async (req, res, next) => {
  try {
    const { token } = req.params;
    const { name, password } = req.body;

    const invite = await prisma.invite.findUnique({ where: { token } });
    if (!invite || invite.used || invite.expiresAt < new Date()) {
      return res.status(400).json({ error: "Invalid or expired invite" });
    }

    const passwordHash = await bcrypt.hash(password, 12);

    const user = await prisma.$transaction(async (tx) => {
      const newUser = await tx.user.create({
        data: {
          name,
          email: invite.email,
          passwordHash,
          orgId: invite.orgId,
          orgRole: "MEMBER"
        }
      });

      await tx.invite.update({
        where: { id: invite.id },
        data: { used: true }
      });

      return newUser;
    });

    // Check for org's shared VM and add user access
    const sharedVM = await prisma.vM.findFirst({
      where: { orgId: invite.orgId, isShared: true, status: { not: "DELETED" } }
    });

    if (sharedVM) {
      // Queue job to add user to shared VM
      await addVMUserQueue.add("addVMUser", {
        vmId: sharedVM.id,
        userId: user.id,
        userName: user.name,
        userEmail: user.email
      });
      console.log(`Queued addVMUser job for user ${user.id} on VM ${sharedVM.id}`);
    }

    setTokenCookie(res, user.id);
    res.status(201).json({ user: { id: user.id, name: user.name, email: user.email } });
  } catch (err) {
    next(err);
  }
});

// Forgot password - send reset email
router.post("/forgot-password", authLimiter, async (req, res, next) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({ error: "Email is required" });
    }

    const user = await prisma.user.findUnique({ where: { email } });

    // Always return success to prevent email enumeration
    if (!user) {
      return res.json({ message: "If an account exists, a password reset email has been sent" });
    }

    // Generate reset token
    const resetToken = crypto.randomBytes(32).toString("hex");
    const resetExpires = new Date(Date.now() + 60 * 60 * 1000); // 1 hour

    await prisma.user.update({
      where: { id: user.id },
      data: {
        passwordResetToken: resetToken,
        passwordResetExpires: resetExpires
      }
    });

    // Send reset email
    const resetUrl = `https://cloudcode.space/reset-password?token=${resetToken}`;
    const emailFrom = process.env.EMAIL_FROM || "noreply@cloudcode.space";

    console.log(`Sending password reset email to ${email} from ${emailFrom}`);

    try {
      const result = await resend.emails.send({
        from: `Cloud Computer <${emailFrom}>`,
        to: email,
        subject: "Reset your password",
        html: `
          <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto;">
            <h2>Reset Your Password</h2>
            <p>You requested to reset your password for Cloud Computer.</p>
            <p>Click the button below to set a new password. This link expires in 1 hour.</p>
            <a href="${resetUrl}" style="display: inline-block; background: #4f46e5; color: white; padding: 12px 24px; text-decoration: none; border-radius: 8px; margin: 16px 0;">Reset Password</a>
            <p>If you didn't request this, you can safely ignore this email.</p>
            <p style="color: #666; font-size: 12px;">Cloud Computer - Your cloud desktop platform</p>
          </div>
        `
      });
      console.log("Password reset email sent:", result);
    } catch (emailErr) {
      console.error("Failed to send password reset email:", emailErr);
      // Still return success to prevent email enumeration
    }

    res.json({ message: "If an account exists, a password reset email has been sent" });
  } catch (err) {
    next(err);
  }
});

// Reset password with token
router.post("/reset-password", async (req, res, next) => {
  try {
    const { token, password } = req.body;

    if (!token || !password) {
      return res.status(400).json({ error: "Token and password are required" });
    }

    if (password.length < 8) {
      return res.status(400).json({ error: "Password must be at least 8 characters" });
    }

    const user = await prisma.user.findFirst({
      where: {
        passwordResetToken: token,
        passwordResetExpires: { gt: new Date() }
      }
    });

    if (!user) {
      return res.status(400).json({ error: "Invalid or expired reset token" });
    }

    const passwordHash = await bcrypt.hash(password, 12);

    await prisma.user.update({
      where: { id: user.id },
      data: {
        passwordHash,
        passwordResetToken: null,
        passwordResetExpires: null
      }
    });

    res.json({ message: "Password reset successfully" });
  } catch (err) {
    next(err);
  }
});

// Change password (for logged-in users)
router.put("/change-password", auth, async (req, res, next) => {
  try {
    const { currentPassword, newPassword } = req.body;

    if (!currentPassword || !newPassword) {
      return res.status(400).json({ error: "Current password and new password are required" });
    }

    if (newPassword.length < 8) {
      return res.status(400).json({ error: "New password must be at least 8 characters" });
    }

    const user = await prisma.user.findUnique({ where: { id: req.userId } });

    if (!(await bcrypt.compare(currentPassword, user.passwordHash))) {
      return res.status(401).json({ error: "Current password is incorrect" });
    }

    const passwordHash = await bcrypt.hash(newPassword, 12);

    await prisma.user.update({
      where: { id: user.id },
      data: { passwordHash }
    });

    res.json({ message: "Password changed successfully" });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
