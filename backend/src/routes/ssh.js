const express = require('express');
const { PrismaClient } = require('@prisma/client');
const jwt = require('jsonwebtoken');
const auth = require('../middleware/auth');
const credentialService = require('../services/CredentialService');

const router = express.Router();
const prisma = new PrismaClient();

// Get SSH connection token for a VM
router.get('/:vmid/token', auth, async (req, res, next) => {
  try {
    const vmid = parseInt(req.params.vmid);

    // Find personal VM
    let vm = await prisma.vM.findFirst({
      where: { vmid, userId: req.userId }
    });

    let sshUsername = null;
    let sshPassword = null;

    // If not found, check for shared VM in user's org
    if (!vm && req.user.orgId) {
      vm = await prisma.vM.findFirst({
        where: {
          vmid,
          orgId: req.user.orgId,
          isShared: true
        },
        include: {
          vmUsers: {
            where: { userId: req.userId, status: 'ACTIVE' }
          }
        }
      });

      if (vm && vm.vmUsers.length === 0) {
        return res.status(403).json({ error: 'You do not have access to this VM' });
      }

      // For shared VMs, use the VMUser's credentials
      if (vm && vm.vmUsers.length > 0) {
        const vmUser = vm.vmUsers[0];
        sshUsername = vmUser.linuxUsername;
        sshPassword = vmUser.rdpPasswordEnc ? credentialService.decrypt(vmUser.rdpPasswordEnc) : null;
      }
    }

    if (!vm) return res.status(404).json({ error: 'VM not found' });
    if (vm.status !== 'RUNNING') return res.status(400).json({ error: 'VM is not running' });

    // For personal VMs, use the VM's credentials
    if (!sshUsername) {
      sshUsername = vm.rdpUsername || 'cloudcomputer';
      sshPassword = vm.rdpPasswordEnc ? credentialService.decrypt(vm.rdpPasswordEnc) : 'AI@123456';
    }

    if (!vm.internalIp) {
      return res.status(400).json({ error: 'VM has no internal IP yet. Try again shortly.' });
    }

    // Update last active
    await prisma.vM.update({
      where: { id: vm.id },
      data: { lastActiveAt: new Date() }
    });

    const token = jwt.sign(
      {
        vmid,
        userId: req.userId,
        sshHost: vm.internalIp,
        sshUsername,
        sshPassword,
        iat: Math.floor(Date.now() / 1000)
      },
      process.env.JWT_SECRET,
      { expiresIn: '1h' }
    );

    res.json({ token, wsUrl: 'wss://api.cloudcode.space/ssh' });
  } catch (err) {
    console.error('SSH token error:', err);
    next(err);
  }
});

module.exports = router;
