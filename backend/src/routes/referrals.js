const express = require("express");
const crypto = require("crypto");
const { PrismaClient } = require("@prisma/client");
const auth = require("../middleware/auth");

const router = express.Router();
const prisma = new PrismaClient();

const COMMISSION_RATE = 0.20; // 20%
const PAYOUT_THRESHOLD = 100; // $100 minimum
const REFERRAL_VALIDITY_DAYS = 365;

// Plan prices for commission calculation
const PLAN_PRICES = {
  SOLO: 17,
  TEAM: 79,
  ARMY: 299
};

// Generate a short referral code
function generateCode(name) {
  const prefix = name.replace(/[^a-zA-Z]/g, "").slice(0, 4).toUpperCase() || "REF";
  const suffix = crypto.randomBytes(3).toString("hex").toUpperCase();
  return `${prefix}-${suffix}`;
}

// Get or create the current user's referral code
router.get("/my-code", auth, async (req, res, next) => {
  try {
    let user = await prisma.user.findUnique({ where: { id: req.userId } });

    if (!user.referralCode) {
      const code = generateCode(user.name);
      user = await prisma.user.update({
        where: { id: req.userId },
        data: { referralCode: code }
      });
    }

    const shareUrl = `https://cloudcode.space/register?ref=${user.referralCode}`;

    res.json({
      code: user.referralCode,
      shareUrl,
      commissionRate: COMMISSION_RATE * 100,
      payoutThreshold: PAYOUT_THRESHOLD,
      validityDays: REFERRAL_VALIDITY_DAYS
    });
  } catch (err) {
    next(err);
  }
});

// Get referral stats for current user
router.get("/stats", auth, async (req, res, next) => {
  try {
    const referrals = await prisma.referral.findMany({
      where: { referrerId: req.userId },
      include: {
        referredUser: {
          select: { name: true, email: true, createdAt: true, org: { select: { plan: true, subscription: { select: { status: true } } } } }
        }
      },
      orderBy: { createdAt: "desc" }
    });

    const payouts = await prisma.referralPayout.findMany({
      where: { userId: req.userId },
      orderBy: { createdAt: "desc" }
    });

    // Count referral link clicks from AuditLog
    const totalClicks = await prisma.auditLog.count({
      where: { userId: req.userId, action: "REFERRAL_CLICK" }
    });

    const totalEarned = referrals.reduce((sum, r) => sum + r.totalEarned, 0);
    const totalPaid = payouts.filter(p => p.status === "PAID").reduce((sum, p) => sum + p.amount, 0);
    const pendingBalance = totalEarned - totalPaid;
    const activeReferrals = referrals.filter(r => r.status === "ACTIVE").length;
    const pendingReferrals = referrals.filter(r => r.status === "PENDING").length;

    res.json({
      totalClicks,
      totalReferrals: referrals.length,
      activeReferrals,
      pendingReferrals,
      totalEarned: Math.round(totalEarned * 100) / 100,
      totalPaid: Math.round(totalPaid * 100) / 100,
      pendingBalance: Math.round(pendingBalance * 100) / 100,
      canRequestPayout: pendingBalance >= PAYOUT_THRESHOLD,
      payoutThreshold: PAYOUT_THRESHOLD,
      referrals: referrals.map(r => ({
        id: r.id,
        status: r.status,
        totalEarned: r.totalEarned,
        referredUser: {
          name: r.referredUser.name,
          email: r.referredUser.email.replace(/(.{2})(.*)(@.*)/, "$1***$3"), // mask email
          joinedAt: r.referredUser.createdAt,
          plan: r.referredUser.org?.plan || "FREE",
          subscriptionActive: r.referredUser.org?.subscription?.status === "active" || r.referredUser.org?.subscription?.status === "trialing"
        },
        createdAt: r.createdAt,
        expiresAt: r.expiresAt
      })),
      payouts: payouts.map(p => ({
        id: p.id,
        amount: p.amount,
        status: p.status,
        note: p.note,
        createdAt: p.createdAt,
        paidAt: p.paidAt
      }))
    });
  } catch (err) {
    next(err);
  }
});

// Request a payout
router.post("/request-payout", auth, async (req, res, next) => {
  try {
    const referrals = await prisma.referral.findMany({
      where: { referrerId: req.userId }
    });

    const payouts = await prisma.referralPayout.findMany({
      where: { userId: req.userId }
    });

    const totalEarned = referrals.reduce((sum, r) => sum + r.totalEarned, 0);
    const totalPaid = payouts.filter(p => p.status === "PAID").reduce((sum, p) => sum + p.amount, 0);
    const pendingRequests = payouts.filter(p => p.status === "PENDING").reduce((sum, p) => sum + p.amount, 0);
    const pendingBalance = totalEarned - totalPaid - pendingRequests;

    if (pendingBalance < PAYOUT_THRESHOLD) {
      return res.status(400).json({
        error: `Minimum payout is $${PAYOUT_THRESHOLD}. Your available balance is $${Math.round(pendingBalance * 100) / 100}.`
      });
    }

    const payout = await prisma.referralPayout.create({
      data: {
        userId: req.userId,
        amount: Math.round(pendingBalance * 100) / 100,
        status: "PENDING",
        note: `Payout request for $${Math.round(pendingBalance * 100) / 100}`
      }
    });

    // Notify admin
    const { Resend } = require("resend");
    const resend = new Resend(process.env.RESEND_API_KEY);
    const user = await prisma.user.findUnique({ where: { id: req.userId } });

    resend.emails.send({
      from: `Cloud Computer <${process.env.EMAIL_FROM || "noreply@cloudcode.space"}>`,
      to: "ben@advancedmarketing.co",
      subject: `Affiliate Payout Request: $${payout.amount} from ${user.name}`,
      html: `
        <div style="font-family: sans-serif;">
          <h2>Affiliate Payout Request</h2>
          <p><strong>Affiliate:</strong> ${user.name} (${user.email})</p>
          <p><strong>Amount:</strong> $${payout.amount}</p>
          <p><strong>Payout ID:</strong> ${payout.id}</p>
          <p>Pay via bank transfer and mark as paid in the admin panel.</p>
        </div>
      `
    }).catch(err => console.error("Payout notification error:", err));

    res.json({ payout, message: "Payout request submitted. We'll process it via bank transfer." });
  } catch (err) {
    next(err);
  }
});

