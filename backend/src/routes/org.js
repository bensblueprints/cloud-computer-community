const express = require('express');
const { PrismaClient } = require('@prisma/client');
const { v4: uuidv4 } = require('uuid');
const { Resend } = require('resend');
const auth = require('../middleware/auth');
const seatService = require('../services/SeatService');
const vmUserService = require('../services/VMUserService');

const router = express.Router();
const prisma = new PrismaClient();
const resend = new Resend(process.env.RESEND_API_KEY);

router.get('/', auth, async (req, res, next) => {
  try {
    const org = await prisma.organization.findFirst({
      where: { id: req.user.orgId },
      include: { subscription: true }
    });
    if (!org) return res.status(404).json({ error: 'Organization not found' });

    const seatUsage = await seatService.getSeatUsage(org.id);
    res.json({ org, seatUsage });
  } catch (err) {
    next(err);
  }
});

router.get('/members', auth, async (req, res, next) => {
  try {
    const members = await prisma.user.findMany({
      where: { orgId: req.user.orgId },
      select: { id: true, name: true, email: true, orgRole: true, lastLoginAt: true, vms: { where: { status: { not: 'DELETED' } }, select: { status: true } } }
    });
    res.json({ members });
  } catch (err) {
    next(err);
  }
});

router.post('/invite', auth, async (req, res, next) => {
  try {
    if (req.user.orgRole !== 'OWNER') {
      return res.status(403).json({ error: 'Only org owners can invite members' });
    }

    const { email } = req.body;
    if (!email) return res.status(400).json({ error: 'Email is required' });

    const canAdd = await seatService.canAddMember(req.user.orgId);
    if (!canAdd) {
      return res.status(403).json({ error: 'Seat limit reached. Upgrade your plan.' });
    }

    const existing = await prisma.user.findUnique({ where: { email } });
    if (existing) {
      return res.status(409).json({ error: 'User already has an account' });
    }

    const token = uuidv4();
    const invite = await prisma.invite.create({
      data: {
        email,
        orgId: req.user.orgId,
        invitedBy: req.userId,
        token,
        expiresAt: new Date(Date.now() + 48 * 60 * 60 * 1000)
      }
    });

    const inviteUrl = `${process.env.FRONTEND_URL}/accept-invite/${token}`;
    await resend.emails.send({
      from: process.env.EMAIL_FROM || 'noreply@cloudcode.space',
      to: email,
      subject: `You're invited to join Cloud Computer`,
      html: `<p>You've been invited to join a Cloud Computer team.</p><p><a href="${inviteUrl}">Accept Invite</a></p><p>This link expires in 48 hours.</p>`
    });

    res.status(201).json({ invite: { id: invite.id, email: invite.email, expiresAt: invite.expiresAt } });
  } catch (err) {
    next(err);
  }
});

router.delete('/members/:userId', auth, async (req, res, next) => {
  try {
    if (req.user.orgRole !== 'OWNER') {
      return res.status(403).json({ error: 'Only org owners can remove members' });
    }

    const member = await prisma.user.findFirst({
      where: { id: req.params.userId, orgId: req.user.orgId },
      include: {
        vms: { where: { status: { not: 'DELETED' } } },
        vmUsers: { where: { status: { not: 'DELETED' } } }
      }
    });

    if (!member) return res.status(404).json({ error: 'Member not found' });
    if (member.orgRole === 'OWNER') return res.status(400).json({ error: 'Cannot remove org owner' });

    const proxmoxService = require('../services/ProxmoxService');
    const traefikService = require('../services/TraefikService');

    // Remove personal VMs
    for (const vm of member.vms) {
      try { await proxmoxService.stopVM(vm.vmid); } catch (e) { /* ignore */ }
      traefikService.deleteRoute(vm.vmid);
      await prisma.vM.update({ where: { id: vm.id }, data: { status: 'DELETED' } });
    }

    // Remove VMUser access from shared VMs
    for (const vmUser of member.vmUsers) {
      try {
        await vmUserService.deleteVMUser(vmUser.id);
      } catch (e) {
        console.error(`Failed to remove VMUser ${vmUser.id}:`, e.message);
      }
    }

    await prisma.user.update({
      where: { id: member.id },
      data: { orgId: null, orgRole: 'MEMBER' }
    });

    res.json({ message: 'Member removed' });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
