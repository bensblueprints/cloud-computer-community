const { Worker } = require('bullmq');
const IORedis = require('ioredis');
const { PrismaClient } = require('@prisma/client');
const proxmoxService = require('../services/ProxmoxService');
const traefikService = require('../services/TraefikService');
const credentialService = require('../services/CredentialService');
const { Resend } = require('resend');

const prisma = new PrismaClient();
const resend = new Resend(process.env.RESEND_API_KEY);
const redis = new IORedis(process.env.REDIS_URL || 'redis://localhost:6379', { maxRetriesPerRequest: null });

// SSE emitter - imported from vms route
let emitSSE;
try {
  emitSSE = require('../routes/vms').emitSSE;
} catch (e) {
  emitSSE = () => {};
}

function emit(userId, vmId, step, status) {
  emitSSE(userId, vmId, { step, status, timestamp: Date.now() });
}

const worker = new Worker('vm-provisioning', async (job) => {
  const { userId, vmId, vmid, templateVmid, subdomain, username } = job.data;

  try {
    // Step 1: Clone template
    emit(userId, vmId, 'Cloning template...', 'in_progress');
    const vmName = `cloudcomputer-${userId}-${vmid}`;
    await proxmoxService.cloneTemplate(templateVmid, vmid, vmName);

    // Step 2: Start the cloned VM
    emit(userId, vmId, 'Starting VM...', 'in_progress');
    await proxmoxService.startVM(vmid);

    // Step 3: Wait for VM to become ready
    emit(userId, vmId, 'Waiting for VM to become ready...', 'in_progress');
    const vmStatus = await proxmoxService.waitForVMReady(vmid);
    const internalIp = vmStatus.agent?.['ip-address'] || vmStatus.ip;

    // Step 4: Set credentials
    emit(userId, vmId, 'Setting access credentials...', 'in_progress');
    const rdpPassword = credentialService.generatePassword(16);
    const vncPassword = credentialService.generateVNCPassword();

    await proxmoxService.setRDPPassword(vmid, rdpPassword);
    await proxmoxService.setVNCPassword(vmid, vncPassword);

    // Step 5: Create Traefik route
    emit(userId, vmId, 'Configuring network route...', 'in_progress');
    traefikService.createRoute(vmid, username, internalIp, 6080);

    // Step 6: Update database
    await prisma.vM.update({
      where: { id: vmId },
      data: {
        status: 'RUNNING',
        internalIp,
        rdpPasswordEnc: credentialService.encrypt(rdpPassword),
        vncPasswordEnc: credentialService.encrypt(vncPassword),
        lastActiveAt: new Date()
      }
    });

    // Step 7: Notify user
    emit(userId, vmId, 'Your environment is ready!', 'ready');

    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (user) {
      await resend.emails.send({
        from: process.env.EMAIL_FROM || 'noreply@cloudcode.space',
        to: user.email,
        subject: 'Your Cloud Computer environment is ready',
        html: `<p>Hi ${user.name},</p><p>Your cloud environment is ready! Access it at <a href="https://app.cloudcode.space/console/${vmid}">app.cloudcode.space</a></p>`
      }).catch(err => console.error('Email send error:', err));
    }

    return { success: true, vmid, subdomain };
  } catch (err) {
    console.error(`Provisioning failed for VM ${vmid}:`, err);

    await prisma.vM.update({
      where: { id: vmId },
      data: { status: 'ERROR' }
    }).catch(() => {});

    emit(userId, vmId, 'Provisioning failed', 'error');

    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (user) {
      await resend.emails.send({
        from: process.env.EMAIL_FROM || 'noreply@cloudcode.space',
        to: user.email,
        subject: 'Cloud Computer provisioning failed',
        html: `<p>Hi ${user.name},</p><p>We encountered an error provisioning your environment. Our team has been notified. Please try again or contact support.</p>`
      }).catch(() => {});
    }

    throw err;
  }
}, {
  connection: redis,
  concurrency: 3,
  limiter: { max: 5, duration: 60000 }
});

worker.on('failed', (job, err) => {
  console.error(`Job ${job.id} failed:`, err.message);
});

module.exports = worker;
