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
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 7 * 24 * 60 * 60 * 1000
    });
    res.json({ user: { id: user.id, name: user.name, siteRole: user.siteRole } });
  } catch (err) {
    next(err);
  }
});

// All routes below require admin
router.use(auth, adminOnly);

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
      include: { vms: { where: { status: { not: 'DELETED' } } } }
    });
    if (!user) return res.status(404).json({ error: 'User not found' });

    for (const vm of user.vms) {
      try { await proxmoxService.deleteVM(vm.vmid); } catch (e) { /* ignore */ }
      traefikService.deleteRoute(vm.vmid);
    }

    await prisma.vM.updateMany({ where: { userId: user.id }, data: { status: 'DELETED' } });
    await prisma.user.delete({ where: { id: user.id } });
    res.json({ message: 'User deleted' });
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
    const { maintenanceMode, autoSuspendMinutes, proxmoxTemplateId } = req.body;
    const data = {};
    if (maintenanceMode !== undefined) data.maintenanceMode = maintenanceMode;
    if (autoSuspendMinutes) data.autoSuspendMinutes = autoSuspendMinutes;
    if (proxmoxTemplateId) data.proxmoxTemplateId = proxmoxTemplateId;

    const settings = await prisma.appSettings.update({ where: { id: 'singleton' }, data });
    res.json({ settings });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
