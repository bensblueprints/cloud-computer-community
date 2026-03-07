/**
 * ============================================================
 * 🔒 FREEZE IT - DO NOT MODIFY THIS FILE 🔒
 * ============================================================
 * This file handles Stripe checkout and webhooks.
 * Changes here will break payments and VM provisioning.
 *
 * To switch Stripe accounts: Only update .env variables
 * - STRIPE_SECRET_KEY
 * - STRIPE_PUBLISHABLE_KEY
 * - STRIPE_WEBHOOK_SECRET
 * - STRIPE_PRICE_SOLO/TEAM/ARMY
 *
 * Last verified working: 2026-03-07
 * ============================================================
 */

const express = require("express");
const { PrismaClient } = require("@prisma/client");
const Stripe = require("stripe");
const jwt = require("jsonwebtoken");
const { Queue } = require("bullmq");
const IORedis = require("ioredis");
const auth = require("../middleware/auth");
const ghlService = require("../services/GHLService");

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

// Get customer email from checkout session (for setup-password page)
router.get("/session/:sessionId", async (req, res, next) => {
  try {
    const session = await stripe.checkout.sessions.retrieve(req.params.sessionId);
    if (!session) {
      return res.status(404).json({ error: "Session not found" });
    }

    const email = session.customer_details?.email || session.customer_email;
    if (!email) {
      return res.status(404).json({ error: "Email not found in session" });
    }

    res.json({ email, plan: session.metadata?.plan });
  } catch (err) {
    console.error("Failed to get session:", err.message);
    res.status(404).json({ error: "Session not found" });
  }
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
    // Use {CHECKOUT_SESSION_ID} placeholder - Stripe replaces it with actual session ID
    const successUrl = isNewUser
      ? process.env.FRONTEND_URL + "/setup-password?plan=" + planKey + "&session_id={CHECKOUT_SESSION_ID}"
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

    // Reactivate Go High Level sub-account
    if (org.ghlLocationId && ghlService.isConfigured()) {
      console.log(`[GHL] Reactivating sub-account: ${org.ghlLocationId}`);
      await ghlService.reactivateSubAccount(org.ghlLocationId);
    }

    // Also unsuspend VMs
    await prisma.vM.updateMany({
      where: { orgId: org.id, status: "SUSPENDED" },
      data: { status: "RUNNING" }
    });

    res.json({ message: "Subscription reactivated" });
  } catch (err) {
    next(err);
  }
});

