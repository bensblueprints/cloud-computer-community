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
const vmUserService = require('../services/VMUserService');

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
    // Get personal VMs
    const personalVMs = await prisma.vM.findMany({
      where: { userId: req.userId, status: { not: 'DELETED' } },
      orderBy: { createdAt: 'desc' }
    });

    // Get org's shared VMs if user is part of an org
    let sharedVMs = [];
    if (req.user.orgId) {
      sharedVMs = await prisma.vM.findMany({
        where: {
          orgId: req.user.orgId,
          isShared: true,
          status: { not: 'DELETED' }
        },
        include: {
          org: { select: { name: true, plan: true } },
          vmUsers: {
            where: { userId: req.userId, status: { not: 'DELETED' } },
            select: { id: true, linuxUsername: true, status: true }
          }
        },
        orderBy: { createdAt: 'desc' }
      });

      // Add user's VMUser info to each shared VM
      sharedVMs = sharedVMs.map(vm => ({
        ...vm,
        userAccess: vm.vmUsers[0] || null,
        vmUsers: undefined // Don't expose all vmUsers
      }));
    }

    // Combine and dedupe (in case a personal VM is somehow also marked as shared)
    const allVMs = [...personalVMs, ...sharedVMs];
    const uniqueVMs = Array.from(new Map(allVMs.map(vm => [vm.id, vm])).values());

    res.json({ vms: uniqueVMs });
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

    // Only org owners can create VMs on shared plans (TEAM/ARMY)
    const isSharedPlan = plan === 'TEAM' || plan === 'ARMY';
    if (isSharedPlan && req.user.orgRole !== 'OWNER') {
      return res.status(403).json({ error: 'Only team owners can create environments. Contact your team owner.' });
    }

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

// Helper to check if user has access to a VM
async function userHasVMAccess(userId, userOrgId, vmId) {
  const vm = await prisma.vM.findUnique({
    where: { id: vmId },
    include: { vmUsers: { where: { userId, status: { not: 'DELETED' } } } }
  });

  if (!vm) return null;

  // Personal VM - must be owner
  if (vm.userId === userId) return vm;

  // Shared VM - must be in same org and have VMUser access
  if (vm.isShared && vm.orgId === userOrgId) {
    return vm;
  }

  return null;
}

router.get('/:id', auth, async (req, res, next) => {
  try {
    const vm = await userHasVMAccess(req.userId, req.user.orgId, req.params.id);
    if (!vm) return res.status(404).json({ error: 'VM not found' });

    // Add user's VMUser info if shared
    if (vm.isShared) {
      const vmUser = await prisma.vMUser.findUnique({
        where: { vmId_userId: { vmId: vm.id, userId: req.userId } }
      });
      vm.userAccess = vmUser ? {
        id: vmUser.id,
        linuxUsername: vmUser.linuxUsername,
        status: vmUser.status
      } : null;
    }

    res.json({ vm });
  } catch (err) {
    next(err);
  }
});

// Helper to check if user can manage (start/stop/delete) a VM
async function userCanManageVM(userId, userOrgRole, vmId) {
  const vm = await prisma.vM.findUnique({ where: { id: vmId } });
  if (!vm) return null;

  // Personal VM - must be owner
  if (vm.userId === userId) return vm;

  // Shared VM - only org OWNER can manage
  if (vm.isShared && userOrgRole === 'OWNER') return vm;

  return null;
}

router.post('/:id/start', auth, async (req, res, next) => {
  try {
    const vm = await userCanManageVM(req.userId, req.user.orgRole, req.params.id);
    if (!vm) return res.status(404).json({ error: 'VM not found or access denied' });

    await proxmoxService.startVM(vm.vmid);
    await prisma.vM.update({ where: { id: vm.id }, data: { status: 'RUNNING', lastActiveAt: new Date() } });
    res.json({ message: 'VM starting' });
  } catch (err) {
    next(err);
  }
});

router.post('/:id/stop', auth, async (req, res, next) => {
  try {
    const vm = await userCanManageVM(req.userId, req.user.orgRole, req.params.id);
    if (!vm) return res.status(404).json({ error: 'VM not found or access denied' });

    await proxmoxService.stopVM(vm.vmid);
    await prisma.vM.update({ where: { id: vm.id }, data: { status: 'STOPPED' } });
    res.json({ message: 'VM stopped' });
  } catch (err) {
    next(err);
  }
});

