const express = require('express');
const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const auth = require('../middleware/auth');
const adminOnly = require('../middleware/adminOnly');
const auditLog = require('../middleware/auditLog');
const proxmoxService = require('../services/ProxmoxService');
const traefikService = require('../services/TraefikService');

const router = express.Router();
const prisma = new PrismaClient();

// Admin login
router.post('/auth/login', async (req, res, next) => {
  try {
    const { email, password } = req.body;
    const user = await prisma.user.findUnique({ where: { email } });

    if (!user || user.siteRole !== 'ADMIN') {
      return res.status(403).json({ error: 'Access denied' });
    }
    if (!(await bcrypt.compare(password, user.passwordHash))) {
      return res.status(403).json({ error: 'Access denied' });
    }

    const token = jwt.sign({ userId: user.id }, process.env.JWT_SECRET, { expiresIn: '7d' });
    res.cookie('token', token, {
      httpOnly: true,
      secure: true,
      sameSite: 'lax',
      domain: '.cloudcode.space',
      path: '/',
      maxAge: 7 * 24 * 60 * 60 * 1000
    });
    res.json({ user: { id: user.id, name: user.name, siteRole: user.siteRole } });
  } catch (err) {
    next(err);
  }
});

// Impersonate user (login as user from admin)
router.post('/impersonate/:userId', auth, adminOnly, auditLog('admin.impersonate'), async (req, res, next) => {
  try {
    const targetUser = await prisma.user.findUnique({ where: { id: req.params.userId } });
    if (!targetUser) return res.status(404).json({ error: 'User not found' });

    const token = jwt.sign({ userId: targetUser.id }, process.env.JWT_SECRET, { expiresIn: '7d' });
    res.cookie('token', token, {
      httpOnly: true,
      secure: true,
      sameSite: 'lax',
      domain: '.cloudcode.space',
      path: '/',
      maxAge: 7 * 24 * 60 * 60 * 1000
    });
    res.json({ message: `Now logged in as ${targetUser.name}`, redirectUrl: '/dashboard' });
  } catch (err) {
    next(err);
  }
});

// All routes below require admin
router.use(auth, adminOnly);

// Create user manually with plan + auto-provision VM
router.post('/users', auditLog('admin.user.create'), async (req, res, next) => {
  try {
    const { name, email, password, plan } = req.body;
    if (!name || !email || !password || !plan) {
      return res.status(400).json({ error: 'name, email, password, and plan are required' });
    }
    const planKey = plan.toUpperCase();
    const PLANS = {
      SOLO: { seats: 1, templateVmid: parseInt(process.env.PROXMOX_TEMPLATE_SOLO) || 513 },
      TEAM: { seats: 5, templateVmid: parseInt(process.env.PROXMOX_TEMPLATE_TEAM) || 514 },
      ARMY: { seats: 25, templateVmid: parseInt(process.env.PROXMOX_TEMPLATE_ARMY) || 515 }
    };
    if (!PLANS[planKey]) {
      return res.status(400).json({ error: 'Invalid plan. Choose SOLO, TEAM, or ARMY' });
    }

    const existing = await prisma.user.findUnique({ where: { email } });
    if (existing) {
      return res.status(409).json({ error: 'Email already registered' });
    }

    const passwordHash = await bcrypt.hash(password, 12);

    // Create user + org + subscription in transaction
    const result = await prisma.$transaction(async (tx) => {
      const newUser = await tx.user.create({
        data: { name, email, passwordHash, orgRole: 'OWNER' }
      });
      const newOrg = await tx.organization.create({
        data: {
          name: `${name}'s Organization`,
          ownerId: newUser.id,
          plan: planKey,
          seatLimit: PLANS[planKey].seats,
          members: { connect: { id: newUser.id } }
        }
      });
      const subscription = await tx.subscription.create({
        data: {
          orgId: newOrg.id,
          plan: planKey,
          stripeId: `admin_manual_${Date.now()}`,
          status: 'active',
          renewsAt: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000)
        }
      });
      return { user: newUser, org: newOrg, subscription };
    });

    // Create GHL sub-account
    let ghlLocationId = null;
    const ghlService = require('../services/GHLService');
    if (ghlService.isConfigured()) {
      const ghlResult = await ghlService.createSubAccount({
        name: `${name}'s Business`,
        email,
        timezone: 'America/New_York'
      });
      if (ghlResult.success) {
        ghlLocationId = ghlResult.locationId;
        await prisma.organization.update({
          where: { id: result.org.id },
          data: { ghlLocationId }
        });
      }
    }

    // Provision VM
    const templateVmid = PLANS[planKey].templateVmid;
    const newVmid = Date.now() % 100000 + 1000;
    const username = name.toLowerCase().replace(/[^a-z0-9]/g, '') || 'user';
    const subdomain = `${username}-${newVmid}`;
    const isShared = planKey !== 'SOLO';

    const vm = await prisma.vM.create({
      data: {
        vmid: newVmid,
        userId: isShared ? null : result.user.id,
        orgId: isShared ? result.org.id : null,
        isShared,
        subdomain,
        templateType: `ubuntu-${planKey.toLowerCase()}`,
        status: 'PROVISIONING'
      }
    });

    // Queue provisioning job
    const { Queue } = require('bullmq');
    const IORedis = require('ioredis');
    const redis = new IORedis(process.env.REDIS_URL || 'redis://localhost:6379', { maxRetriesPerRequest: null });
    const provisionQueue = new Queue('vm-provisioning', { connection: redis });
    await provisionQueue.add('provision', {
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

    console.log(`[Admin] Created user ${email} with ${planKey} plan, VM ${newVmid} queued`);

    res.status(201).json({
      user: { id: result.user.id, name, email },
      org: { id: result.org.id, plan: planKey },
      vm: { id: vm.id, vmid: newVmid, subdomain, status: 'PROVISIONING' },
      ghlLocationId
    });
  } catch (err) {
    next(err);
  }
});

// Users
router.get('/users', async (req, res, next) => {
  try {
    const { page = 1, limit = 20, search, plan, status } = req.query;
    const where = {};
    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { email: { contains: search, mode: 'insensitive' } }
      ];
    }
    if (status === 'suspended') where.suspended = true;
    if (status === 'active') where.suspended = false;

    const [users, total] = await Promise.all([
      prisma.user.findMany({
        where,
        include: { org: true, vms: { where: { status: { not: 'DELETED' } } } },
        skip: (page - 1) * limit,
        take: parseInt(limit),
        orderBy: { createdAt: 'desc' }
      }),
      prisma.user.count({ where })
    ]);

    res.json({ users, total, page: parseInt(page), pages: Math.ceil(total / limit) });
  } catch (err) {
    next(err);
  }
});

