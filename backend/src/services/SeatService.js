const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

class SeatService {
  async getSeatUsage(orgId) {
    const org = await prisma.organization.findUnique({
      where: { id: orgId },
      include: {
        members: {
          include: {
            vms: { where: { status: { not: 'DELETED' } } }
          }
        }
      }
    });
    if (!org) throw new Error('Organization not found');

    const used = org.members.reduce((sum, m) => sum + m.vms.length, 0);
    return {
      used,
      limit: org.seatLimit,
      available: org.seatLimit - used
    };
  }

  async canAddMember(orgId) {
    const { used, limit } = await this.getSeatUsage(orgId);
    return used < limit - 1; // reserve 1 for owner
  }

  async canProvisionVM(orgId) {
    // Check if org has active subscription first
    const org = await prisma.organization.findUnique({
      where: { id: orgId },
      include: { subscription: true }
    });

    if (!org) return false;

    // Must have an active or trialing subscription
    const validStatuses = ['active', 'trialing'];
    if (!org.subscription || !validStatuses.includes(org.subscription.status)) {
      return false;
    }

    const { used, limit } = await this.getSeatUsage(orgId);
    return used < limit;
  }
}

module.exports = new SeatService();
