const express = require("express");
const { PrismaClient } = require("@prisma/client");
const Stripe = require("stripe");
const jwt = require("jsonwebtoken");
const { Queue } = require("bullmq");
const IORedis = require("ioredis");
const auth = require("../middleware/auth");

const router = express.Router();
const prisma = new PrismaClient();
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);
const redis = new IORedis(process.env.REDIS_URL || "redis://localhost:6379", { maxRetriesPerRequest: null });
const provisionQueue = new Queue("vm-provisioning", { connection: redis });

const PLANS = {
  SOLO: { seats: 1, priceId: process.env.STRIPE_PRICE_SOLO, price: 17, templateVmid: parseInt(process.env.PROXMOX_TEMPLATE_SOLO) || 111 },
  TEAM: { seats: 5, priceId: process.env.STRIPE_PRICE_TEAM, price: 79, templateVmid: parseInt(process.env.PROXMOX_TEMPLATE_TEAM) || 112 },
  ARMY: { seats: 25, priceId: process.env.STRIPE_PRICE_ARMY, price: 299, templateVmid: parseInt(process.env.PROXMOX_TEMPLATE_ARMY) || 113 }
};

router.get("/plans", (req, res) => {
  res.json({
    plans: Object.entries(PLANS).map(([name, plan]) => ({
      name,
      seats: plan.seats,
      price: plan.price,
      priceId: plan.priceId
    }))
  });
});

// Public checkout endpoint
router.post("/checkout", async (req, res, next) => {
  try {
    const { plan } = req.body;
    const planKey = plan?.toUpperCase();

    if (!planKey || !PLANS[planKey]) {
      return res.status(400).json({ error: "Invalid plan. Choose SOLO, TEAM, or ARMY" });
    }

    const token = req.cookies?.token;
    if (!token) {
      return res.json({
        redirect: "/register?plan=" + planKey,
        message: "Please create an account first"
      });
    }

    let userId;
    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      userId = decoded.userId;
    } catch (err) {
      return res.json({
        redirect: "/register?plan=" + planKey,
        message: "Please login or create an account"
      });
    }

    const user = await prisma.user.findUnique({ where: { id: userId } });

    let org = await prisma.organization.findFirst({
      where: { ownerId: userId },
      include: { subscription: true }
    });

    if (!org) {
      org = await prisma.organization.create({
        data: {
          name: (user.name || user.email) + " Organization",
          ownerId: userId,
          plan: "FREE",
          seatLimit: 1
        }
      });
      await prisma.user.update({
        where: { id: userId },
        data: { orgId: org.id }
      });
    }

    const session = await stripe.checkout.sessions.create({
      mode: "subscription",
      payment_method_types: ["card"],
      line_items: [{ price: PLANS[planKey].priceId, quantity: 1 }],
      success_url: process.env.FRONTEND_URL + "/dashboard?success=true&plan=" + planKey,
      cancel_url: process.env.FRONTEND_URL + "/?canceled=true",
      client_reference_id: org.id,
      customer_email: user.email,
      metadata: { orgId: org.id, plan: planKey, userId: userId, userName: user.name }
    });

    res.json({ url: session.url });
  } catch (err) {
    console.error("Checkout error:", err);
    next(err);
  }
});

router.post("/subscribe", auth, async (req, res, next) => {
  try {
    const { plan } = req.body;
    if (!PLANS[plan]) return res.status(400).json({ error: "Invalid plan" });

    const org = await prisma.organization.findFirst({
      where: { ownerId: req.userId },
      include: { subscription: true }
    });
    if (!org) return res.status(403).json({ error: "Only org owners can subscribe" });

    const session = await stripe.checkout.sessions.create({
      mode: "subscription",
      payment_method_types: ["card"],
      line_items: [{ price: PLANS[plan].priceId, quantity: 1 }],
      success_url: process.env.FRONTEND_URL + "/dashboard/billing?success=true",
      cancel_url: process.env.FRONTEND_URL + "/dashboard/billing?canceled=true",
      client_reference_id: org.id,
      metadata: { orgId: org.id, plan, userId: req.userId, userName: req.user.name }
    });

    res.json({ url: session.url });
  } catch (err) {
    next(err);
  }
});