router.get('/users/:id', async (req, res, next) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.params.id },
      include: { org: true, vms: true, auditLogs: { take: 10, orderBy: { createdAt: 'desc' } } }
    });
    if (!user) return res.status(404).json({ error: 'User not found' });
    res.json({ user });
  } catch (err) {
    next(err);
  }
});

router.patch('/users/:id', auditLog('admin.user.update'), async (req, res, next) => {
  try {
    const { suspended, siteRole, resetPassword } = req.body;
    const data = {};
    if (suspended !== undefined) data.suspended = suspended;
    if (siteRole) data.siteRole = siteRole;
    if (resetPassword) data.passwordHash = await bcrypt.hash(resetPassword, 12);

    const user = await prisma.user.update({ where: { id: req.params.id }, data });
    res.json({ user });
  } catch (err) {
    next(err);
  }
});

router.delete('/users/:id', auditLog('admin.user.delete'), async (req, res, next) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.params.id },
      include: {
        vms: { where: { status: { not: 'DELETED' } } },
        org: { include: { subscription: true, sharedVMs: { where: { status: { not: 'DELETED' } } } } }
      }
    });
    if (!user) return res.status(404).json({ error: 'User not found' });

    // Delete personal VMs from Proxmox
    for (const vm of user.vms) {
      try { await proxmoxService.stopVM(vm.vmid); } catch (e) { /* ignore */ }
      try { await proxmoxService.deleteVM(vm.vmid); } catch (e) { /* ignore */ }
      traefikService.deleteRoute(vm.vmid);
    }

    // Delete org shared VMs from Proxmox (if user is the owner)
    if (user.org && user.org.ownerId === user.id && user.org.sharedVMs) {
      for (const vm of user.org.sharedVMs) {
        try { await proxmoxService.stopVM(vm.vmid); } catch (e) { /* ignore */ }
        try { await proxmoxService.deleteVM(vm.vmid); } catch (e) { /* ignore */ }
        traefikService.deleteRoute(vm.vmid);
      }
    }

    // Cancel Stripe subscription if exists
    if (user.org?.subscription?.stripeId) {
      const Stripe = require('stripe');
      const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);
      try { await stripe.subscriptions.cancel(user.org.subscription.stripeId); } catch (e) { console.log('[Admin] Stripe cancel:', e.message); }
    }

    // Delete GHL sub-account if exists
    if (user.org?.ghlLocationId) {
      const ghlService = require('../services/GHLService');
      if (ghlService.isConfigured()) {
        try { await ghlService.deleteSubAccount(user.org.ghlLocationId); } catch (e) { console.log('[Admin] GHL delete:', e.message); }
      }
    }

    // Cascade delete all DB records
    await prisma.$transaction([
      prisma.vMUser.deleteMany({ where: { userId: user.id } }),
      prisma.vM.updateMany({ where: { userId: user.id }, data: { status: 'DELETED' } }),
      ...(user.org && user.org.ownerId === user.id ? [
        prisma.vMUser.deleteMany({ where: { vm: { orgId: user.org.id } } }),
        prisma.vM.updateMany({ where: { orgId: user.org.id }, data: { status: 'DELETED' } }),
        prisma.subscription.deleteMany({ where: { orgId: user.org.id } }),
        prisma.invite.deleteMany({ where: { orgId: user.org.id } }),
        prisma.user.updateMany({ where: { orgId: user.org.id, id: { not: user.id } }, data: { orgId: null } }),
        prisma.organization.delete({ where: { id: user.org.id } }),
      ] : []),
      prisma.auditLog.deleteMany({ where: { userId: user.id } }),
      prisma.user.delete({ where: { id: user.id } }),
    ]);

    res.json({ message: 'User and all instances deleted' });
  } catch (err) {
    next(err);
  }
});

