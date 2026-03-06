const jwt = require('jsonwebtoken');

const NOVNC_SECRET = process.env.NOVNC_TOKEN_SECRET || process.env.JWT_SECRET;

class NoVNCService {
  issueToken(vmid, userId) {
    return jwt.sign(
      { vmid, userId, iat: Math.floor(Date.now() / 1000) },
      NOVNC_SECRET,
      { expiresIn: '8h' }
    );
  }

  validateToken(token) {
    try {
      const decoded = jwt.verify(token, NOVNC_SECRET);
      return { vmid: decoded.vmid, userId: decoded.userId };
    } catch (err) {
      throw new Error('Invalid or expired noVNC token');
    }
  }
}

module.exports = new NoVNCService();
