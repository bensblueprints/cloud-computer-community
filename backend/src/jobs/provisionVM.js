/**
 * ============================================================
 * 🔒 FREEZE IT - DO NOT MODIFY THIS FILE 🔒
 * ============================================================
 * This file handles core VM provisioning logic.
 * Changes here will break VM creation for all customers.
 *
 * Last verified working: 2026-03-07
 * ============================================================
 */

const { Worker, Queue } = require("bullmq");
const IORedis = require("ioredis");
const { PrismaClient } = require("@prisma/client");
const proxmoxService = require("../services/ProxmoxService");
const traefikService = require("../services/TraefikService");
const credentialService = require("../services/CredentialService");
const vmUserService = require("../services/VMUserService");
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

// Helper: Retry a function with exponential backoff
async function withRetry(fn, maxAttempts = 3, delayMs = 5000, name = "operation") {
  let lastError;
  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      return await fn();
    } catch (err) {
      lastError = err;
      console.log(`[Retry] ${name} attempt ${attempt}/${maxAttempts} failed: ${err.message}`);
      if (attempt < maxAttempts) {
        const delay = delayMs * Math.pow(2, attempt - 1); // Exponential backoff
        console.log(`[Retry] Waiting ${delay}ms before retry...`);
        await new Promise(r => setTimeout(r, delay));
      }
    }
  }
  throw lastError;
}

// Helper: Create Linux user with retries (guest agent may not be ready)
async function createLinuxUserWithRetry(vmid, username, password, groups) {
  return withRetry(
    () => proxmoxService.createLinuxUser(vmid, username, password, groups),
    5, // 5 attempts
    10000, // 10 second initial delay
    `createLinuxUser(${vmid}, ${username})`
  );
}

