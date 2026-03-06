const express = require('express');
const { PrismaClient } = require('@prisma/client');
const { Queue } = require('bullmq');
const IORedis = require('ioredis');
const rateLimit = require('express-rate-limit');
const auth = require('../middleware/auth');
const seatGuard = require('../middleware/seatGuard');
const credentialService = require('../services/CredentialService');
const proxmoxService = require('../services/ProxmoxService');
const traefikService = require('../services/TraefikService');

const router = express.Router();
const prisma = new PrismaClient();
const redis = new IORedis(process.env.REDIS_URL || 'redis://localhost:6379', { maxRetriesPerRequest: null });
const provisionQueue = new Queue('vm-provisioning', { connection: redis });

const provisionLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 5,
  message: { error: 'Too many provisioning requests' }
});

// SSE connections map
const sseClients = new Map();

router.get('/', auth, async (req, res, next) => {
  try {
    const vms = await prisma.vM.findMany({
      where: { userId: req.userId, status: { not: 'DELETED' } },
      orderBy: { createdAt: 'desc' }
    });
    res.json({ vms });
  } catch (err) {
    next(err);
  }
});

// Template mapping per plan
const PLAN_TEMPLATES = {
  SOLO: parseInt(process.env.PROXMOX_TEMPLATE_SOLO) || 101,
  TEAM: parseInt(process.env.PROXMOX_TEMPLATE_TEAM) || 102,
  ARMY: parseInt(process.env.PROXMOX_TEMPLATE_ARMY) || 103
};

router.post('/', auth, seatGuard, provisionLimiter, async (req, res, next) => {
  try {
    const org = await prisma.organization.findUnique({ where: { id: req.user.orgId } });
    const plan = org?.plan || 'SOLO';
    const templateVmid = PLAN_TEMPLATES[plan] || 101;
    const newVmid = Date.now() % 100000 + 1000;
    const subdomain = `${req.user.name.toLowerCase().replace(/[^a-z0-9]/g, '')}-${newVmid}`;

    const vm = await prisma.vM.create({
      data: {
        vmid: newVmid,
        userId: req.userId,
        subdomain,
        templateType: `ubuntu-${plan.toLowerCase()}`,
        status: 'PROVISIONING'
      }
    });

    const job = await provisionQueue.add('provision', {
      userId: req.userId,
      orgId: req.user.orgId,
      vmId: vm.id,
      vmid: newVmid,
      templateVmid,
      subdomain,
      username: req.user.name.toLowerCase().replace(/[^a-z0-9]/g, '')
    });

    res.status(202).json({ vm, jobId: job.id });
  } catch (err) {
    next(err);
  }
});

router.get('/:id', auth, async (req, res, next) => {
  try {
    const vm = await prisma.vM.findFirst({
      where: { id: req.params.id, userId: req.userId }
    });
    if (!vm) return res.status(404).json({ error: 'VM not found' });
    res.json({ vm });
  } catch (err) {
    next(err);
  }
});

router.post('/:id/start', auth, async (req, res, next) => {
  try {
    const vm = await prisma.vM.findFirst({ where: { id: req.params.id, userId: req.userId } });
    if (!vm) return res.status(404).json({ error: 'VM not found' });

    await proxmoxService.startVM(vm.vmid);
    await prisma.vM.update({ where: { id: vm.id }, data: { status: 'RUNNING', lastActiveAt: new Date() } });
    res.json({ message: 'VM starting' });
  } catch (err) {
    next(err);
  }
});

router.post('/:id/stop', auth, async (req, res, next) => {
  try {
    const vm = await prisma.vM.findFirst({ where: { id: req.params.id, userId: req.userId } });
    if (!vm) return res.status(404).json({ error: 'VM not found' });

    await proxmoxService.stopVM(vm.vmid);
    await prisma.vM.update({ where: { id: vm.id }, data: { status: 'STOPPED' } });
    res.json({ message: 'VM stopped' });
  } catch (err) {
    next(err);
  }
});

