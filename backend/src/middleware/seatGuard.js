const seatService = require('../services/SeatService');

async function seatGuard(req, res, next) {
  try {
    if (!req.user.orgId) {
      return res.status(400).json({ error: 'User not in an organization' });
    }
    const canProvision = await seatService.canProvisionVM(req.user.orgId);
    if (!canProvision) {
      return res.status(403).json({ error: 'Seat limit reached. Upgrade your plan for more seats.' });
    }
    next();
  } catch (err) {
    next(err);
  }
}

module.exports = seatGuard;
