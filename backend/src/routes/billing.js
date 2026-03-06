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
    trialDays: 3,
    plans: Object.entries(PLANS).map(([name, plan]) => ({
      name,
      seats: plan.seats,
      price: plan.price,
      priceId: plan.priceId,
      trialDays: 3
    }))
  });
});

// Public checkout endpoint - works with or without account
router.post("/checkout", async (req, res, next) => {
  try {
    const { plan } = req.body;
    const planKey = plan?.toUpperCase();

    if (!planKey || !PLANS[planKey]) {
      return res.status(400).json({ error: "Invalid plan. Choose SOLO, TEAM, or ARMY" });
    }

    const token = req.cookies?.token;
    let userId = null;
    let user = null;
    let org = null;

    // If user is already logged in, use their account
    if (token) {
      try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        userId = decoded.userId;
        user = await prisma.user.findUnique({ where: { id: userId } });

        if (user) {
          org = await prisma.organization.findFirst({
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
        }
      } catch (err) {
        // Invalid token, continue as guest
        userId = null;
      }
    }

    // Create Stripe checkout session
    const isNewUser = !user;
    const successUrl = isNewUser
      ? process.env.FRONTEND_URL + "/setup-password?plan=" + planKey
      : process.env.FRONTEND_URL + "/dashboard?success=true&plan=" + planKey;

    const sessionConfig = {
      mode: "subscription",
      payment_method_types: ["card"],
      line_items: [{ price: PLANS[planKey].priceId, quantity: 1 }],
      subscription_data: {
        trial_period_days: 3,
        metadata: { plan: planKey, ...(userId && { userId }) }
      },
      success_url: successUrl,
      cancel_url: process.env.FRONTEND_URL + "/?canceled=true",
      metadata: { plan: planKey, isNewUser: isNewUser ? "true" : "false" }
    };

    // If logged in, use their info
    if (user && org) {
      sessionConfig.customer_email = user.email;
      sessionConfig.client_reference_id = org.id;
      sessionConfig.metadata.orgId = org.id;
      sessionConfig.metadata.userId = userId;
      sessionConfig.metadata.userName = user.name;
    } else {
      // Guest checkout - collect email at Stripe (customer auto-created in subscription mode)
      sessionConfig.billing_address_collection = "auto";
    }

    const session = await stripe.checkout.sessions.create(sessionConfig);

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
      subscription_data: {
        trial_period_days: 3,
        metadata: { orgId: org.id, plan, userId: req.userId }
      },
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

// Cancel subscription - gives 3 day grace period
router.post("/cancel", auth, async (req, res, next) => {
  try {
    const org = await prisma.organization.findFirst({
      where: { ownerId: req.userId },
      include: { subscription: true }
    });

    if (!org?.subscription) {
      return res.status(404).json({ error: "No active subscription" });
    }

    // Cancel in Stripe at period end
    await stripe.subscriptions.update(org.subscription.stripeId, {
      cancel_at_period_end: true
    });

    // Set cancel date to 3 days from now
    const cancelAt = new Date(Date.now() + 3 * 24 * 60 * 60 * 1000);

    await prisma.subscription.update({
      where: { id: org.subscription.id },
      data: {
        status: "canceling",
        cancelAt
      }
    });

    res.json({
      message: "Subscription cancelled",
      cancelAt: cancelAt.toISOString(),
      gracePeriodDays: 3
    });
  } catch (err) {
    next(err);
  }
});

// Reactivate cancelled subscription
router.post("/reactivate", auth, async (req, res, next) => {
  try {
    const org = await prisma.organization.findFirst({
      where: { ownerId: req.userId },
      include: { subscription: true }
    });

    if (!org?.subscription) {
      return res.status(404).json({ error: "No subscription found" });
    }

    // Reactivate in Stripe
    await stripe.subscriptions.update(org.subscription.stripeId, {
      cancel_at_period_end: false
    });

    await prisma.subscription.update({
      where: { id: org.subscription.id },
      data: {
        status: "active",
        cancelAt: null
      }
    });

    res.json({ message: "Subscription reactivated" });
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
      let { orgId, plan, userId, userName, isNewUser } = session.metadata;

      if (!session.subscription) {
        console.log("No subscription in session, skipping");
        break;
      }

      const subscription = await stripe.subscriptions.retrieve(session.subscription);
      const customer = await stripe.customers.retrieve(session.customer);

      // If this is a new user (guest checkout), create their account
      if (isNewUser === "true" || !userId) {
        const email = customer.email || session.customer_details?.email;
        const name = customer.name || session.customer_details?.name || email.split("@")[0];

        console.log(`Creating new account for guest checkout: ${email}`);

        // Check if user already exists
        let existingUser = await prisma.user.findUnique({ where: { email } });

        if (!existingUser) {
          // Generate random password (user will need to reset it)
          const bcrypt = require("bcryptjs");
          const tempPassword = require("crypto").randomBytes(16).toString("hex");
          const passwordHash = await bcrypt.hash(tempPassword, 12);

          // Create user and org in transaction
          const result = await prisma.$transaction(async (tx) => {
            const newUser = await tx.user.create({
              data: { name, email, passwordHash, orgRole: "OWNER" }
            });

            const newOrg = await tx.organization.create({
              data: {
                name: `${name}'s Organization`,
                ownerId: newUser.id,
                plan: plan,
                seatLimit: PLANS[plan].seats,
                members: { connect: { id: newUser.id } }
              }
            });

            return { user: newUser, org: newOrg };
          });

          userId = result.user.id;
          userName = result.user.name;
          orgId = result.org.id;

          console.log(`Created new user ${userId} and org ${orgId}`);
        } else {
          userId = existingUser.id;
          userName = existingUser.name;
          const existingOrg = await prisma.organization.findFirst({ where: { ownerId: userId } });
          if (existingOrg) orgId = existingOrg.id;
        }
      }

      // Create/update subscription
      if (orgId) {
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
              renewsAt: new Date(subscription.current_period_end * 1000),
              cancelAt: null
            }
          }),
          prisma.organization.update({
            where: { id: orgId },
            data: { plan, seatLimit: PLANS[plan].seats }
          })
        ]);
      }

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

      // Find and suspend all VMs for this subscription
      const subscription = await prisma.subscription.findFirst({
        where: { stripeId: sub.id },
        include: { org: { include: { members: true } } }
      });

      if (subscription?.org) {
        const userIds = subscription.org.members.map(m => m.id);
        await prisma.vM.updateMany({
          where: { userId: { in: userIds }, status: "RUNNING" },
          data: { status: "SUSPENDED" }
        });
      }

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
