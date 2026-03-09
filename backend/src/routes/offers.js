const express = require('express');
const { PrismaClient } = require('@prisma/client');
const Stripe = require('stripe');
const path = require('path');
const fs = require('fs');
const bcrypt = require('bcryptjs');

const router = express.Router();
const prisma = new PrismaClient();
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

// POST /api/offers/checkout — Create Stripe checkout session
router.post('/checkout', async (req, res) => {
  try {
    const { price, email, name, bumpSolo } = req.body;
    if (!email || !price) return res.status(400).json({ error: 'Email and price are required' });

    const priceId = price === 5 ? process.env.STRIPE_PRICE_SKILLS_5 : process.env.STRIPE_PRICE_SKILLS_15;
    if (!priceId) return res.status(500).json({ error: 'Price not configured' });

    const lineItems = [];
    let mode = 'payment';

    if (bumpSolo) {
      // Bump = subscription mode with one-time skills + recurring SOLO
      mode = 'subscription';
      lineItems.push(
        { price: priceId, quantity: 1 },
        { price: process.env.STRIPE_PRICE_SOLO, quantity: 1 }
      );
    } else {
      lineItems.push({ price: priceId, quantity: 1 });
    }

    const session = await stripe.checkout.sessions.create({
      mode,
      customer_email: email,
      line_items: lineItems,
      success_url: `${process.env.FRONTEND_URL}/download?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${process.env.FRONTEND_URL}/offer/${price}`,
      metadata: {
        type: 'offer',
        price: String(price),
        email,
        name: name || '',
        bumpSolo: bumpSolo ? 'true' : 'false'
      }
    });

    res.json({ url: session.url });
  } catch (err) {
    console.error('[Offers] Checkout error:', err.message);
    res.status(500).json({ error: 'Failed to create checkout' });
  }
});

