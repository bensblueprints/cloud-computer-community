const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

function auditLog(action) {
  return async (req, res, next) => {
    const originalJson = res.json.bind(res);
    res.json = function (data) {
      if (res.statusCode < 400 && req.user) {
        prisma.auditLog.create({
          data: {
            userId: req.user.impersonating ? req.user.impersonatingActorId : req.user.id,
            action,
            target: req.params.id || req.params.userId || null,
            metadata: req.user.impersonating
              ? { impersonating: true, targetUserId: req.user.id, actorId: req.user.impersonatingActorId }
              : null
          }
        }).catch(err => console.error('Audit log error:', err));
      }
      return originalJson(data);
    };
    next();
  };
}

module.exports = auditLog;
