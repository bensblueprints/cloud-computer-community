const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

class SeatService {
  async getSeatUsage(orgId) {
    const org = await prisma.organization.findUnique({
      where: { id: orgId },
      include: { members: true }
    });
    if (!org) throw new Error('Organization not found');

    // Seats = members in the org (each member occupies one seat)
    const used = org.members.length;
    return {
      used,
      limit: org.seatLimit,
      available: org.seatLimit - used
    };
  }

  async canAddMember(orgId) {
    const { used, limit } = await this.getSeatUsage(orgId);
    return used < limit;
  }

  async canProvisionVM(orgId) {
    const org = await prisma.organization.findUnique({
      where: { id: orgId },
      include: { subscription: true }
    });

    if (!org) return false;

    const validStatuses = ['active', 'trialing'];
    if (!org.subscription || !validStatuses.includes(org.subscription.status)) {
      return false;
    }

    // Each member gets 1 VM — check VM count against seat limit
    const vmCount = await prisma.vM.count({
      where: { orgId, status: { not: 'DELETED' } }
    });
    return vmCount < org.seatLimit;
  }
}

module.exports = new SeatService();