// Test account endpoint - bypasses Stripe for E2E testing
// Protected by TEST_ACCOUNT_SECRET environment variable
router.post("/test-account", async (req, res, next) => {
  try {
    const { plan, email, name, testCode, password } = req.body;
    const planKey = plan?.toUpperCase();

    // Validate test code
    if (!process.env.TEST_ACCOUNT_SECRET || testCode !== process.env.TEST_ACCOUNT_SECRET) {
      return res.status(403).json({ error: "Invalid test code" });
    }

    // Validate plan
    if (!planKey || !PLANS[planKey]) {
      return res.status(400).json({ error: "Invalid plan. Choose SOLO, TEAM, or ARMY" });
    }

    // Validate required fields
    if (!email || !name) {
      return res.status(400).json({ error: "Email and name are required" });
    }

    // Check if user already exists
    const existingUser = await prisma.user.findUnique({ where: { email } });
    if (existingUser) {
      return res.status(409).json({ error: "Email already registered. Use a unique test email." });
    }

    console.log(`[TEST] Creating test account: ${email}, plan: ${planKey}`);

    // Create password hash
    const bcrypt = require("bcryptjs");
    const userPassword = password || "TestPassword123!";
    const passwordHash = await bcrypt.hash(userPassword, 12);

    // Create user, org, subscription, and VM in transaction
    const result = await prisma.$transaction(async (tx) => {
      // 1. Create user
      const newUser = await tx.user.create({
        data: {
          name,
          email,
          passwordHash,
          orgRole: "OWNER"
        }
      });

      // 2. Create organization
      const newOrg = await tx.organization.create({
        data: {
          name: `${name}'s Organization`,
          ownerId: newUser.id,
          plan: planKey,
          seatLimit: PLANS[planKey].seats,
          members: { connect: { id: newUser.id } }
        }
      });

      // 3. Create subscription (fake Stripe ID for testing)
      const fakeStripeId = `test_sub_${Date.now()}`;
      const subscription = await tx.subscription.create({
        data: {
          orgId: newOrg.id,
          plan: planKey,
          stripeId: fakeStripeId,
          status: "active",
          renewsAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000) // 30 days
        }
      });

      return { user: newUser, org: newOrg, subscription };
    });

    // 4. Create VM and queue provisioning (outside transaction for queue)
    const templateVmid = PLANS[planKey].templateVmid;
    const newVmid = Date.now() % 100000 + 1000;
    const username = name.toLowerCase().replace(/[^a-z0-9]/g, "") || "testuser";
    const subdomain = `${username}-${newVmid}`;
    const isShared = planKey !== "SOLO";

    const vm = await prisma.vM.create({
      data: {
        vmid: newVmid,
        userId: isShared ? null : result.user.id,
        orgId: isShared ? result.org.id : null,
        isShared,
        subdomain,
        templateType: `ubuntu-${planKey.toLowerCase()}`,
        status: "PROVISIONING"
      }
    });

    // 5. Queue VM provisioning job
    await provisionQueue.add("provision", {
      userId: result.user.id,
      orgId: result.org.id,
      vmId: vm.id,
      vmid: newVmid,
      templateVmid,
      subdomain,
      username,
      isShared,
      plan: planKey
    });

    console.log(`[TEST] Created test account: user=${result.user.id}, org=${result.org.id}, vm=${vm.id}`);

    // Create Go High Level sub-account (free CRM for all customers)
    let ghlLocationId = null;
    if (ghlService.isConfigured()) {
      const ghlResult = await ghlService.createSubAccount({
        name: `${name}'s Business`,
        email: email,
        timezone: "America/New_York"
      });

      if (ghlResult.success) {
        ghlLocationId = ghlResult.locationId;
        await prisma.organization.update({
          where: { id: result.org.id },
          data: { ghlLocationId }
        });
        console.log(`[TEST][GHL] Sub-account created: ${ghlLocationId}`);
      }
    }

    // Return auth token so Playwright can use it
    const token = jwt.sign({ userId: result.user.id }, process.env.JWT_SECRET, { expiresIn: "7d" });

    res.status(201).json({
      success: true,
      userId: result.user.id,
      orgId: result.org.id,
      email,
      password: userPassword,
      subscription: {
        id: result.subscription.id,
        plan: planKey,
        status: result.subscription.status
      },
      vm: {
        id: vm.id,
        vmid: vm.vmid,
        subdomain,
        status: vm.status
      },
      token
    });
  } catch (err) {
    console.error("[TEST] Test account creation failed:", err);
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

          // Create Go High Level sub-account (free CRM for all customers)
          if (ghlService.isConfigured()) {
            const ghlResult = await ghlService.createSubAccount({
              name: `${name}'s Business`,
              email: email,
              timezone: "America/New_York"
            });

            if (ghlResult.success) {
              await prisma.organization.update({
                where: { id: orgId },
                data: { ghlLocationId: ghlResult.locationId }
              });
              console.log(`[GHL] Sub-account created for org ${orgId}: ${ghlResult.locationId}`);
            } else {
              console.log(`[GHL] Sub-account creation failed (non-blocking): ${ghlResult.error}`);
            }
          }
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

      if (userId && orgId) {
        // Check if org already has a VM (for upgrades/re-subscriptions)
        const existingOrgVM = await prisma.vM.findFirst({
          where: { orgId, status: { not: "DELETED" } }
        });

        const existingUserVM = await prisma.vM.findFirst({
          where: { userId, status: { not: "DELETED" } }
        });

        if (!existingOrgVM && !existingUserVM) {
          const templateVmid = PLANS[plan].templateVmid;
          const newVmid = Date.now() % 100000 + 1000;
          const username = (userName || "user").toLowerCase().replace(/[^a-z0-9]/g, "");
          const subdomain = `${username}-${newVmid}`;

          // SOLO = personal VM (userId), TEAM/ARMY = shared VM (orgId)
          const isShared = plan !== "SOLO";

          console.log(`Auto-provisioning ${isShared ? "shared" : "personal"} VM for ${isShared ? `org ${orgId}` : `user ${userId}`}`);

          const vm = await prisma.vM.create({
            data: {
              vmid: newVmid,
              userId: isShared ? null : userId,
              orgId: isShared ? orgId : null,
              isShared,
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
            username,
            isShared,
            plan
          });

          console.log(`Queued ${isShared ? "shared" : "personal"} VM ${newVmid} for provisioning`);
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

      // If subscription became past_due or unpaid, suspend GHL access
      if (sub.status === "past_due" || sub.status === "unpaid") {
        const subscription = await prisma.subscription.findFirst({
          where: { stripeId: sub.id },
          include: { org: true }
        });

        if (subscription?.org?.ghlLocationId && ghlService.isConfigured()) {
          console.log(`[GHL] Suspending sub-account due to ${sub.status}: ${subscription.org.ghlLocationId}`);
          await ghlService.suspendSubAccount(subscription.org.ghlLocationId);
        }
      }

      // If subscription became active again, reactivate GHL
      if (sub.status === "active" || sub.status === "trialing") {
        const subscription = await prisma.subscription.findFirst({
          where: { stripeId: sub.id },
          include: { org: true }
        });

        if (subscription?.org?.ghlLocationId && ghlService.isConfigured()) {
          console.log(`[GHL] Reactivating sub-account: ${subscription.org.ghlLocationId}`);
          await ghlService.reactivateSubAccount(subscription.org.ghlLocationId);
        }
      }
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
        // Suspend shared org VMs
        await prisma.vM.updateMany({
          where: { orgId: subscription.org.id, status: "RUNNING" },
          data: { status: "SUSPENDED" }
        });

        // Suspend personal user VMs
        const userIds = subscription.org.members.map(m => m.id);
        await prisma.vM.updateMany({
          where: { userId: { in: userIds }, status: "RUNNING" },
          data: { status: "SUSPENDED" }
        });

        // Suspend Go High Level sub-account
        if (subscription.org.ghlLocationId && ghlService.isConfigured()) {
          console.log(`[GHL] Suspending sub-account for canceled subscription: ${subscription.org.ghlLocationId}`);
          await ghlService.suspendSubAccount(subscription.org.ghlLocationId);
        }
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
