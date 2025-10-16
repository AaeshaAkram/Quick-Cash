import { pool } from '../config/db.js';

export async function requestLogger(req, res, next) {
  const start = Date.now();
  const correlationId = req.correlationId;
  res.on('finish', async () => {
    try {
      const level = res.statusCode >= 500 ? 'error' : res.statusCode >= 400 ? 'warn' : 'info';
      const msg = `${req.method} ${req.originalUrl} ${res.statusCode} ${Date.now() - start}ms`;
      await pool.query(
        'INSERT INTO logs (correlation_id, event, level, message, user) VALUES (?, ?, ?, ?, ?)',
        [correlationId, 'http', level, msg, req.user?.username || 'anonymous']
      );
    } catch {}
  });
  next();
}