// POST /api/offers/webhook — Stripe webhook for offer purchases
router.post('/webhook', express.raw({ type: 'application/json' }), async (req, res) => {
  const sig = req.headers['stripe-signature'];
  let event;

  try {
    event = stripe.webhooks.constructEvent(req.body, sig, process.env.STRIPE_OFFER_WEBHOOK_SECRET);
  } catch (err) {
    console.error('[Offers] Webhook signature failed:', err.message);
    return res.status(400).send(`Webhook Error: ${err.message}`);
  }

  if (event.type === 'checkout.session.completed') {
    const session = event.data.object;
    const metadata = session.metadata || {};

    if (metadata.type !== 'offer') {
      return res.json({ received: true });
    }

    try {
      const email = metadata.email || session.customer_email;
      const name = metadata.name || '';
      const priceAmount = parseInt(metadata.price) || 0;
      const bumpSolo = metadata.bumpSolo === 'true';

      // Find product by price
      const priceId = priceAmount === 5 ? process.env.STRIPE_PRICE_SKILLS_5 : process.env.STRIPE_PRICE_SKILLS_15;
      let product = await prisma.product.findFirst({ where: { stripePriceId: priceId, active: true } });

      // Fallback: find any active product
      if (!product) {
        product = await prisma.product.findFirst({ where: { active: true } });
      }

      // Create purchase record
      const purchase = await prisma.purchase.create({
        data: {
          email,
          name,
          productId: product?.id || 'unknown',
          stripeSessionId: session.id,
          amountPaid: priceAmount * 100,
          bumpAdded: bumpSolo
        }
      });

      console.log(`[Offers] Purchase created: ${purchase.id} for ${email}`);

      // Send download email
      try {
        const { Resend } = require('resend');
        const resend = new Resend(process.env.RESEND_API_KEY);
        const downloadUrl = `${process.env.FRONTEND_URL}/download?session_id=${session.id}`;

        await resend.emails.send({
          from: `Cloud Code <${process.env.EMAIL_FROM || 'noreply@cloudcode.space'}>`,
          to: email,
          subject: 'Your Skills Bundle is Ready!',
          html: `
            <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto;">
              <h2>Your download is ready!</h2>
              <p>Hi ${name || 'there'},</p>
              <p>Thank you for your purchase! Your skills bundle is ready to download.</p>
              <a href="${downloadUrl}" style="display: inline-block; background: #06b6d4; color: white; padding: 12px 24px; text-decoration: none; border-radius: 8px; margin: 16px 0; font-weight: bold;">Download Now</a>
              <p style="color: #666; font-size: 12px;">You can download up to 5 times.</p>
              ${bumpSolo ? '<p><strong>Your Cloud VPS is being provisioned!</strong> You\'ll receive a separate email with your server credentials shortly.</p>' : ''}
            </div>
          `
        });

        // Send admin notification
        if (process.env.ADMIN_EMAIL) {
          await resend.emails.send({
            from: `Cloud Code <${process.env.EMAIL_FROM || 'noreply@cloudcode.space'}>`,
            to: process.env.ADMIN_EMAIL,
            subject: `New Offer Purchase: $${priceAmount} ${bumpSolo ? '+ SOLO bump' : ''}`,
            html: `<p><strong>${name}</strong> (${email}) purchased the $${priceAmount} skills bundle${bumpSolo ? ' with SOLO bump' : ''}.</p>`
          });
        }
      } catch (emailErr) {
        console.error('[Offers] Email error:', emailErr.message);
      }

      // Create GHL contact
      try {
        const ghlService = require('../services/GHLService');
        if (ghlService.isConfigured()) {
          await ghlService.createContact({
            email,
            name,
            source: `offer-$${priceAmount}`,
            tags: ['offer-buyer', `$${priceAmount}-bundle`, ...(bumpSolo ? ['solo-bump'] : [])]
          });
        }
      } catch (ghlErr) {
        console.error('[Offers] GHL error:', ghlErr.message);
      }

      // Fire Meta CAPI Purchase event
      try {
        const MetaCAPIService = require('../services/MetaCAPIService');
        if (MetaCAPIService.isConfigured && MetaCAPIService.isConfigured()) {
          await MetaCAPIService.sendEvent({
            eventName: 'Purchase',
            email,
            value: priceAmount,
            currency: 'USD',
            contentName: `Skills Bundle $${priceAmount}`
          });
        }
      } catch (capiErr) {
        console.error('[Offers] Meta CAPI error:', capiErr.message);
      }

      // If bump was added, create user + org + subscription + queue VM
      if (bumpSolo) {
        try {
          const crypto = require('crypto');
          const tempPassword = crypto.randomBytes(32).toString('hex');
          const passwordHash = await bcrypt.hash(tempPassword, 12);

          const result = await prisma.$transaction(async (tx) => {
            // Check if user already exists
            let user = await tx.user.findUnique({ where: { email } });
            if (user) return { user, existing: true };

            const newUser = await tx.user.create({
              data: { name: name || email.split('@')[0], email, passwordHash, orgRole: 'OWNER' }
            });
            const newOrg = await tx.organization.create({
              data: {
                name: `${name || email.split('@')[0]}'s Organization`,
                ownerId: newUser.id,
                plan: 'SOLO',
                seatLimit: 1,
                members: { connect: { id: newUser.id } }
              }
            });
            await tx.subscription.create({
              data: {
                orgId: newOrg.id,
                plan: 'SOLO',
                stripeId: session.subscription || session.id,
                status: 'active'
              }
            });
            return { user: newUser, org: newOrg, existing: false };
          });

          if (!result.existing) {
            // Queue VM provisioning
            const { Queue } = require('bullmq');
            const IORedis = require('ioredis');
            const redis = new IORedis(process.env.REDIS_URL || 'redis://localhost:6379', { maxRetriesPerRequest: null });
            const provisionQueue = new Queue('vm-provisioning', { connection: redis });

            const username = (name || email.split('@')[0]).toLowerCase().replace(/[^a-z0-9]/g, '') || 'user';
            const newVmid = Date.now() % 100000 + 1000;
            const subdomain = `${username}-${newVmid}`;

            const vm = await prisma.vM.create({
              data: {
                vmid: newVmid,
                userId: result.user.id,
                subdomain,
                templateType: 'ubuntu-solo',
                status: 'PROVISIONING'
              }
            });

            await provisionQueue.add('provision', {
              userId: result.user.id,
              orgId: result.org.id,
              vmId: vm.id,
              vmid: newVmid,
              templateVmid: parseInt(process.env.PROXMOX_TEMPLATE_SOLO) || 513,
              subdomain,
              username,
              isShared: false,
              plan: 'SOLO'
            });

            // Send password setup email
            const setupToken = crypto.randomBytes(32).toString('hex');
            await prisma.user.update({
              where: { id: result.user.id },
              data: {
                passwordResetToken: setupToken,
                passwordResetExpires: new Date(Date.now() + 72 * 60 * 60 * 1000)
              }
            });

            const { Resend } = require('resend');
            const resend = new Resend(process.env.RESEND_API_KEY);
            const setupUrl = `https://cloudcode.space/setup-password?token=${setupToken}`;
            await resend.emails.send({
              from: `Cloud Computer <${process.env.EMAIL_FROM || 'noreply@cloudcode.space'}>`,
              to: email,
              subject: 'Your Cloud VPS is Being Set Up!',
              html: `
                <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto;">
                  <h2>Welcome to Cloud Computer!</h2>
                  <p>Your SOLO VPS is being provisioned now. Set your dashboard password:</p>
                  <a href="${setupUrl}" style="display: inline-block; background: #06b6d4; color: white; padding: 12px 24px; text-decoration: none; border-radius: 8px; margin: 16px 0; font-weight: bold;">Set Your Password</a>
                </div>
              `
            });

            console.log(`[Offers] Bump: User + VM provisioned for ${email}`);
          }
        } catch (bumpErr) {
          console.error('[Offers] Bump provisioning error:', bumpErr.message);
        }
      }
    } catch (processErr) {
      console.error('[Offers] Webhook processing error:', processErr.message);
    }
  }

  res.json({ received: true });
});

