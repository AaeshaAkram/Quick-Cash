import express from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import dayjs from 'dayjs';
import { v4 as uuidv4 } from 'uuid';
import { pool } from '../config/db.js';
import { log } from '../utils/logger.js';

const router = express.Router();

router.post('/card/validate', async (req, res) => {
  const { cardNumber } = req.body || {};
  if (!/^\d{16}$/.test(cardNumber || '')) return res.status(400).json({ error: 'Invalid card number' });
  const [rows] = await pool.query('SELECT c.id AS card_id, u.id AS user_id, u.username, u.name, u.language, c.locked_until, c.status FROM cards c JOIN users u ON u.id = c.user_id WHERE c.card_number = ?', [cardNumber]);
  if (!rows.length) return res.status(404).json({ error: 'Card not found' });
  const card = rows[0];
  if (card.status !== 'ACTIVE') return res.status(403).json({ error: 'Card blocked' });
  if (card.locked_until && new Date(card.locked_until) > new Date()) return res.status(423).json({ error: 'Card locked. Try later.' });
  res.json({ ok: true, user: { id: card.user_id, username: card.username, name: card.name, language: card.language }, cardId: card.card_id });
});

router.post('/pin/verify', async (req, res) => {
  const { cardNumber, pin } = req.body || {};
  if (!/^\d{16}$/.test(cardNumber || '')) return res.status(400).json({ error: 'Invalid card number' });
  if (!/^\d{4}(\d{2})?$/.test(pin || '')) return res.status(400).json({ error: 'Invalid PIN' });

  const [rows] = await pool.query('SELECT c.*, u.username, u.id AS user_id FROM cards c JOIN users u ON u.id = c.user_id WHERE c.card_number = ?', [cardNumber]);
  if (!rows.length) return res.status(404).json({ error: 'Card not found' });
  const card = rows[0];
  if (card.status !== 'ACTIVE') return res.status(403).json({ error: 'Card blocked' });
  if (card.locked_until && new Date(card.locked_until) > new Date()) return res.status(423).json({ error: 'Card locked. Try later.' });

  const valid = await bcrypt.compare(pin, card.pin_hash);
  if (!valid) {
    const failed = (card.failed_attempts || 0) + 1;
    let lockedUntil = null;
    if (failed >= 3) lockedUntil = dayjs().add(24, 'hour').toDate();
    await pool.query('UPDATE cards SET failed_attempts = ?, locked_until = ? WHERE id = ?', [failed, lockedUntil, card.id]);
    return res.status(401).json({ error: failed >= 3 ? 'Too many attempts. Locked 24h.' : 'Invalid PIN' });
  }
  // reset attempts
  await pool.query('UPDATE cards SET failed_attempts = 0, locked_until = NULL WHERE id = ?', [card.id]);

  const jti = uuidv4().replace(/-/g, '');
  const accessToken = jwt.sign({ sub: card.user_id, username: card.username, jti, scopes: ['atm:use'] }, process.env.JWT_SECRET, { expiresIn: process.env.JWT_EXPIRES_IN || '90s' });
  const refreshJti = uuidv4().replace(/-/g, '');
  const refreshToken = jwt.sign({ sub: card.user_id, username: card.username, jti: refreshJti, scopes: ['atm:refresh'] }, process.env.REFRESH_SECRET, { expiresIn: process.env.REFRESH_EXPIRES_IN || '7d' });
  await pool.query('INSERT INTO tokens (user_id, jti, expires_at, revoked) VALUES (?, ?, DATE_ADD(NOW(), INTERVAL 10 MINUTE), 0), (?, ?, DATE_ADD(NOW(), INTERVAL 7 DAY), 0)', [card.user_id, jti, card.user_id, refreshJti]);

  res.json({ token: accessToken, refreshToken });
});

router.post('/token/refresh', async (req, res) => {
  const { refreshToken } = req.body || {};
  if (!refreshToken) return res.status(400).json({ error: 'Missing token' });
  try {
    const payload = jwt.verify(refreshToken, process.env.REFRESH_SECRET);
    const [rows] = await pool.query('SELECT revoked FROM tokens WHERE jti = ? LIMIT 1', [payload.jti]);
    if (!rows.length || rows[0].revoked) return res.status(401).json({ error: 'Revoked token' });
    const jti = uuidv4().replace(/-/g, '');
    const accessToken = jwt.sign({ sub: payload.sub, username: payload.username, jti, scopes: ['atm:use'] }, process.env.JWT_SECRET, { expiresIn: process.env.JWT_EXPIRES_IN || '90s' });
    await pool.query('INSERT INTO tokens (user_id, jti, expires_at, revoked) VALUES (?, ?, DATE_ADD(NOW(), INTERVAL 10 MINUTE), 0)', [payload.sub, jti]);
    res.json({ token: accessToken });
  } catch (e) {
    res.status(401).json({ error: 'Invalid refresh token' });
  }
});

router.post('/logout', async (req, res) => {
  const { token, refreshToken } = req.body || {};
  try {
    if (token) {
      const p = jwt.decode(token);
      if (p?.jti) await pool.query('UPDATE tokens SET revoked = 1 WHERE jti = ?', [p.jti]);
    }
    if (refreshToken) {
      const p = jwt.decode(refreshToken);
      if (p?.jti) await pool.query('UPDATE tokens SET revoked = 1 WHERE jti = ?', [p.jti]);
    }
  } catch {}
  res.json({ ok: true });
});

export default router;





