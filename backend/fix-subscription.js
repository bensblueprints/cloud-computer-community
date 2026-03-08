const { PrismaClient } = require("@prisma/client");
const { Queue } = require("bullmq");
const IORedis = require("ioredis");

const prisma = new PrismaClient();
const redis = new IORedis(process.env.REDIS_URL || "redis://redis:6379", { maxRetriesPerRequest: null });
const provisionQueue = new Queue("vm-provisioning", { connection: redis });

const userId = "65a1be75-0610-401e-8de2-7e5ec82e167a";
const stripeSubId = "sub_1T8DAoKGAFAV1Oh3YrwhN1yW";

async function fix() {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    include: { org: { include: { subscription: true } } }
  });

  if (!user) {
    throw new Error("User not found");
  }

  console.log("User:", user.name, user.email);
  console.log("Org:", user.org?.name, "Plan:", user.org?.plan);

  const orgId = user.orgId;

  await prisma.organization.update({
    where: { id: orgId },
    data: { plan: "TEAM", seatLimit: 5 }
  });
  console.log("Updated org to TEAM plan with 5 seats");

  const renewsAt = new Date(Date.now() + 3 * 24 * 60 * 60 * 1000);
  await prisma.subscription.upsert({
    where: { orgId },
    create: {
      orgId,
      plan: "TEAM",
      stripeId: stripeSubId,
      status: "trialing",
      renewsAt
    },
    update: {
      plan: "TEAM",
      stripeId: stripeSubId,
      status: "trialing",
      renewsAt
    }
  });
  console.log("Created/updated subscription record");

  const existingVM = await prisma.vM.findFirst({
    where: { 
      OR: [{ userId }, { orgId }],
      status: { not: "DELETED" }
    }
  });

  if (existingVM) {
    console.log("VM already exists:", existingVM.vmid, existingVM.status);
    await redis.disconnect();
    await prisma.$disconnect();
    return;
  }

  const templateVmid = parseInt(process.env.PROXMOX_TEMPLATE_TEAM) || 112;
  const newVmid = Date.now() % 100000 + 1000;
  const username = (user.name || "user").toLowerCase().replace(/[^a-z0-9]/g, "");
  const subdomain = username + "-" + newVmid;

  console.log("Creating shared VM for org", orgId, "VMID:", newVmid);

  const vm = await prisma.vM.create({
    data: {
      vmid: newVmid,
      userId: null,
      orgId: orgId,
      isShared: true,
      subdomain,
      templateType: "ubuntu-team",
      status: "PROVISIONING"
    }
  });

  console.log("Created VM record:", vm.id);

  await provisionQueue.add("provision", {
    userId,
    orgId,
    vmId: vm.id,
    vmid: newVmid,
    templateVmid,
    subdomain,
    username,
    isShared: true,
    plan: "TEAM"
  });

  console.log("Queued VM for provisioning");
  
  await redis.disconnect();
  await prisma.$disconnect();
}

fix().catch(e => { console.error(e); process.exit(1); });
