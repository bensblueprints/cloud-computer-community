const express = require('express');
const { PrismaClient } = require('@prisma/client');
const jwt = require('jsonwebtoken');
const auth = require('../middleware/auth');
const proxmoxService = require('../services/ProxmoxService');

const router = express.Router();
const prisma = new PrismaClient();

// Get VNC connection info for a VM
router.get('/:vmid/token', auth, async (req, res, next) => {
  try {
    const vmid = parseInt(req.params.vmid);

    // First try to find personal VM
    let vm = await prisma.vM.findFirst({
      where: { vmid, userId: req.userId }
    });

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

      // For shared VMs, user must have active VMUser access
      if (vm && vm.vmUsers.length === 0) {
        return res.status(403).json({ error: 'You do not have access to this VM' });
      }
    }

    if (!vm) return res.status(404).json({ error: 'VM not found' });
    if (vm.status !== 'RUNNING') return res.status(400).json({ error: 'VM is not running' });

    // Update last active
    await prisma.vM.update({
      where: { id: vm.id },
      data: { lastActiveAt: new Date() }
    });

    // All VMs use Proxmox VNC proxy (QEMU VMs)
    const vncInfo = await proxmoxService.getVNCProxy(vmid);

    const token = jwt.sign(
      {
        vmid,
        userId: req.userId,
        proxmoxTicket: vncInfo.ticket,
        proxmoxPort: vncInfo.port,
        iat: Math.floor(Date.now() / 1000)
      },
      process.env.JWT_SECRET,
      { expiresIn: '1h' }
    );

    const wsUrl = `wss://api.cloudcode.space/websockify`;

    res.json({
      token,
      wsUrl,
      vmid,
      type: 'qemu',
      proxmox: {
        host: process.env.PROXMOX_HOST.replace('https://', ''),
        port: vncInfo.port,
        ticket: vncInfo.ticket
      }
    });
  } catch (err) {
    console.error('VNC token error:', err);
    next(err);
  }
});

module.exports = router;
