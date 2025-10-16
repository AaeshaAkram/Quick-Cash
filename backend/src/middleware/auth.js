import jwt from 'jsonwebtoken';
import { pool } from '../config/db.js';

export function authenticate(requiredScope = null) {
  return async (req, res, next) => {
    try {
      const authHeader = req.headers.authorization || '';
      const token = authHeader.startsWith('Bearer ') ? authHeader.slice(7) : null;
      if (!token) return res.status(401).json({ error: 'Unauthorized' });
      const payload = jwt.verify(token, process.env.JWT_SECRET);
      // token revocation check
      const [rows] = await pool.query('SELECT revoked FROM tokens WHERE jti = ? LIMIT 1', [payload.jti]);
      if (rows[0]?.revoked) return res.status(401).json({ error: 'Token revoked' });

      if (requiredScope && (!payload.scopes || !payload.scopes.includes(requiredScope))) {
        return res.status(403).json({ error: 'Insufficient scope' });
      }
      req.user = { id: payload.sub, username: payload.username };
      req.token = payload;
      next();
    } catch (e) {
      return res.status(401).json({ error: 'Invalid or expired token' });
    }
  };
}


