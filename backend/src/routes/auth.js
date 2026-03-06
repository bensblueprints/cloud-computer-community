const express = require("express");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const { PrismaClient } = require("@prisma/client");
const rateLimit = require("express-rate-limit");
const auth = require("../middleware/auth");

const router = express.Router();
const prisma = new PrismaClient();
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
          plan: "SOLO",
          seatLimit: 1,
          members: { connect: { id: newUser.id } }
        }
      });

      return tx.user.findUnique({
        where: { id: newUser.id },
        include: { org: true }
      });
    });

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

    setTokenCookie(res, user.id);
    res.status(201).json({ user: { id: user.id, name: user.name, email: user.email } });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