router.post('/:id/restart', auth, async (req, res, next) => {
  try {
    const vm = await prisma.vM.findFirst({ where: { id: req.params.id, userId: req.userId } });
    if (!vm) return res.status(404).json({ error: 'VM not found' });

    await proxmoxService.restartVM(vm.vmid);
    await prisma.vM.update({ where: { id: vm.id }, data: { lastActiveAt: new Date() } });
    res.json({ message: 'VM restarting' });
  } catch (err) {
    next(err);
  }
});

router.delete('/:id', auth, async (req, res, next) => {
  try {
    const vm = await prisma.vM.findFirst({ where: { id: req.params.id, userId: req.userId } });
    if (!vm) return res.status(404).json({ error: 'VM not found' });

    try { await proxmoxService.deleteVM(vm.vmid); } catch (e) { /* may already be gone */ }
    traefikService.deleteRoute(vm.vmid);
    await prisma.vM.update({ where: { id: vm.id }, data: { status: 'DELETED' } });
    res.json({ message: 'VM deleted' });
  } catch (err) {
    next(err);
  }
});

router.get('/:id/credentials', auth, async (req, res, next) => {
  try {
    const vm = await prisma.vM.findFirst({ where: { id: req.params.id, userId: req.userId } });
    if (!vm) return res.status(404).json({ error: 'VM not found' });

    const rdpPassword = vm.rdpPasswordEnc ? credentialService.decrypt(vm.rdpPasswordEnc) : null;
    const vncPassword = vm.vncPasswordEnc ? credentialService.decrypt(vm.vncPasswordEnc) : null;

    res.json({
      rdpHost: `${vm.subdomain}.cloudcode.space`,
      rdpPort: vm.rdpPort,
      rdpUsername: vm.rdpUsername,
      rdpPassword,
      vncHost: `${vm.subdomain}.cloudcode.space`,
      vncPort: vm.vncPort,
      vncPassword
    });
  } catch (err) {
    next(err);
  }
});

router.post('/:id/reset-password', auth, async (req, res, next) => {
  try {
    const vm = await prisma.vM.findFirst({ where: { id: req.params.id, userId: req.userId } });
    if (!vm) return res.status(404).json({ error: 'VM not found' });
    if (vm.status !== 'RUNNING') return res.status(400).json({ error: 'VM must be running to reset passwords' });

    const rdpPassword = credentialService.generatePassword(16);
    const vncPassword = credentialService.generateVNCPassword();

    await proxmoxService.setRDPPassword(vm.vmid, rdpPassword);
    await proxmoxService.setVNCPassword(vm.vmid, vncPassword);

    await prisma.vM.update({
      where: { id: vm.id },
      data: {
        rdpPasswordEnc: credentialService.encrypt(rdpPassword),
        vncPasswordEnc: credentialService.encrypt(vncPassword)
      }
    });

    res.json({ message: 'Passwords reset successfully' });
  } catch (err) {
    next(err);
  }
});

router.get('/:id/rdp-file', auth, async (req, res, next) => {
  try {
    const vm = await prisma.vM.findFirst({ where: { id: req.params.id, userId: req.userId } });
    if (!vm) return res.status(404).json({ error: 'VM not found' });

    const rdpContent = credentialService.generateRDPFile(
      `${vm.subdomain}.cloudcode.space`, vm.rdpPort, vm.rdpUsername
    );

    res.setHeader('Content-Type', 'application/x-rdp');
    res.setHeader('Content-Disposition', `attachment; filename="${vm.subdomain}.rdp"`);
    res.send(rdpContent);
  } catch (err) {
    next(err);
  }
});

router.get('/:id/sse', auth, (req, res) => {
  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');
  res.flushHeaders();

  const clientKey = `${req.userId}:${req.params.id}`;
  sseClients.set(clientKey, res);

  req.on('close', () => {
    sseClients.delete(clientKey);
  });
});

function emitSSE(userId, vmId, data) {
  const clientKey = `${userId}:${vmId}`;
  const client = sseClients.get(clientKey);
  if (client) {
    client.write(`data: ${JSON.stringify(data)}\n\n`);
  }
}

module.exports = router;
module.exports.emitSSE = emitSSE;