router.post('/:id/restart', auth, async (req, res, next) => {
  try {
    const vm = await userCanManageVM(req.userId, req.user.orgRole, req.params.id);
    if (!vm) return res.status(404).json({ error: 'VM not found or access denied' });

    await proxmoxService.restartVM(vm.vmid);
    await prisma.vM.update({ where: { id: vm.id }, data: { lastActiveAt: new Date() } });
    res.json({ message: 'VM restarting' });
  } catch (err) {
    next(err);
  }
});

// Rename VM
router.patch('/:id', auth, async (req, res, next) => {
  try {
    const vm = await userCanManageVM(req.userId, req.user.orgRole, req.params.id);
    if (!vm) return res.status(404).json({ error: 'VM not found or access denied' });

    const { name } = req.body;
    if (!name || name.length < 1 || name.length > 50) {
      return res.status(400).json({ error: 'Name must be between 1 and 50 characters' });
    }

    // Generate new subdomain from name
    const newSubdomain = `${name.toLowerCase().replace(/[^a-z0-9]/g, '')}-${vm.vmid}`;

    // Update VM in database
    const updatedVM = await prisma.vM.update({
      where: { id: vm.id },
      data: { subdomain: newSubdomain }
    });

    // Update Traefik route
    traefikService.deleteRoute(vm.vmid);
    traefikService.createRoute({
      vmid: vm.vmid,
      subdomain: newSubdomain,
      novncPort: vm.novncPort,
      rdpPort: vm.rdpPort
    });

    res.json({ vm: updatedVM, message: 'VM renamed successfully' });
  } catch (err) {
    if (err.code === 'P2002') {
      return res.status(409).json({ error: 'A VM with this name already exists' });
    }
    next(err);
  }
});