// Orgs
router.get('/orgs', async (req, res, next) => {
  try {
    const orgs = await prisma.organization.findMany({
      include: { owner: { select: { name: true, email: true } }, subscription: true, members: true }
    });
    res.json({ orgs });
  } catch (err) {
    next(err);
  }
});

router.patch('/orgs/:id', auditLog('admin.org.update'), async (req, res, next) => {
  try {
    const { plan, seatLimit } = req.body;
    const data = {};
    if (plan) data.plan = plan;
    if (seatLimit) data.seatLimit = seatLimit;

    const org = await prisma.organization.update({ where: { id: req.params.id }, data });
    res.json({ org });
  } catch (err) {
    next(err);
  }
});

// VMs
router.get('/vms', async (req, res, next) => {
  try {
    const { status } = req.query;
    const where = status ? { status } : {};
    const vms = await prisma.vM.findMany({
      where,
      include: { user: { select: { name: true, email: true } } },
      orderBy: { createdAt: 'desc' }
    });
    res.json({ vms });
  } catch (err) {
    next(err);
  }
});

router.post('/vms/:id/start', auditLog('admin.vm.start'), async (req, res, next) => {
  try {
    const vm = await prisma.vM.findUnique({ where: { id: req.params.id } });
    if (!vm) return res.status(404).json({ error: 'VM not found' });
    await proxmoxService.startVM(vm.vmid);
    await prisma.vM.update({ where: { id: vm.id }, data: { status: 'RUNNING' } });
    res.json({ message: 'VM started' });
  } catch (err) {
    next(err);
  }
});

router.post('/vms/:id/stop', auditLog('admin.vm.stop'), async (req, res, next) => {
  try {
    const vm = await prisma.vM.findUnique({ where: { id: req.params.id } });
    if (!vm) return res.status(404).json({ error: 'VM not found' });
    await proxmoxService.stopVM(vm.vmid);
    await prisma.vM.update({ where: { id: vm.id }, data: { status: 'STOPPED' } });
    res.json({ message: 'VM stopped' });
  } catch (err) {
    next(err);
  }
});

router.delete('/vms/:id', auditLog('admin.vm.delete'), async (req, res, next) => {
  try {
    const vm = await prisma.vM.findUnique({ where: { id: req.params.id } });
    if (!vm) return res.status(404).json({ error: 'VM not found' });
    try { await proxmoxService.deleteVM(vm.vmid); } catch (e) { /* ignore */ }
    traefikService.deleteRoute(vm.vmid);
    await prisma.vM.update({ where: { id: vm.id }, data: { status: 'DELETED' } });
    res.json({ message: 'VM deleted' });
  } catch (err) {
    next(err);
  }
});

// Proxmox monitor
router.get('/proxmox/status', async (req, res, next) => {
  try {
    const stats = await proxmoxService.getNodeStats();
    res.json({ stats });
  } catch (err) {
    next(err);
  }
});

