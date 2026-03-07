const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');
const { Resend } = require('resend');
const ghlService = require('../src/services/GHLService');

const prisma = new PrismaClient();
const resend = new Resend(process.env.RESEND_API_KEY);

async function createOwnerAccount() {
  const email = 'cloudcode@advancedmarketing.co';
  const name = 'CloudCode Admin';
  const plan = 'ARMY';

  console.log('Creating owner account for:', email);

  // Check if user already exists
  let user = await prisma.user.findUnique({ where: { email } });
  let org;

  if (user) {
    console.log('User already exists:', user.id);

    // Get their org
    org = await prisma.organization.findFirst({
      where: { ownerId: user.id }
    });

    if (org) {
      console.log('Org exists:', org.id);

      // Update subscription to ARMY
      await prisma.subscription.updateMany({
        where: { orgId: org.id },
        data: {
          plan: 'ARMY',
          status: 'ACTIVE',
          stripeId: 'owner_complimentary'
        }
      });
      console.log('Subscription updated to ARMY');

      // Check for VM
      const vm = await prisma.vM.findFirst({ where: { orgId: org.id } });
      if (vm) {
        console.log('VM already exists:', vm.id, 'Status:', vm.status);
      } else {
        console.log('No VM found - will need to provision');
      }

      // Create GHL if not exists
      if (!org.ghlLocationId && ghlService.isConfigured()) {
        console.log('Creating GHL sub-account...');
        const ghlResult = await ghlService.createSubAccount({
          name: "CloudCode - Advanced Marketing",
          email: email,
          timezone: 'America/New_York'
        });
        if (ghlResult.success) {
          await prisma.organization.update({
            where: { id: org.id },
            data: { ghlLocationId: ghlResult.locationId }
          });
          console.log('GHL created:', ghlResult.locationId);
        } else {
          console.log('GHL creation failed:', ghlResult.error);
        }
      } else if (org.ghlLocationId) {
        console.log('GHL already exists:', org.ghlLocationId);
      }
    } else {
      // Create org for existing user
      org = await prisma.organization.create({
        data: {
          name: "CloudCode Organization",
          ownerId: user.id
        }
      });
      console.log('Org created:', org.id);
    }
  } else {
    // Create new user
    const hashedPassword = await bcrypt.hash('SErver777$$!', 10);

    user = await prisma.user.create({
      data: {
        email,
        name,
        passwordHash: hashedPassword,
        siteRole: 'ADMIN'
      }
    });
    console.log('User created:', user.id);

    // Create org
    org = await prisma.organization.create({
      data: {
        name: "CloudCode Organization",
        ownerId: user.id
      }
    });
    console.log('Org created:', org.id);
  }

  // Ensure subscription exists
  let sub = await prisma.subscription.findFirst({ where: { orgId: org.id } });
  if (!sub) {
    sub = await prisma.subscription.create({
      data: {
        orgId: org.id,
        plan: 'ARMY',
        status: 'ACTIVE',
        stripeId: 'owner_complimentary'
      }
    });
    console.log('Subscription created:', sub.id);
  }

  // Create GHL if needed
  if (!org.ghlLocationId && ghlService.isConfigured()) {
    console.log('Creating GHL sub-account...');
    const ghlResult = await ghlService.createSubAccount({
      name: "CloudCode - Advanced Marketing",
      email: email,
      timezone: 'America/New_York'
    });
    if (ghlResult.success) {
      await prisma.organization.update({
        where: { id: org.id },
        data: { ghlLocationId: ghlResult.locationId }
      });
      console.log('GHL created:', ghlResult.locationId);
    }
  }

  // Check for VM and provision if needed
  let vm = await prisma.vM.findFirst({ where: { orgId: org.id } });
  if (!vm) {
    // Create VM record - provisioning job will pick it up
    vm = await prisma.vM.create({
      data: {
        orgId: org.id,
        name: 'ben-army-vm',
        plan: 'ARMY',
        status: 'PENDING'
      }
    });
    console.log('VM record created:', vm.id, '- queuing for provisioning...');

    // Queue provisioning job
    const Queue = require('bullmq').Queue;
    const provisionQueue = new Queue('vm-provisioning', {
      connection: {
        host: process.env.REDIS_HOST || 'redis',
        port: 6379
      }
    });

    await provisionQueue.add('provision', {
      vmId: vm.id,
      orgId: org.id,
      plan: 'ARMY',
      userId: user.id
    });
    console.log('VM provisioning job queued');
    await provisionQueue.close();
  } else {
    console.log('VM already exists:', vm.id, 'Status:', vm.status);
  }

  // Get GHL location ID for email
  const updatedOrg = await prisma.organization.findUnique({ where: { id: org.id } });
  const ghlLocationId = updatedOrg?.ghlLocationId;

  // Send welcome email
  console.log('\nSending welcome email...');
  try {
    await resend.emails.send({
      from: process.env.EMAIL_FROM || 'CloudCode <noreply@advancedmarketing.co>',
      to: email,
      subject: 'Welcome to CloudCode - Your ARMY Account is Ready!',
      html: `
<!DOCTYPE html>
<html>
<head>
  <style>
    body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
    .container { max-width: 600px; margin: 0 auto; padding: 20px; }
    .header { background: linear-gradient(135deg, #0891b2, #3b82f6); padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
    .header h1 { color: white; margin: 0; }
    .content { background: #f8fafc; padding: 30px; border-radius: 0 0 10px 10px; }
    .box { background: white; padding: 20px; border-radius: 8px; margin: 15px 0; border-left: 4px solid #0891b2; }
    .box h3 { margin-top: 0; color: #0891b2; }
    .credentials { background: #1e293b; color: #e2e8f0; padding: 15px; border-radius: 8px; font-family: monospace; }
    .button { display: inline-block; background: linear-gradient(135deg, #0891b2, #3b82f6); color: white; padding: 12px 30px; text-decoration: none; border-radius: 6px; margin: 10px 5px; }
    .specs { display: grid; grid-template-columns: repeat(3, 1fr); gap: 10px; text-align: center; }
    .spec { background: white; padding: 15px; border-radius: 8px; }
    .spec-value { font-size: 24px; font-weight: bold; color: #0891b2; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>Welcome to CloudCode!</h1>
      <p style="color: #e0f2fe; margin: 10px 0 0 0;">Your ARMY Account is Ready</p>
    </div>
    <div class="content">
      <p>Hi ${name},</p>
      <p>Your CloudCode ARMY account has been set up and is ready to use. Here's everything you need to get started:</p>

      <div class="specs">
        <div class="spec">
          <div class="spec-value">32GB</div>
          <div>RAM</div>
        </div>
        <div class="spec">
          <div class="spec-value">8</div>
          <div>vCPU</div>
        </div>
        <div class="spec">
          <div class="spec-value">160GB</div>
          <div>NVMe SSD</div>
        </div>
      </div>

      <div class="box">
        <h3>CloudCode Dashboard Login</h3>
        <p><strong>URL:</strong> <a href="https://cloudcode.space/login">https://cloudcode.space/login</a></p>
        <div class="credentials">
          <strong>Email:</strong> ${email}<br>
          <strong>Password:</strong> SErver777$$!
        </div>
        <p style="margin-top: 15px;">
          <a href="https://cloudcode.space/login" class="button">Login to Dashboard</a>
        </p>
      </div>

      <div class="box">
        <h3>Go High Level CRM Access</h3>
        <p>Your free Go High Level CRM sub-account has been created!</p>
        <p><strong>Location ID:</strong> ${ghlLocationId || 'Pending setup'}</p>
        <p><strong>Login URL:</strong> <a href="https://app.gohighlevel.com/">https://app.gohighlevel.com/</a></p>
        <p style="font-size: 14px; color: #666;">Use the same email (${email}) to access your GHL dashboard. You'll receive a separate invite from Go High Level.</p>
        <p style="margin-top: 15px;">
          <a href="https://app.gohighlevel.com/" class="button">Open GHL Dashboard</a>
        </p>
      </div>

      <div class="box">
        <h3>What's Included</h3>
        <ul>
          <li>25 Team Members</li>
          <li>noVNC + RDP + SSH Access</li>
          <li>Pre-installed Dev Tools (VS Code, Node, Python, Docker)</li>
          <li>Free Go High Level CRM</li>
          <li>Admin Console</li>
          <li>Dedicated Support</li>
          <li>API Access</li>
        </ul>
      </div>

      <p>Your cloud desktop is being provisioned and will be ready shortly. You'll be able to connect via browser (noVNC), RDP, or SSH.</p>

      <p>Need help? Reply to this email or contact us at <a href="mailto:support@cloudcode.space">support@cloudcode.space</a></p>

      <p>Welcome aboard!<br>
      <strong>The CloudCode Team</strong></p>
    </div>
  </div>
</body>
</html>
      `
    });
    console.log('Welcome email sent successfully!');
  } catch (emailError) {
    console.error('Failed to send welcome email:', emailError.message);
  }

  console.log('\n========================================');
  console.log('OWNER ACCOUNT READY');
  console.log('========================================');
  console.log('Email:', email);
  console.log('Password: SErver777$$!');
  console.log('Plan: ARMY (32GB RAM, 8 vCPU, 160GB)');
  console.log('User ID:', user.id);
  console.log('Org ID:', org.id);
  console.log('GHL Location:', ghlLocationId || 'Pending');
  console.log('VM Status:', vm ? vm.status : 'Queued');
  console.log('========================================');
}

createOwnerAccount()
  .then(() => prisma.$disconnect())
  .then(() => process.exit(0))
  .catch(e => {
    console.error(e);
    prisma.$disconnect();
    process.exit(1);
  });
