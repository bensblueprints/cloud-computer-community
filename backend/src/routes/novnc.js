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
    const vm = await prisma.vM.findFirst({
      where: { vmid, userId: req.userId }
    });

    if (!vm) return res.status(404).json({ error: 'VM not found' });
    if (vm.status !== 'RUNNING') return res.status(400).json({ error: 'VM is not running' });

    // Get VNC proxy ticket from Proxmox
    const vncInfo = await proxmoxService.getVNCProxy(vmid);

    // Create our own token that includes the Proxmox ticket
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

    // Update last active
    await prisma.vM.update({
      where: { id: vm.id },
      data: { lastActiveAt: new Date() }
    });

    // Return websocket URL for our proxy
    const wsUrl = `wss://${vm.subdomain}.cloudcode.space/websockify`;

    res.json({
      token,
      wsUrl,
      vmid,
      // Also return direct Proxmox info as fallback
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
