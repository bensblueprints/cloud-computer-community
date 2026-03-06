const { Worker } = require("bullmq");
const IORedis = require("ioredis");
const { PrismaClient } = require("@prisma/client");
const proxmoxService = require("../services/ProxmoxService");
const traefikService = require("../services/TraefikService");
const credentialService = require("../services/CredentialService");
const { Resend } = require("resend");

const prisma = new PrismaClient();
const resend = new Resend(process.env.RESEND_API_KEY);
const redis = new IORedis(process.env.REDIS_URL || "redis://localhost:6379", { maxRetriesPerRequest: null });

// SSE emitter - imported from vms route
let emitSSE;
try {
  emitSSE = require("../routes/vms").emitSSE;
} catch (e) {
  emitSSE = () => {};
}

function emit(userId, vmId, step, status) {
  emitSSE(userId, vmId, { step, status, timestamp: Date.now() });
}

const worker = new Worker("vm-provisioning", async (job) => {
  const { userId, vmId, vmid, templateVmid, subdomain, username } = job.data;
  console.log(`Starting provisioning for VM ${vmid} (job ${job.id})`);

  try {
    // Step 1: Clone template
    emit(userId, vmId, "Cloning template...", "in_progress");
    console.log(`Cloning template ${templateVmid} to VM ${vmid}`);
    const vmName = `cloudcomputer-${userId}-${vmid}`;
    await proxmoxService.cloneTemplate(templateVmid, vmid, vmName);
    console.log(`Clone complete for VM ${vmid}`);

    // Step 2: Start the cloned VM
    emit(userId, vmId, "Starting VM...", "in_progress");
    console.log(`Starting VM ${vmid}`);
    await proxmoxService.startVM(vmid);

    // Step 3: Wait for VM to become ready
    emit(userId, vmId, "Waiting for VM to boot...", "in_progress");
    console.log(`Waiting for VM ${vmid} to become ready`);
    const vmStatus = await proxmoxService.waitForVMReady(vmid);
    const internalIp = vmStatus.ip;
    console.log(`VM ${vmid} ready, IP: ${internalIp || "pending"}`);

    // Step 4: Set credentials (optional - may fail if guest agent not ready)
    let rdpPassword = null;
    let vncPassword = null;
    
    if (internalIp) {
      emit(userId, vmId, "Setting access credentials...", "in_progress");
      try {
        rdpPassword = credentialService.generatePassword(16);
        vncPassword = credentialService.generateVNCPassword();
        await proxmoxService.setRDPPassword(vmid, rdpPassword);
        await proxmoxService.setVNCPassword(vmid, vncPassword);
        console.log(`Credentials set for VM ${vmid}`);
      } catch (e) {
        console.log(`Could not set credentials for VM ${vmid}:`, e.message);
      }
    }

    // Step 5: Create Traefik route
    emit(userId, vmId, "Configuring network...", "in_progress");
    console.log(`Creating Traefik route for ${subdomain}`);
    traefikService.createRoute(vmid, subdomain, internalIp || "10.10.10.1", 6080);

    // Step 6: Update database
    const updateData = {
      status: "RUNNING",
      lastActiveAt: new Date()
    };
    
    if (internalIp) {
      updateData.internalIp = internalIp;
    }
    if (rdpPassword) {
      updateData.rdpPasswordEnc = credentialService.encrypt(rdpPassword);
    }
    if (vncPassword) {
      updateData.vncPasswordEnc = credentialService.encrypt(vncPassword);
    }

    await prisma.vM.update({
      where: { id: vmId },
      data: updateData
    });
    console.log(`Database updated for VM ${vmid}`);

    // Step 7: Notify user
    emit(userId, vmId, "Your environment is ready!", "ready");

    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (user) {
      await resend.emails.send({
        from: process.env.EMAIL_FROM || "noreply@cloudcode.space",
        to: user.email,
        subject: "Your Cloud Computer environment is ready",
        html: `<p>Hi ${user.name},</p><p>Your cloud environment is ready! Access it at <a href="https://cloudcode.space/console/${vmid}">cloudcode.space</a></p>`
      }).catch(err => console.error("Email send error:", err));
    }

    console.log(`Provisioning complete for VM ${vmid}`);
    return { success: true, vmid, subdomain };
  } catch (err) {
    console.error(`Provisioning failed for VM ${vmid}:`, err);

    await prisma.vM.update({
      where: { id: vmId },
      data: { status: "ERROR" }
    }).catch(() => {});

    emit(userId, vmId, "Provisioning failed", "error");

    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (user) {
      await resend.emails.send({
        from: process.env.EMAIL_FROM || "noreply@cloudcode.space",
        to: user.email,
        subject: "Cloud Computer provisioning failed",
        html: `<p>Hi ${user.name},</p><p>We encountered an error provisioning your environment. Our team has been notified. Please try again or contact support.</p>`
      }).catch(() => {});
    }

    throw err;
  }
}, {
  connection: redis,
  concurrency: 2,
  limiter: { max: 3, duration: 60000 }
});

worker.on("completed", (job) => {
  console.log(`Job ${job.id} completed successfully`);
});

worker.on("failed", (job, err) => {
  console.error(`Job ${job.id} failed:`, err.message);
});

console.log("VM provisioning worker started");

module.exports = worker;