router.get("/portal", auth, async (req, res, next) => {
  try {
    const org = await prisma.organization.findFirst({
      where: { ownerId: req.userId },
      include: { subscription: true }
    });
    if (!org?.subscription) return res.status(404).json({ error: "No active subscription" });

    const sub = await stripe.subscriptions.retrieve(org.subscription.stripeId);
    const session = await stripe.billingPortal.sessions.create({
      customer: sub.customer,
      return_url: process.env.FRONTEND_URL + "/dashboard/billing"
    });

    res.json({ url: session.url });
  } catch (err) {
    next(err);
  }
});

router.post("/webhook", express.raw({ type: "application/json" }), async (req, res) => {
  const sig = req.headers["stripe-signature"];
  let event;

  try {
    event = stripe.webhooks.constructEvent(req.body, sig, process.env.STRIPE_WEBHOOK_SECRET);
  } catch (err) {
    console.error("Webhook signature error:", err.message);
    return res.status(400).json({ error: "Webhook signature verification failed" });
  }

  console.log("Stripe webhook event:", event.type);

  switch (event.type) {
    case "checkout.session.completed": {
      const session = event.data.object;
      const { orgId, plan, userId, userName } = session.metadata;

      if (!session.subscription) {
        console.log("No subscription in session, skipping");
        break;
      }

      const subscription = await stripe.subscriptions.retrieve(session.subscription);

      // Update subscription and org
      await prisma.$transaction([
        prisma.subscription.upsert({
          where: { orgId },
          create: {
            orgId,
            plan,
            stripeId: subscription.id,
            status: subscription.status,
            renewsAt: new Date(subscription.current_period_end * 1000)
          },
          update: {
            plan,
            stripeId: subscription.id,
            status: subscription.status,
            renewsAt: new Date(subscription.current_period_end * 1000)
          }
        }),
        prisma.organization.update({
          where: { id: orgId },
          data: { plan, seatLimit: PLANS[plan].seats }
        })
      ]);

      // Auto-provision VM for new subscribers
      if (userId) {
        const existingVMs = await prisma.vM.count({
          where: { userId, status: { not: "DELETED" } }
        });

        if (existingVMs === 0) {
          console.log(`Auto-provisioning VM for new subscriber ${userId}`);

          const templateVmid = PLANS[plan].templateVmid;
          const newVmid = Date.now() % 100000 + 1000;
          const username = (userName || "user").toLowerCase().replace(/[^a-z0-9]/g, "");
          const subdomain = `${username}-${newVmid}`;

          const vm = await prisma.vM.create({
            data: {
              vmid: newVmid,
              userId,
              subdomain,
              templateType: `ubuntu-${plan.toLowerCase()}`,
              status: "PROVISIONING"
            }
          });

          await provisionQueue.add("provision", {
            userId,
            orgId,
            vmId: vm.id,
            vmid: newVmid,
            templateVmid,
            subdomain,
            username
          });

          console.log(`Queued VM ${newVmid} for provisioning`);
        }
      }
      break;
    }

    case "customer.subscription.updated": {
      const sub = event.data.object;
      await prisma.subscription.updateMany({
        where: { stripeId: sub.id },
        data: {
          status: sub.status,
          renewsAt: new Date(sub.current_period_end * 1000)
        }
      });
      break;
    }

    case "customer.subscription.deleted": {
      const sub = event.data.object;
      await prisma.subscription.updateMany({
        where: { stripeId: sub.id },
        data: { status: "canceled" }
      });
      break;
    }
  }

  res.json({ received: true });
});

module.exports = router;
