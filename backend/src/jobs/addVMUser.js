const { Worker, Queue } = require("bullmq");
const IORedis = require("ioredis");
const { PrismaClient } = require("@prisma/client");
const vmUserService = require("../services/VMUserService");
const { Resend } = require("resend");

const prisma = new PrismaClient();
const resend = new Resend(process.env.RESEND_API_KEY);
const redis = new IORedis(process.env.REDIS_URL || "redis://localhost:6379", { maxRetriesPerRequest: null });

// Queue for adding VM users (used by org routes)
const addVMUserQueue = new Queue("add-vm-user", { connection: redis });

const worker = new Worker("add-vm-user", async (job) => {
  const { vmId, userId, userName, userEmail } = job.data;
  console.log(`Adding user ${userId} to VM ${vmId} (job ${job.id})`);

  try {
    // Get VM details
    const vm = await prisma.vM.findUnique({ where: { id: vmId } });
    if (!vm) {
      throw new Error("VM not found");
    }

    if (!vm.isShared) {
      throw new Error("Cannot add users to non-shared VMs");
    }

    if (vm.status !== "RUNNING") {
      // VM not running, just create record - user will be provisioned when VM starts
      console.log(`VM ${vmId} not running, creating pending VMUser record`);
      const { vmUser, linuxUsername, rdpPassword } = await vmUserService.createVMUser(vmId, userId, userName);

      // Notify user that access is pending
      await resend.emails.send({
        from: process.env.EMAIL_FROM || "noreply@cloudcode.space",
        to: userEmail,
        subject: "Cloud Computer Team Access - Pending",
        html: `
          <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto;">
            <h2>Welcome to the Team!</h2>
            <p>Hi ${userName},</p>
            <p>Your access to the team's Cloud Computer is being set up. You'll receive another email once it's ready.</p>
            <p>In the meantime, you can log into your dashboard at <a href="https://cloudcode.space/login">cloudcode.space</a>.</p>
          </div>
        `
      }).catch(err => console.error("Email send error:", err));

      return { success: true, status: "pending", vmUserId: vmUser.id };
    }

    // VM is running - create user and provision immediately
    console.log(`Creating VMUser for ${userName} on running VM ${vm.vmid}`);
    const { vmUser, linuxUsername, rdpPassword } = await vmUserService.createVMUser(vmId, userId, userName);

    // Provision Linux user on VM
    await vmUserService.provisionVMUser(vmUser.id);
    console.log(`VMUser provisioned: ${linuxUsername}`);

    // Notify user with credentials
    await resend.emails.send({
      from: process.env.EMAIL_FROM || "noreply@cloudcode.space",
      to: userEmail,
      subject: "Your Cloud Computer Team Access is Ready",
      html: `
        <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto;">
          <h2>Your Team Access is Ready!</h2>
          <p>Hi ${userName},</p>
          <p>Your access to the team's Cloud Computer has been set up.</p>

          <div style="background: #f3f4f6; padding: 16px; border-radius: 8px; margin: 16px 0;">
            <h3 style="margin-top: 0;">Your Credentials</h3>
            <p><strong>Username:</strong> ${linuxUsername}</p>
            <p><strong>Password:</strong> ${rdpPassword}</p>
            <p style="color: #666; font-size: 12px;">Please change your password after logging in for security.</p>
          </div>

          <a href="https://cloudcode.space/dashboard" style="display: inline-block; background: #4f46e5; color: white; padding: 12px 24px; text-decoration: none; border-radius: 8px;">
            Access Dashboard
          </a>

          <p style="margin-top: 24px; color: #666; font-size: 14px;">
            You can access the cloud desktop through your browser at the dashboard, or connect via RDP.
          </p>
        </div>
      `
    }).catch(err => console.error("Email send error:", err));

    console.log(`Successfully added ${userName} to VM ${vm.vmid}`);
    return { success: true, status: "active", vmUserId: vmUser.id, linuxUsername };

  } catch (err) {
    console.error(`Failed to add user ${userId} to VM ${vmId}:`, err.message);
    throw err;
  }
}, {
  connection: redis,
  concurrency: 2,
  limiter: { max: 5, duration: 60000 }
});

worker.on("completed", (job, result) => {
  console.log(`Add VMUser job ${job.id} completed:`, result);
});

worker.on("failed", (job, err) => {
  console.error(`Add VMUser job ${job.id} failed:`, err.message);
});

console.log("Add VMUser worker started");

module.exports = { worker, addVMUserQueue };