router.get('/proxmox/vms', async (req, res, next) => {
  try {
    const vms = await proxmoxService.listAllVMs();
    res.json({ vms });
  } catch (err) {
    next(err);
  }
});

// Proxmox direct VM actions (by vmid, not database ID)
router.post('/proxmox/vms/:vmid/stop', auditLog('admin.proxmox.stop'), async (req, res, next) => {
  try {
    await proxmoxService.stopVM(req.params.vmid);
    res.json({ message: `Proxmox VM ${req.params.vmid} stopped` });
  } catch (err) {
    next(err);
  }
});

router.delete('/proxmox/vms/:vmid', auditLog('admin.proxmox.destroy'), async (req, res, next) => {
  try {
    const vmid = parseInt(req.params.vmid);

    // Stop the VM first
    try { await proxmoxService.stopVM(vmid); } catch (e) { /* may already be stopped */ }

    // Wait for VM to actually stop (poll status up to 30s)
    for (let i = 0; i < 15; i++) {
      try {
        const status = await proxmoxService.getVMStatus(vmid);
        if (status.status === 'stopped') break;
      } catch (e) { break; }
      await new Promise(r => setTimeout(r, 2000));
    }

    // Now destroy
    await proxmoxService.deleteVM(vmid);

    // Clean up database record and traefik route if they exist
    const dbVm = await prisma.vM.findFirst({ where: { vmid } });
    if (dbVm) {
      await prisma.vMUser.deleteMany({ where: { vmId: dbVm.id } });
      await prisma.vM.update({ where: { id: dbVm.id }, data: { status: 'DELETED' } });
      traefikService.deleteRoute(vmid);
    }
    res.json({ message: `Proxmox VM ${vmid} destroyed` });
  } catch (err) {
    next(err);
  }
});

// Audit log
router.get('/audit-log', async (req, res, next) => {
  try {
    const { page = 1, limit = 20, userId, action, from, to } = req.query;
    const where = {};
    if (userId) where.userId = userId;
    if (action) where.action = { contains: action };
    if (from || to) {
      where.createdAt = {};
      if (from) where.createdAt.gte = new Date(from);
      if (to) where.createdAt.lte = new Date(to);
    }

    const [logs, total] = await Promise.all([
      prisma.auditLog.findMany({
        where,
        include: { user: { select: { name: true, email: true } } },
        skip: (page - 1) * limit,
        take: parseInt(limit),
        orderBy: { createdAt: 'desc' }
      }),
      prisma.auditLog.count({ where })
    ]);

    res.json({ logs, total, page: parseInt(page), pages: Math.ceil(total / limit) });
  } catch (err) {
    next(err);
  }
});

// Stripe billing management
const Stripe = require('stripe');
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

// Get subscription details + payment history
router.get('/billing/:orgId', async (req, res, next) => {
  try {
    const org = await prisma.organization.findUnique({
      where: { id: req.params.orgId },
      include: { subscription: true, owner: { select: { name: true, email: true } } }
    });
    if (!org) return res.status(404).json({ error: 'Organization not found' });
    if (!org.subscription?.stripeId || org.subscription.stripeId.startsWith('admin_manual') || org.subscription.stripeId.startsWith('test_sub')) {
      return res.json({ org, subscription: org.subscription, invoices: [], isManual: true });
    }

    const sub = await stripe.subscriptions.retrieve(org.subscription.stripeId);
    const invoices = await stripe.invoices.list({ subscription: org.subscription.stripeId, limit: 20 });
    const charges = await stripe.charges.list({ customer: sub.customer, limit: 20 });

    res.json({
      org,
      subscription: { ...org.subscription, stripe: sub },
      invoices: invoices.data.map(inv => ({
        id: inv.id,
        amount: inv.amount_paid / 100,
        currency: inv.currency,
        status: inv.status,
        date: new Date(inv.created * 1000),
        pdf: inv.invoice_pdf,
        hostedUrl: inv.hosted_invoice_url
      })),
      charges: charges.data.map(ch => ({
        id: ch.id,
        amount: ch.amount / 100,
        currency: ch.currency,
        status: ch.status,
        date: new Date(ch.created * 1000),
        refunded: ch.refunded,
        refundedAmount: ch.amount_refunded / 100,
        last4: ch.payment_method_details?.card?.last4,
        brand: ch.payment_method_details?.card?.brand
      }))
    });
  } catch (err) {
    next(err);
  }
});