// GET /api/offers/purchase/:sessionId — Get purchase info for download page
router.get('/purchase/:sessionId', async (req, res) => {
  try {
    const purchase = await prisma.purchase.findUnique({
      where: { stripeSessionId: req.params.sessionId },
      include: { product: { select: { name: true } } }
    });

    if (!purchase) return res.status(404).json({ error: 'Purchase not found' });

    res.json({
      email: purchase.email,
      productName: purchase.product?.name || 'Skills Bundle',
      downloadToken: purchase.downloadToken,
      bumpAdded: purchase.bumpAdded,
      downloadsRemaining: purchase.maxDownloads - purchase.downloadCount
    });
  } catch (err) {
    console.error('[Offers] Purchase lookup error:', err.message);
    res.status(500).json({ error: 'Failed to get purchase' });
  }
});

// GET /api/offers/download/:token — Download the product file
router.get('/download/:token', async (req, res) => {
  try {
    const purchase = await prisma.purchase.findUnique({
      where: { downloadToken: req.params.token },
      include: { product: true }
    });

    if (!purchase) return res.status(404).json({ error: 'Invalid download link' });
    if (purchase.downloadCount >= purchase.maxDownloads) {
      return res.status(403).json({ error: 'Download limit reached' });
    }

    // Increment download count
    await prisma.purchase.update({
      where: { id: purchase.id },
      data: { downloadCount: purchase.downloadCount + 1 }
    });

    // Serve file
    const filePath = purchase.product?.filePath
      ? path.resolve(purchase.product.filePath)
      : path.join(__dirname, '..', '..', 'public', 'claude-skills-ultimate-bundle.zip');

    if (!fs.existsSync(filePath)) {
      return res.status(404).json({ error: 'File not found' });
    }

    const fileName = purchase.product?.fileName || 'Claude-Skills-Bundle.zip';
    res.download(filePath, fileName);
  } catch (err) {
    console.error('[Offers] Download error:', err.message);
    res.status(500).json({ error: 'Download failed' });
  }
});

module.exports = router;
