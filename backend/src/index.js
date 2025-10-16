import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import { v4 as uuidv4 } from 'uuid';
import { pool } from './config/db.js';
import fs from 'fs';
import bcrypt from 'bcryptjs';
import { log } from './utils/logger.js';
import path from 'path';
import { fileURLToPath } from 'url';
import { rateLimiter } from './middleware/rateLimiter.js';
import { requestLogger } from './middleware/requestLogger.js';
import authRoutes from './routes/auth.js';
import txRoutes, { receiptEndpoint } from './routes/transactions.js';
import pinRoutes from './routes/pin.js';
import miniRoutes from './routes/miniStatement.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Ensure required secrets exist in local dev to avoid crashes
if (!process.env.JWT_SECRET) process.env.JWT_SECRET = 'dev_jwt_secret_change_me';
if (!process.env.REFRESH_SECRET) process.env.REFRESH_SECRET = 'dev_refresh_secret_change_me';
if (!process.env.JWT_EXPIRES_IN) process.env.JWT_EXPIRES_IN = '90s';
if (!process.env.REFRESH_EXPIRES_IN) process.env.REFRESH_EXPIRES_IN = '7d';

const app = express();
// Disable etag to avoid 304 confusing client state
app.set('etag', false);
app.use(helmet());
app.use(cors());
app.use(express.json());
app.use(morgan('dev'));
app.use(rateLimiter({ windowMs: 60000, max: 120 }));
app.use(requestLogger);

// Ensure API responses are never cached by intermediaries or the browser
app.use((req, res, next) => {
  if (req.path.startsWith('/api/')) {
    res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
    res.setHeader('Pragma', 'no-cache');
    res.setHeader('Expires', '0');
    res.setHeader('Surrogate-Control', 'no-store');
  }
  next();
});

app.use((req, res, next) => {
  req.correlationId = req.headers['x-correlation-id'] || uuidv4();
  res.setHeader('x-correlation-id', req.correlationId);
  next();
});

async function initDb() {
  try {
    const schema = fs.readFileSync(path.join(__dirname, 'config', 'schema.sql'), 'utf8');
    const seed = fs.readFileSync(path.join(__dirname, 'config', 'seed.sql'), 'utf8');
    await pool.query(schema);
    await pool.query(seed);
    // Ensure demo card has PIN 1234
    const [cards] = await pool.query('SELECT id, pin_hash FROM cards WHERE card_number = ? LIMIT 1', ['4111111111111111']);
    if (cards.length) {
      const card = cards[0];
      const ok = await bcrypt.compare('1234', card.pin_hash).catch(()=>false);
      if (!ok) {
        const newHash = await bcrypt.hash('1234', 10);
        await pool.query('UPDATE cards SET pin_hash = ? WHERE id = ?', [newHash, card.id]);
      }
    }
    log({ level: 'info', event: 'db:init', message: 'Database initialized' });
    console.log('DB initialized and schema/seed ensured');
  } catch (e) {
    log({ level: 'error', event: 'db:init', message: 'DB init failed', data: { error: e.message } });
    console.error('DB init failed:', e.message);
  }
}

app.get('/health', async (_req, res) => {
  try {
    const [rows] = await pool.query('SELECT 1 AS one');
    res.json({ ok: true, db: rows[0]?.one === 1 });
  } catch (e) {
    res.status(500).json({ ok: false, error: 'DB unavailable' });
  }
});

app.get('/', (_req, res) => {
  res.json({ service: 'ATM Backend', time: new Date().toISOString() });
});

app.use('/api/auth', authRoutes);
app.use('/api/tx', txRoutes);
app.use('/api/pin', pinRoutes);
app.use('/api/mini', miniRoutes);
receiptEndpoint(app);

// generic error handler
// eslint-disable-next-line no-unused-vars
app.use((err, req, res, next) => {
  log({ level: 'error', event: 'express:error', message: err.message, data: { stack: err.stack }, correlationId: req.correlationId, user: req.user?.username || 'anonymous' });
  console.error('Express error:', err.stack || err.message);
  res.status(500).json({ error: 'Internal Server Error' });
});

const port = process.env.PORT || 4000;
initDb().finally(() => {
  try {
    app.listen(port, () => {
      console.log(`Backend listening on ${port}`);
    });
  } catch (e) {
    console.error('Failed to bind port', port, e);
  }
});

process.on('unhandledRejection', (reason) => {
  log({ level: 'error', event: 'unhandledRejection', message: String(reason) });
  console.error('UnhandledRejection:', reason);
});
process.on('uncaughtException', (err) => {
  log({ level: 'error', event: 'uncaughtException', message: err.message, data: { stack: err.stack } });
  console.error('UncaughtException:', err.stack || err.message);
});