router.delete('/:id', auth, async (req, res, next) => {
  try {
    const vm = await userCanManageVM(req.userId, req.user.orgRole, req.params.id);
    if (!vm) return res.status(404).json({ error: 'VM not found or access denied' });

    // For shared VMs, also delete all VMUser records
    if (vm.isShared) {
      await prisma.vMUser.updateMany({
        where: { vmId: vm.id },
        data: { status: 'DELETED' }
      });
    }

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
    const vm = await userHasVMAccess(req.userId, req.user.orgId, req.params.id);
    if (!vm) return res.status(404).json({ error: 'VM not found' });

    const vncPassword = vm.vncPasswordEnc ? credentialService.decrypt(vm.vncPasswordEnc) : null;

    // For shared VMs, get user-specific credentials
    if (vm.isShared) {
      const vmUser = await prisma.vMUser.findUnique({
        where: { vmId_userId: { vmId: vm.id, userId: req.userId } }
      });

      if (!vmUser || vmUser.status !== 'ACTIVE') {
        return res.status(403).json({
          error: 'Your access is being set up. Please wait a moment.',
          status: vmUser?.status || 'NOT_FOUND'
        });
      }

      const rdpPassword = vmUser.rdpPasswordEnc ? credentialService.decrypt(vmUser.rdpPasswordEnc) : null;

      return res.json({
        isShared: true,
        sshHost: vm.internalIp || `${vm.subdomain}.cloudcode.space`,
        sshPort: 22,
        sshUsername: vmUser.linuxUsername,
        sshPassword: rdpPassword,
        sshCommand: `ssh ${vmUser.linuxUsername}@${vm.internalIp || vm.subdomain + '.cloudcode.space'}`,
        rdpHost: `${vm.subdomain}.cloudcode.space`,
        rdpPort: vm.rdpPort,
        rdpUsername: vmUser.linuxUsername,
        rdpPassword,
        vncHost: `${vm.subdomain}.cloudcode.space`,
        vncPort: vm.vncPort,
        vncPassword
      });
    }

    // Personal VM credentials
    const rdpPassword = vm.rdpPasswordEnc ? credentialService.decrypt(vm.rdpPasswordEnc) : null;

    res.json({
      isShared: false,
      sshHost: vm.internalIp || `${vm.subdomain}.cloudcode.space`,
      sshPort: 22,
      sshUsername: vm.rdpUsername,
      sshPassword: rdpPassword,
      sshCommand: `ssh ${vm.rdpUsername}@${vm.internalIp || vm.subdomain + '.cloudcode.space'}`,
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
    const vm = await userHasVMAccess(req.userId, req.user.orgId, req.params.id);
    if (!vm) return res.status(404).json({ error: 'VM not found' });
    if (vm.status !== 'RUNNING') return res.status(400).json({ error: 'VM must be running to reset passwords' });

    // For shared VMs, reset user's VMUser password
    if (vm.isShared) {
      const vmUser = await prisma.vMUser.findUnique({
        where: { vmId_userId: { vmId: vm.id, userId: req.userId } }
      });

      if (!vmUser) {
        return res.status(404).json({ error: 'User access not found' });
      }

      const result = await vmUserService.resetPassword(vmUser.id);
      return res.json({ message: 'Password reset successfully', password: result.password });
    }

    // Personal VM - reset VM credentials
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
    const vm = await userHasVMAccess(req.userId, req.user.orgId, req.params.id);
    if (!vm) return res.status(404).json({ error: 'VM not found' });

    let username = vm.rdpUsername;

    // For shared VMs, use the user's linux username
    if (vm.isShared) {
      const vmUser = await prisma.vMUser.findUnique({
        where: { vmId_userId: { vmId: vm.id, userId: req.userId } }
      });
      if (vmUser) {
        username = vmUser.linuxUsername;
      }
    }

    const rdpContent = credentialService.generateRDPFile(
      `${vm.subdomain}.cloudcode.space`, vm.rdpPort, username
    );

    res.setHeader('Content-Type', 'application/x-rdp');
    res.setHeader('Content-Disposition', `attachment; filename="${vm.subdomain}.rdp"`);
    res.send(rdpContent);
  } catch (err) {
    next(err);
  }
});

// Get VM users (for shared VMs)
router.get('/:id/users', auth, async (req, res, next) => {
  try {
    const vm = await prisma.vM.findUnique({ where: { id: req.params.id } });
    if (!vm) return res.status(404).json({ error: 'VM not found' });

    // Only org owners can view users on shared VMs
    if (!vm.isShared) {
      return res.status(400).json({ error: 'This is not a shared VM' });
    }

    if (vm.orgId !== req.user.orgId || req.user.orgRole !== 'OWNER') {
      return res.status(403).json({ error: 'Only org owners can manage VM users' });
    }

    const vmUsers = await prisma.vMUser.findMany({
      where: { vmId: vm.id, status: { not: 'DELETED' } },
      include: {
        user: { select: { id: true, name: true, email: true } }
      }
    });

    res.json({ vmUsers });
  } catch (err) {
    next(err);
  }
});

// Add user to shared VM
router.post('/:id/users', auth, async (req, res, next) => {
  try {
    const vm = await prisma.vM.findUnique({ where: { id: req.params.id } });
    if (!vm) return res.status(404).json({ error: 'VM not found' });

    if (!vm.isShared) {
      return res.status(400).json({ error: 'This is not a shared VM' });
    }

    if (vm.orgId !== req.user.orgId || req.user.orgRole !== 'OWNER') {
      return res.status(403).json({ error: 'Only org owners can add users to shared VMs' });
    }

    const { userId } = req.body;
    if (!userId) {
      return res.status(400).json({ error: 'userId is required' });
    }

    // Verify user is in the same org
    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user || user.orgId !== req.user.orgId) {
      return res.status(400).json({ error: 'User must be a member of your organization' });
    }

    // Check if user already has access
    const existingAccess = await prisma.vMUser.findUnique({
      where: { vmId_userId: { vmId: vm.id, userId } }
    });

    if (existingAccess && existingAccess.status !== 'DELETED') {
      return res.status(409).json({ error: 'User already has access to this VM' });
    }

    // Create or restore VMUser record
    const linuxUsername = user.name.toLowerCase().replace(/[^a-z0-9]/g, '').slice(0, 20) || 'user';

    const vmUser = await vmUserService.createVMUser(vm.id, userId, linuxUsername);

    res.status(201).json({ vmUser, message: 'User access added - provisioning in progress' });
  } catch (err) {
    next(err);
  }
});

// Remove user from shared VM
router.delete('/:id/users/:userId', auth, async (req, res, next) => {
  try {
    const vm = await prisma.vM.findUnique({ where: { id: req.params.id } });
    if (!vm) return res.status(404).json({ error: 'VM not found' });

    if (!vm.isShared) {
      return res.status(400).json({ error: 'This is not a shared VM' });
    }

    if (vm.orgId !== req.user.orgId || req.user.orgRole !== 'OWNER') {
      return res.status(403).json({ error: 'Only org owners can remove users from shared VMs' });
    }

    // Cannot remove yourself if you're the owner
    if (req.params.userId === req.userId) {
      return res.status(400).json({ error: 'Cannot remove yourself from the VM' });
    }

    const vmUser = await prisma.vMUser.findUnique({
      where: { vmId_userId: { vmId: vm.id, userId: req.params.userId } }
    });

    if (!vmUser || vmUser.status === 'DELETED') {
      return res.status(404).json({ error: 'User access not found' });
    }

    await vmUserService.deleteVMUser(vmUser.id);

    res.json({ message: 'User access removed' });
  } catch (err) {
    next(err);
  }
});

// Retry access - manually retry creating Linux user for stuck VMUsers
router.post('/:id/retry-access', auth, async (req, res, next) => {
  try {
    const vm = await userHasVMAccess(req.userId, req.user.orgId, req.params.id);
    if (!vm) return res.status(404).json({ error: 'VM not found' });

    if (!vm.isShared) {
      return res.status(400).json({ error: 'This endpoint is only for shared VMs' });
    }

    if (vm.status !== 'RUNNING') {
      return res.status(400).json({ error: 'VM must be running to retry access setup' });
    }

    // Get user's VMUser record
    const vmUser = await prisma.vMUser.findUnique({
      where: { vmId_userId: { vmId: vm.id, userId: req.userId } }
    });

    if (!vmUser) {
      return res.status(404).json({ error: 'No access record found. Contact your team owner.' });
    }

    // If already active and user wants to force recreate
    const forceRecreate = req.body.force === true;

    if (vmUser.status === 'ACTIVE' && !forceRecreate) {
      return res.json({
        message: 'Your access is already active',
        linuxUsername: vmUser.linuxUsername,
        status: 'ACTIVE'
      });
    }

    console.log(`[RetryAccess] Retrying access for user ${req.userId} on VM ${vm.vmid}`);

    // Check if guest agent is ready
    const agentReady = await proxmoxService.isGuestAgentReady(vm.vmid);
    if (!agentReady) {
      return res.status(503).json({
        error: 'VM guest agent not ready. Please wait a moment and try again.',
        retryAfter: 30
      });
    }

    // Try to create Linux user
    const password = credentialService.decrypt(vmUser.rdpPasswordEnc);

    try {
      // Check if user already exists
      const userExists = await proxmoxService.checkLinuxUserExists(vm.vmid, vmUser.linuxUsername);

      if (userExists) {
        // User exists, just reset password
        await proxmoxService.setLinuxUserPassword(vm.vmid, vmUser.linuxUsername, password);
        console.log(`[RetryAccess] Reset password for existing user ${vmUser.linuxUsername}`);
      } else {
        // Create new user
        await proxmoxService.createLinuxUser(vm.vmid, vmUser.linuxUsername, password, ['sudo', 'users']);
        console.log(`[RetryAccess] Created Linux user ${vmUser.linuxUsername}`);
      }

      // Mark as active
      await prisma.vMUser.update({
        where: { id: vmUser.id },
        data: { status: 'ACTIVE' }
      });
      console.log(`[RetryAccess] VMUser ${vmUser.id} marked ACTIVE at ${new Date().toISOString()}`);

      res.json({
        message: 'Access setup completed successfully',
        linuxUsername: vmUser.linuxUsername,
        status: 'ACTIVE'
      });
    } catch (linuxErr) {
      console.error(`[RetryAccess] Failed to create Linux user: ${linuxErr.message}`);

      // Still mark as ACTIVE so user can at least use VNC
      await prisma.vMUser.update({
        where: { id: vmUser.id },
        data: { status: 'ACTIVE' }
      });
      console.log(`[RetryAccess] VMUser ${vmUser.id} marked ACTIVE despite error: ${linuxErr.message}`);

      res.json({
        message: 'Access enabled (Linux user creation may have failed - VNC should still work)',
        linuxUsername: vmUser.linuxUsername,
        status: 'ACTIVE',
        warning: 'SSH/RDP may not work. Try VNC console instead.'
      });
    }
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
