import express from 'express';
import { authenticate } from '../middleware/auth.js';
import { pool } from '../config/db.js';
import PDFDocument from 'pdfkit';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const router = express.Router();

router.get('/', authenticate('atm:use'), async (req, res) => {
  const { from, to, month, year, limit = 10 } = req.query;
  let where = 'user_id = ?';
  const params = [req.user.id];
  if (from) { where += ' AND created_at >= ?'; params.push(from); }
  if (to) { where += ' AND created_at <= ?'; params.push(to); }
  if (month && year) { where += ' AND MONTH(created_at) = ? AND YEAR(created_at) = ?'; params.push(Number(month), Number(year)); }
  where += " AND type IN ('DEPOSIT','WITHDRAW','TRANSFER')";
  const [rows] = await pool.query(`SELECT id, type, amount, status, created_at FROM transactions WHERE ${where} ORDER BY created_at DESC LIMIT ?`, [...params, Number(limit)]);
  res.json(rows);
});

router.get('/pdf', authenticate('atm:use'), async (req, res) => {
  const { from, to, month, year, limit = 10 } = req.query;
  let where = 'user_id = ?';
  const params = [req.user.id];
  if (from) { where += ' AND created_at >= ?'; params.push(from); }
  if (to) { where += ' AND created_at <= ?'; params.push(to); }
  if (month && year) { where += ' AND MONTH(created_at) = ? AND YEAR(created_at) = ?'; params.push(Number(month), Number(year)); }
  where += " AND type IN ('DEPOSIT','WITHDRAW','TRANSFER')";
  const [rows] = await pool.query(`SELECT id, type, amount, status, created_at FROM transactions WHERE ${where} ORDER BY created_at DESC LIMIT ?`, [...params, Number(limit)]);

  const dir = path.join(__dirname, '..', '..', 'receipts');
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
  const filePath = path.join(dir, `mini_${req.user.id}_${Date.now()}.pdf`);
  const doc = new PDFDocument();
  doc.pipe(fs.createWriteStream(filePath));
  doc.fontSize(18).text('Mini Statement', { align: 'center' });
  doc.moveDown();
  rows.forEach(r => {
    doc.fontSize(12).text(`${r.created_at} | ${r.type} | ${r.amount} | ${r.status}`);
  });
  doc.end();
  res.json({ path: filePath });
});

// Streamed tabular PDF with header band and zebra rows
router.get('/atm/mini-statement/pdf', authenticate('atm:use'), async (req, res) => {
  const { from, to, month, year, limit = 50 } = req.query;
  let where = 'user_id = ?';
  const params = [req.user.id];
  if (from) { where += ' AND created_at >= ?'; params.push(from); }
  if (to) { where += ' AND created_at <= ?'; params.push(to); }
  if (month && year) { where += ' AND MONTH(created_at) = ? AND YEAR(created_at) = ?'; params.push(Number(month), Number(year)); }
  const [rows] = await pool.query(`SELECT id, type, amount, status, created_at FROM transactions WHERE ${where} ORDER BY created_at DESC LIMIT ?`, [...params, Number(limit)]);

  res.setHeader('Content-Type', 'application/pdf');
  res.setHeader('Content-Disposition', 'attachment; filename="mini-statement.pdf"');
  const doc = new PDFDocument({ margin: 36, size: 'A4' });
  doc.pipe(res);
  doc.fontSize(18).text('Mini Statement', { align: 'center' });
  doc.moveDown();

  const columns = [
    { header: 'Date', width: 160 },
    { header: 'Type', width: 80 },
    { header: 'Amount', width: 120, align: 'right' },
    { header: 'Status', width: 80 },
    { header: 'Ref', width: 80 }
  ];

  function drawTableHeader(x, y) {
    let cx = x;
    doc.rect(x, y, columns.reduce((s, c) => s + c.width, 0), 24).fill('#f0f4ff');
    doc.fillColor('#000');
    columns.forEach(col => {
      doc.fontSize(10).text(col.header, cx + 6, y + 7, { width: col.width - 12, align: col.align || 'left' });
      cx += col.width;
    });
    doc.fillColor('#000');
  }

  function drawRow(row, x, y, zebra) {
    const totalWidth = columns.reduce((s, c) => s + c.width, 0);
    if (zebra) {
      doc.rect(x, y, totalWidth, 22).fill('#f8faff');
      doc.fillColor('#000');
    }
    let cx = x;
    const cells = [
      new Date(row.created_at).toISOString().replace('T', ' ').slice(0, 19),
      row.type,
      `₹ ${Number(row.amount).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`,
      row.status,
      String(row.id)
    ];
    cells.forEach((val, idx) => {
      const col = columns[idx];
      doc.fontSize(10).fillColor('#000').text(val, cx + 6, y + 6, { width: col.width - 12, align: col.align || (idx === 2 ? 'right' : 'left') });
      cx += col.width;
    });
  }

  const startX = 36; // left margin
  let y = doc.y;
  drawTableHeader(startX, y);
  y += 26;
  let zebra = false;
  rows.forEach(r => {
    if (y > doc.page.height - 72) { // new page
      doc.addPage();
      y = doc.y;
      drawTableHeader(startX, y);
      y += 26;
    }
    drawRow(r, startX, y, zebra);
    zebra = !zebra;
    y += 22;
  });

  // Totals
  const deposit = rows.filter(r => r.type === 'DEPOSIT').reduce((s, r) => s + Number(r.amount || 0), 0);
  const withdraw = rows.filter(r => r.type === 'WITHDRAW').reduce((s, r) => s + Number(r.amount || 0), 0);
  doc.moveDown();
  doc.fontSize(12).text(`Totals: +₹ ${deposit.toLocaleString('en-IN', { minimumFractionDigits: 2 })} / -₹ ${withdraw.toLocaleString('en-IN', { minimumFractionDigits: 2 })}`);

  doc.end();
});

export default router;


