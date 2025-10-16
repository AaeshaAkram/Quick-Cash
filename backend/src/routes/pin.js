import express from 'express';
import { authenticate } from '../middleware/auth.js';
import { pool } from '../config/db.js';
import bcrypt from 'bcryptjs';

const router = express.Router();

router.post('/request-otp', authenticate('atm:use'), async (req, res) => {
  const code = String(Math.floor(100000 + Math.random() * 900000)).slice(0, 4);
  // Store expiry using SQL to avoid timezone/serialization issues
  const [result] = await pool.query(
    'INSERT INTO otps (user_id, code, expires_at, verified) VALUES (?, ?, DATE_ADD(NOW(), INTERVAL 5 MINUTE), 0)',
    [req.user.id, code]
  );
  // For simulator: return the OTP and latest row id
  res.json({ sent: true, code, id: result?.insertId });
});

router.post('/change', authenticate('atm:use'), async (req, res) => {
  const { oldPin, newPin, confirmNewPin, otp } = req.body || {};
  if (!/^\d{4}(\d{2})?$/.test(newPin || '')) return res.status(400).json({ error: 'Invalid new PIN' });
  if (newPin !== confirmNewPin) return res.status(400).json({ error: 'PINs do not match' });
  const [[otpRow]] = await pool.query('SELECT * FROM otps WHERE user_id = ? AND code = ? AND verified = 0 AND expires_at > NOW() ORDER BY id DESC LIMIT 1', [req.user.id, otp]);
  if (!otpRow) return res.status(400).json({ error: 'Invalid or expired OTP' });
  const [[card]] = await pool.query('SELECT c.* FROM cards c WHERE c.user_id = ?', [req.user.id]);
  if (!card) return res.status(404).json({ error: 'Card not found' });
  const ok = await bcrypt.compare(oldPin || '', card.pin_hash);
  if (!ok) return res.status(400).json({ error: 'Old PIN incorrect' });
  const hash = await bcrypt.hash(newPin, 10);
  await pool.query('UPDATE cards SET pin_hash = ? WHERE id = ?', [hash, card.id]);
  await pool.query('UPDATE otps SET verified = 1 WHERE id = ?', [otpRow.id]);
  await pool.query('INSERT INTO transactions (user_id, card_id, type, amount, status, meta) VALUES (?, ?, "PIN_CHANGE", 0, "SUCCESS", NULL)', [req.user.id, card.id]);
  res.json({ ok: true });
});

export default router;