// Cancel subscription
router.post('/billing/:orgId/cancel', auditLog('admin.billing.cancel'), async (req, res, next) => {
  try {
    const org = await prisma.organization.findUnique({
      where: { id: req.params.orgId },
      include: { subscription: true }
    });
    if (!org?.subscription) return res.status(404).json({ error: 'No subscription' });

    if (!org.subscription.stripeId.startsWith('admin_manual') && !org.subscription.stripeId.startsWith('test_sub')) {
      await stripe.subscriptions.cancel(org.subscription.stripeId);
    }

    await prisma.subscription.update({
      where: { id: org.subscription.id },
      data: { status: 'canceled' }
    });

    // Suspend VMs
    await prisma.vM.updateMany({
      where: { orgId: org.id, status: 'RUNNING' },
      data: { status: 'SUSPENDED' }
    });

    res.json({ message: 'Subscription canceled' });
  } catch (err) {
    next(err);
  }
});

// Pause subscription (cancel at period end)
router.post('/billing/:orgId/pause', auditLog('admin.billing.pause'), async (req, res, next) => {
  try {
    const org = await prisma.organization.findUnique({
      where: { id: req.params.orgId },
      include: { subscription: true }
    });
    if (!org?.subscription) return res.status(404).json({ error: 'No subscription' });

    if (!org.subscription.stripeId.startsWith('admin_manual') && !org.subscription.stripeId.startsWith('test_sub')) {
      await stripe.subscriptions.update(org.subscription.stripeId, { cancel_at_period_end: true });
    }

    await prisma.subscription.update({
      where: { id: org.subscription.id },
      data: { status: 'canceling' }
    });

    res.json({ message: 'Subscription paused (cancels at period end)' });
  } catch (err) {
    next(err);
  }
});

// Resume paused subscription
router.post('/billing/:orgId/resume', auditLog('admin.billing.resume'), async (req, res, next) => {
  try {
    const org = await prisma.organization.findUnique({
      where: { id: req.params.orgId },
      include: { subscription: true }
    });
    if (!org?.subscription) return res.status(404).json({ error: 'No subscription' });

    if (!org.subscription.stripeId.startsWith('admin_manual') && !org.subscription.stripeId.startsWith('test_sub')) {
      await stripe.subscriptions.update(org.subscription.stripeId, { cancel_at_period_end: false });
    }

    await prisma.subscription.update({
      where: { id: org.subscription.id },
      data: { status: 'active', cancelAt: null }
    });

    res.json({ message: 'Subscription resumed' });
  } catch (err) {
    next(err);
  }
});

// Refund a charge
router.post('/billing/refund/:chargeId', auditLog('admin.billing.refund'), async (req, res, next) => {
  try {
    const { amount } = req.body; // optional partial amount in dollars
    const params = { charge: req.params.chargeId };
    if (amount) params.amount = Math.round(amount * 100);

    const refund = await stripe.refunds.create(params);
    res.json({ message: 'Refund issued', refund: { id: refund.id, amount: refund.amount / 100, status: refund.status } });
  } catch (err) {
    next(err);
  }
});

// Settings
router.get('/settings', async (req, res, next) => {
  try {
    let settings = await prisma.appSettings.findUnique({ where: { id: 'singleton' } });
    if (!settings) {
      settings = await prisma.appSettings.create({ data: { id: 'singleton' } });
    }
    res.json({ settings });
  } catch (err) {
    next(err);
  }
});

router.patch('/settings', auditLog('admin.settings.update'), async (req, res, next) => {
  try {
    const { maintenanceMode, autoSuspendMinutes, proxmoxTemplateId, klaviyoApiKey, ghlPipelineId, ghlApiKey, googleSearchConsole } = req.body;
    const data = {};
    if (maintenanceMode !== undefined) data.maintenanceMode = maintenanceMode;
    if (autoSuspendMinutes) data.autoSuspendMinutes = autoSuspendMinutes;
    if (proxmoxTemplateId) data.proxmoxTemplateId = proxmoxTemplateId;
    if (klaviyoApiKey !== undefined) data.klaviyoApiKey = klaviyoApiKey;
    if (ghlPipelineId !== undefined) data.ghlPipelineId = ghlPipelineId;
    if (ghlApiKey !== undefined) data.ghlApiKey = ghlApiKey;
    if (googleSearchConsole !== undefined) data.googleSearchConsole = googleSearchConsole;

    const settings = await prisma.appSettings.update({ where: { id: 'singleton' }, data });
    res.json({ settings });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