const worker = new Worker("vm-provisioning", async (job) => {
  const { userId, orgId, vmId, vmid, templateVmid, subdomain, username, isShared, plan } = job.data;
  console.log(`Starting provisioning for ${isShared ? "shared" : "personal"} VM ${vmid} (job ${job.id})`);

  try {
    // Step 1: Clone template
    emit(userId, vmId, "Cloning template...", "in_progress");
    console.log(`Cloning template ${templateVmid} to VM ${vmid}`);
    const vmName = isShared ? `cloudcomputer-org-${orgId}-${vmid}` : `cloudcomputer-${userId}-${vmid}`;
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

    // Step 3.5: Wait for guest agent, install network tools, configure networking
    emit(userId, vmId, "Configuring internet access...", "in_progress");
    console.log(`Waiting for guest agent on VM ${vmid} before networking config...`);
    let networkingDone = false;
    try {
      await proxmoxService.waitForGuestAgent(vmid, 120000);
      console.log(`Guest agent ready on VM ${vmid}, configuring networking...`);

      // First: write resolv.conf so apt/internet works
      const netResult = await withRetry(
        () => proxmoxService.configureNetworking(vmid),
        3, 8000, `configureNetworking(${vmid})`
      );
      networkingDone = netResult?.success === true;
      console.log(`Networking configured for VM ${vmid}: ${networkingDone ? 'success' : 'partial'}`);

      // Disable XFCE power management so VMs stay awake 24/7
      proxmoxService.disablePowerManagement(vmid).catch(e => {
        console.log(`Power management disable warning for VM ${vmid}: ${e.message}`);
      });

      // Ensure qemu-guest-agent and networking tools are installed
      // This runs in background - doesn't block provisioning
      proxmoxService.safeExecInVM(vmid, "apt-get update -qq && apt-get install -y -qq qemu-guest-agent dnsutils net-tools curl > /dev/null 2>&1 &").catch(() => {});
    } catch (e) {
      console.log(`Networking config warning for VM ${vmid}: ${e.message} (will retry after provisioning)`);
    }

    // Step 4: Set credentials (with retries - guest agent may not be ready immediately)
    let rdpPassword = null;
    let vncPassword = null;
    let ownerVmUser = null;
    let credentialError = null;

    emit(userId, vmId, "Setting access credentials...", "in_progress");

    // VNC password - retry with backoff
    try {
      vncPassword = credentialService.generateVNCPassword();
      await withRetry(
        () => proxmoxService.setVNCPassword(vmid, vncPassword),
        3, 5000, `setVNCPassword(${vmid})`
      );
      console.log(`VNC password set for VM ${vmid}`);
    } catch (e) {
      console.log(`Could not set VNC password for VM ${vmid}:`, e.message);
      credentialError = e;
    }

    if (isShared) {
      // For shared VMs: Create VMUser for owner with their own Linux account
      console.log(`Creating owner VMUser for shared VM ${vmid}`);
      let vmUser;
      let linuxUsername;
      let ownerPassword;

      try {
        const user = await prisma.user.findUnique({ where: { id: userId } });
        const result = await vmUserService.createVMUser(vmId, userId, user.name);
        vmUser = result.vmUser;
        linuxUsername = result.linuxUsername;
        ownerPassword = result.rdpPassword;

        // Try to create Linux user with retries (this is where 596 errors happen)
        try {
          await createLinuxUserWithRetry(vmid, linuxUsername, ownerPassword, ["sudo", "users"]);
          console.log(`Linux user ${linuxUsername} created on VM ${vmid}`);
        } catch (linuxErr) {
          // Linux user creation failed, but we still set VMUser to ACTIVE
          // User can retry via dashboard or support can fix manually
          console.error(`Failed to create Linux user ${linuxUsername} on VM ${vmid}: ${linuxErr.message}`);
          console.log(`Setting VMUser to ACTIVE anyway - user may need to retry`);
          credentialError = linuxErr;
        }

        // ALWAYS set VMUser to ACTIVE - even if Linux user creation failed
        // This prevents users from being stuck in PROVISIONING forever
        await prisma.vMUser.update({
          where: { id: vmUser.id },
          data: { status: "ACTIVE" }
        });
        if (credentialError) {
          console.log(`VMUser ${vmUser.id} set to ACTIVE despite error: ${credentialError.message}`);
        }

        ownerVmUser = vmUser;
        rdpPassword = ownerPassword;
        console.log(`Owner VMUser ${linuxUsername} marked ACTIVE`);
      } catch (e) {
        console.error(`Critical error creating VMUser for VM ${vmid}:`, e.message);
        credentialError = e;
        // Don't fail the whole job - VM is still usable
      }
    } else {
      // For personal VMs: Set the default cloudcomputer user password
      try {
        rdpPassword = credentialService.generatePassword(16);
        await withRetry(
          () => proxmoxService.setRDPPassword(vmid, rdpPassword),
          3, 5000, `setRDPPassword(${vmid})`
        );
        console.log(`RDP password set for VM ${vmid}`);
      } catch (e) {
        console.log(`Could not set RDP password for VM ${vmid}:`, e.message);
        credentialError = e;
      }
    }

    if (credentialError) {
      console.log(`Credential setup had errors for VM ${vmid}, but continuing...`);
    } else {
      console.log(`All credentials set successfully for VM ${vmid}`);
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
    if (vncPassword) {
      updateData.vncPasswordEnc = credentialService.encrypt(vncPassword);
    }
    // Only store rdpPasswordEnc for personal VMs (shared VMs use VMUser records)
    if (rdpPassword && !isShared) {
      updateData.rdpPasswordEnc = credentialService.encrypt(rdpPassword);
    }

    await prisma.vM.update({
      where: { id: vmId },
      data: updateData
    });
    console.log(`Database updated for VM ${vmid}`);

    // Step 6.5: Retry networking if it failed earlier (VM is fully up now)
    if (!networkingDone) {
      console.log(`[PostProvision] Retrying networking config for VM ${vmid}...`);
      try {
        await proxmoxService.waitForGuestAgent(vmid, 60000);
        const retryResult = await proxmoxService.configureNetworking(vmid);
        console.log(`[PostProvision] Networking retry result: ${retryResult?.success ? 'success' : 'failed'}`);
      } catch (e) {
        console.error(`[PostProvision] Networking retry failed for VM ${vmid}: ${e.message}`);
      }
    }

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
  limiter: { max: 3, duration: 60000 },
  // BullMQ job-level retries with exponential backoff
  defaultJobOptions: {
    attempts: 3,
    backoff: {
      type: "exponential",
      delay: 30000 // 30s, 60s, 120s
    },
    removeOnComplete: { count: 100 },
    removeOnFail: { count: 50 }
  }
});

worker.on("completed", (job) => {
  console.log(`Job ${job.id} completed successfully`);
});

worker.on("failed", (job, err) => {
  console.error(`Job ${job.id} failed after ${job.attemptsMade} attempts:`, err.message);
});

// Background fixer: Auto-fix stuck PROVISIONING VMUsers every 5 minutes
// This catches any users who got stuck due to transient errors
async function fixStuckVMUsers() {
  try {
    // Find VMUsers stuck in PROVISIONING for more than 10 minutes
    const tenMinutesAgo = new Date(Date.now() - 10 * 60 * 1000);
    const stuckUsers = await prisma.vMUser.findMany({
      where: {
        status: "PROVISIONING",
        createdAt: { lt: tenMinutesAgo }
      },
      include: { vm: true, user: true }
    });

    if (stuckUsers.length > 0) {
      console.log(`[FixStuck] Found ${stuckUsers.length} stuck VMUsers, attempting to fix...`);
    }

    for (const vmUser of stuckUsers) {
      try {
        // If VM is running, try to create Linux user one more time
        if (vmUser.vm?.status === "RUNNING" && vmUser.vm?.vmid) {
          console.log(`[FixStuck] Attempting to fix VMUser ${vmUser.id} for VM ${vmUser.vm.vmid}`);
          try {
            await createLinuxUserWithRetry(
              vmUser.vm.vmid,
              vmUser.linuxUsername,
              credentialService.decrypt(vmUser.rdpPasswordEnc),
              ["sudo", "users"]
            );
            console.log(`[FixStuck] Successfully created Linux user ${vmUser.linuxUsername}`);
          } catch (linuxErr) {
            console.log(`[FixStuck] Linux user creation failed, but marking ACTIVE anyway: ${linuxErr.message}`);
          }
        }

        // Mark as ACTIVE regardless - user can use VNC console
        await prisma.vMUser.update({
          where: { id: vmUser.id },
          data: { status: "ACTIVE" }
        });
        console.log(`[FixStuck] Marked VMUser ${vmUser.id} as ACTIVE (fixed at ${new Date().toISOString()})`);
      } catch (err) {
        console.error(`[FixStuck] Failed to fix VMUser ${vmUser.id}:`, err.message);
      }
    }
  } catch (err) {
    console.error("[FixStuck] Background fixer error:", err.message);
  }
}

// Background fixer: Fix networking on recently provisioned VMs that might have missed DNS config
async function fixVMNetworking() {
  try {
    // Find VMs that became RUNNING in the last 15 minutes (recently provisioned)
    const fifteenMinAgo = new Date(Date.now() - 15 * 60 * 1000);
    const recentVMs = await prisma.vM.findMany({
      where: {
        status: "RUNNING",
        createdAt: { gt: fifteenMinAgo }
      }
    });

    for (const vm of recentVMs) {
      try {
        // Quick check: can the VM resolve DNS?
        const agentReady = await proxmoxService.isGuestAgentReady(vm.vmid);
        if (!agentReady) continue;

        // Test DNS resolution
        try {
          await proxmoxService.execInVM(vm.vmid, "host google.com");
          // DNS works, skip this VM
        } catch (e) {
          // DNS broken, fix it
          console.log(`[NetFix] VM ${vm.vmid} has broken DNS, fixing...`);
          await proxmoxService.configureNetworking(vm.vmid);
          console.log(`[NetFix] VM ${vm.vmid} networking fixed`);
        }
      } catch (e) {
        // Silently skip VMs we can't reach
      }
    }
  } catch (err) {
    console.error("[NetFix] Background networking fixer error:", err.message);
  }
}

// Run background fixers
setInterval(fixStuckVMUsers, 5 * 60 * 1000);
setInterval(fixVMNetworking, 3 * 60 * 1000);
// Run once on startup after 30 seconds
setTimeout(fixStuckVMUsers, 30 * 1000);
setTimeout(fixVMNetworking, 60 * 1000);

console.log("VM provisioning worker started with reliability improvements");

module.exports = worker;
