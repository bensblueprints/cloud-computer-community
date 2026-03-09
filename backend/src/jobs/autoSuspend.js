const { PrismaClient } = require('@prisma/client');
const proxmoxService = require('../services/ProxmoxService');

const prisma = new PrismaClient();

async function autoSuspendIdleVMs() {
  try {
    const settings = await prisma.appSettings.findUnique({ where: { id: 'singleton' } });
    const timeoutMinutes = settings?.autoSuspendMinutes || 120;
    const cutoff = new Date(Date.now() - timeoutMinutes * 60 * 1000);

    // Only auto-suspend VMs from orgs WITHOUT an active/trialing subscription
    // Paying customers keep their VMs running 24/7
    const idleVMs = await prisma.vM.findMany({
      where: {
        status: 'RUNNING',
        lastActiveAt: { lt: cutoff },
        org: {
          subscription: {
            OR: [
              { status: { notIn: ['active', 'trialing'] } },
            ]
          }
        }
      },
      include: {
        org: { include: { subscription: true } }
      }
    });

    // Also catch VMs from orgs with NO subscription at all
    const noSubVMs = await prisma.vM.findMany({
      where: {
        status: 'RUNNING',
        lastActiveAt: { lt: cutoff },
        org: {
          subscription: null
        }
      }
    });

    const allIdleVMs = [...idleVMs, ...noSubVMs];

    for (const vm of allIdleVMs) {
      try {
        await proxmoxService.stopVM(vm.vmid);
        await prisma.vM.update({ where: { id: vm.id }, data: { status: 'STOPPED' } });
        console.log(`Auto-suspended idle VM ${vm.vmid} (no active subscription)`);

        await prisma.auditLog.create({
          data: {
            userId: vm.userId,
            action: 'vm.auto_suspend',
            target: vm.id,
            metadata: { vmid: vm.vmid, idleMinutes: timeoutMinutes, reason: 'no_active_subscription' }
          }
        });
      } catch (err) {
        console.error(`Failed to auto-suspend VM ${vm.vmid}:`, err.message);
      }
    }

    return { suspended: allIdleVMs.length };
  } catch (err) {
    console.error('Auto-suspend cron error:', err);
  }
}

// Run every 5 minutes
setInterval(autoSuspendIdleVMs, 5 * 60 * 1000);

module.exports = { autoSuspendIdleVMs };