// Track a referral link click (public, no auth needed)
router.post("/track/:code", async (req, res, next) => {
  try {
    const { code } = req.params;
    const { dest } = req.body; // destination page

    const user = await prisma.user.findFirst({
      where: { referralCode: code },
      select: { id: true, referralCode: true }
    });

    if (!user) {
      return res.status(404).json({ error: "Invalid referral code" });
    }

    // Log click in AuditLog (no schema change needed)
    await prisma.auditLog.create({
      data: {
        userId: user.id,
        action: "REFERRAL_CLICK",
        target: code,
        metadata: {
          dest: dest || "/register",
          ip: req.headers["x-forwarded-for"] || req.ip,
          ua: req.headers["user-agent"] || "",
          ts: new Date().toISOString()
        }
      }
    });

    res.json({ ok: true });
  } catch (err) {
    next(err);
  }
});

// Get available landing pages for referral links (auth required)
router.get("/landing-pages", auth, async (req, res) => {
  const pages = [
    { id: "register", label: "Registration Page", path: "/register" },
    { id: "home", label: "Homepage", path: "/" },
    { id: "for-developers", label: "For Developers", path: "/for/developers" },
    { id: "for-save", label: "SaaS Savings", path: "/for/save" },
    { id: "for-power", label: "Lightweight & Powerful", path: "/for/power" },
    { id: "for-agencies", label: "For Agencies", path: "/for/agencies" },
    { id: "for-remote", label: "Remote Work", path: "/for/remote" },
    { id: "blog-claude", label: "Skills Blog Index", path: "/blog/claude" },
  ];
  res.json({ pages });
});

// Validate a referral code (public, no auth needed)
router.get("/validate/:code", async (req, res, next) => {
  try {
    const { code } = req.params;
    const user = await prisma.user.findFirst({
      where: { referralCode: code },
      select: { name: true, referralCode: true }
    });

    if (!user) {
      return res.status(404).json({ valid: false, error: "Invalid referral code" });
    }

    res.json({ valid: true, referrerName: user.name.split(" ")[0] });
  } catch (err) {
    next(err);
  }
});

// ADMIN: List all payouts
router.get("/admin/payouts", auth, async (req, res, next) => {
  try {
    const user = await prisma.user.findUnique({ where: { id: req.userId } });
    if (user.siteRole !== "ADMIN") {
      return res.status(403).json({ error: "Admin only" });
    }

    const payouts = await prisma.referralPayout.findMany({
      include: { user: { select: { name: true, email: true } } },
      orderBy: { createdAt: "desc" }
    });

    res.json({ payouts });
  } catch (err) {
    next(err);
  }
});

// ADMIN: Mark payout as paid
router.put("/admin/payouts/:id/pay", auth, async (req, res, next) => {
  try {
    const user = await prisma.user.findUnique({ where: { id: req.userId } });
    if (user.siteRole !== "ADMIN") {
      return res.status(403).json({ error: "Admin only" });
    }

    const payout = await prisma.referralPayout.update({
      where: { id: req.params.id },
      data: { status: "PAID", paidAt: new Date(), note: req.body.note || "Paid via bank transfer" }
    });

    res.json({ payout });
  } catch (err) {
    next(err);
  }
});

// ADMIN: List all referrals
router.get("/admin/all", auth, async (req, res, next) => {
  try {
    const user = await prisma.user.findUnique({ where: { id: req.userId } });
    if (user.siteRole !== "ADMIN") {
      return res.status(403).json({ error: "Admin only" });
    }

    const referrals = await prisma.referral.findMany({
      include: {
        referrer: { select: { name: true, email: true, referralCode: true } },
        referredUser: { select: { name: true, email: true, org: { select: { plan: true } } } }
      },
      orderBy: { createdAt: "desc" }
    });

    res.json({ referrals });
  } catch (err) {
    next(err);
  }
});

// Helper: process referral commission on payment
// Called from billing webhook when invoice.payment_succeeded
async function processReferralCommission(referredUserId, amountPaid) {
  try {
    const referral = await prisma.referral.findUnique({
      where: { referredUserId }
    });

    if (!referral) return null;
    if (referral.status === "EXPIRED" || referral.status === "CANCELLED") return null;
    if (new Date() > referral.expiresAt) {
      await prisma.referral.update({
        where: { id: referral.id },
        data: { status: "EXPIRED" }
      });
      return null;
    }

    const commission = amountPaid * referral.commissionRate;

    const updated = await prisma.referral.update({
      where: { id: referral.id },
      data: {
        status: "ACTIVE",
        completedAt: referral.completedAt || new Date(),
        totalEarned: { increment: commission }
      }
    });

    console.log(`Referral commission: $${commission.toFixed(2)} for referrer ${referral.referrerId} from user ${referredUserId}`);
    return updated;
  } catch (err) {
    console.error("Referral commission error:", err);
    return null;
  }
}

module.exports = router;
module.exports.processReferralCommission = processReferralCommission;
