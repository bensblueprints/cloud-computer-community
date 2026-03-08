const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();
const { Queue } = require("bullmq");
const IORedis = require("ioredis");
const redis = new IORedis(process.env.REDIS_URL || "redis://localhost:6379", { maxRetriesPerRequest: null });
const provisionQueue = new Queue("vm-provisioning", { connection: redis });

const orgId = "210a390a-0840-485b-b6e7-d5713b712fc5";
const userId = "b2a19fd8-ffd8-47ce-86e0-4a1b60f42827";
const stripeSubId = "sub_1T8eKJLKtb22VH4bPOdoKg51";

(async () => {
  const org = await prisma.organization.update({
    where: { id: orgId },
    data: { plan: "TEAM", seatLimit: 5 }
  });
  console.log("Org updated:", org.plan, org.seatLimit);

  const sub = await prisma.subscription.upsert({
    where: { orgId },
    create: { orgId, plan: "TEAM", stripeId: stripeSubId, status: "trialing", renewsAt: new Date(Date.now() + 30*24*60*60*1000) },
    update: { plan: "TEAM", stripeId: stripeSubId, status: "trialing", renewsAt: new Date(Date.now() + 30*24*60*60*1000) }
  });
  console.log("Subscription created:", sub.id);

  const existingVM = await prisma.vM.findFirst({ where: { OR: [{ orgId }, { userId }], status: { not: "DELETED" } } });
  if (existingVM) {
    console.log("VM already exists:", existingVM.vmid, existingVM.status);
    process.exit(0);
  }

  const user = await prisma.user.findUnique({ where: { id: userId } });
  const username = (user.name || "user").toLowerCase().replace(/[^a-z0-9]/g, "");
  const newVmid = Date.now() % 100000 + 1000;
  const subdomain = username + "-" + newVmid;

  const vm = await prisma.vM.create({
    data: {
      vmid: newVmid,
      userId: null,
      orgId: orgId,
      isShared: true,
      subdomain: subdomain,
      templateType: "ubuntu-team",
      status: "PROVISIONING"
    }
  });
  console.log("VM created:", vm.vmid, vm.subdomain);

  await provisionQueue.add("provision", {
    userId, orgId, vmId: vm.id, vmid: newVmid,
    templateVmid: parseInt(process.env.PROXMOX_TEMPLATE_TEAM) || 514,
    subdomain, username, isShared: true, plan: "TEAM"
  });
  console.log("Provisioning queued for VM", newVmid);

  const ghlService = require("./src/services/GHLService");
  if (ghlService.isConfigured()) {
    const ghlResult = await ghlService.createSubAccount({
      name: user.name + " Business",
      email: user.email,
      timezone: "America/New_York"
    });
    if (ghlResult.success) {
      await prisma.organization.update({ where: { id: orgId }, data: { ghlLocationId: ghlResult.locationId } });
      console.log("GHL sub-account created:", ghlResult.locationId);
    } else {
      console.log("GHL failed:", ghlResult.error);
    }
  }

  process.exit(0);
})().catch(e => { console.error(e); process.exit(1); });
