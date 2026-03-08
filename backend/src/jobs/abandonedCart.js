const { Worker, Queue } = require("bullmq");
const IORedis = require("ioredis");
const { PrismaClient } = require("@prisma/client");
const { Resend } = require("resend");

const prisma = new PrismaClient();
const resend = new Resend(process.env.RESEND_API_KEY);
const redis = new IORedis(process.env.REDIS_URL || "redis://localhost:6379", { maxRetriesPerRequest: null });

const abandonedCartQueue = new Queue("abandoned-cart", { connection: redis });

const worker = new Worker("abandoned-cart", async (job) => {
  const { userId, email, name } = job.data;
  console.log(`[AbandonedCart] Checking if user ${email} completed payment...`);

  try {
    // Check if user now has an active subscription
    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: { org: { include: { subscription: true } } }
    });

    if (!user) {
      console.log(`[AbandonedCart] User ${userId} no longer exists, skipping`);
      return;
    }

    const hasSubscription = user.org?.subscription &&
      ["active", "trialing"].includes(user.org.subscription.status);

    if (hasSubscription) {
      console.log(`[AbandonedCart] User ${email} already has subscription, skipping`);
      return;
    }

    // User still on FREE plan - send abandoned cart email
    console.log(`[AbandonedCart] Sending abandoned cart email to ${email}`);
    const emailFrom = process.env.EMAIL_FROM || "noreply@cloudcode.space";

    await resend.emails.send({
      from: `Cloud Computer <${emailFrom}>`,
      to: email,
      subject: "You're almost there - Your cloud server is waiting!",
      html: `
        <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; background: #0f172a; color: #e2e8f0; padding: 32px; border-radius: 16px;">
          <div style="text-align: center; margin-bottom: 24px;">
            <div style="display: inline-block; background: linear-gradient(135deg, #06b6d4, #2563eb); width: 56px; height: 56px; border-radius: 14px; line-height: 56px; font-size: 28px;">&#9729;</div>
          </div>
          <h1 style="color: #22d3ee; text-align: center;">You're Almost There!</h1>
          <p style="text-align: center; color: #94a3b8; margin-bottom: 32px;">Hi ${name}, you created your account but haven't picked a plan yet.</p>

          <div style="background: #1e293b; border: 1px solid #334155; border-radius: 12px; padding: 24px; margin-bottom: 20px; text-align: center;">
            <h2 style="color: #fbbf24; font-size: 20px; margin-top: 0;">🔥 Your 3-Day Free Trial is Waiting</h2>
            <p style="color: #cbd5e1; font-size: 14px; margin-bottom: 8px;">Get your own cloud server + free Go High Level CRM with unlimited users.</p>
            <p style="color: #cbd5e1; font-size: 14px; margin-bottom: 20px;">No charge for 3 days. Cancel anytime.</p>
            <a href="https://app.cloudcode.space/dashboard/billing" style="display: inline-block; background: linear-gradient(to right, #06b6d4, #2563eb); color: white; padding: 14px 36px; border-radius: 8px; text-decoration: none; font-weight: 700; font-size: 16px;">Start Your Free Trial Now</a>
          </div>

          <div style="background: #1e293b; border: 1px solid #334155; border-radius: 12px; padding: 20px; margin-bottom: 20px;">
            <p style="color: #22d3ee; font-weight: 600; margin-top: 0;">What you get with every plan:</p>
            <ul style="color: #cbd5e1; font-size: 14px; padding-left: 20px;">
              <li style="margin-bottom: 8px;">☁️ Your own cloud computer accessible from anywhere</li>
              <li style="margin-bottom: 8px;">📊 Free Go High Level CRM (unlimited users)</li>
              <li style="margin-bottom: 8px;">🤖 500 Claude Code Skills PDF (already in your inbox!)</li>
              <li style="margin-bottom: 8px;">👥 Access to our private community</li>
              <li>🛡️ 3-day free trial - cancel anytime</li>
            </ul>
          </div>

          <p style="text-align: center; color: #64748b; font-size: 12px;">Plans start at just $19/mo after trial.</p>
          <div style="text-align: center; padding-top: 16px; border-top: 1px solid #334155;">
            <p style="color: #64748b; font-size: 12px;">Cloud Computer by Advanced Marketing | <a href="https://cloudcode.space" style="color: #22d3ee;">cloudcode.space</a></p>
          </div>
        </div>
      `
    });

    console.log(`[AbandonedCart] Email sent to ${email}`);
  } catch (err) {
    console.error(`[AbandonedCart] Error:`, err.message);
    throw err;
  }
}, { connection: redis, concurrency: 5 });

worker.on("failed", (job, err) => {
  console.error(`[AbandonedCart] Job ${job.id} failed:`, err.message);
});

module.exports = { abandonedCartQueue };
