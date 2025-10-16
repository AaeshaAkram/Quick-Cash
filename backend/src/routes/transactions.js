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

function breakdownDenominations(amount) {
  const notes = [2000, 500, 200, 100];
  let remaining = Math.floor(amount);
  const result = {};
  for (const n of notes) {
    const count = Math.floor(remaining / n);
    if (count > 0) {
      result[n] = count;
      remaining -= count * n;
    }
  }
  if (remaining > 0) result[1] = remaining; // coins
  return result;
}

async function generateReceiptPdf(transactionId, data) {
  const receiptsDir = path.join(__dirname, '..', '..', 'receipts');
  if (!fs.existsSync(receiptsDir)) fs.mkdirSync(receiptsDir, { recursive: true });
  const filePath = path.join(receiptsDir, `receipt_${transactionId}.pdf`);
  const doc = new PDFDocument({ margin: 36, size: 'A4' });
  doc.pipe(fs.createWriteStream(filePath));
  // Title
  doc.fontSize(20).fillColor('#000').text('Quick Cash - ATM Receipt', { align: 'center' });
  doc.moveDown();
  // Details table
  const entries = [
    ['Date', new Date().toISOString().replace('T',' ').slice(0,19)],
    ['Type', data.type],
    ['Amount', `₹ ${Number(data.amount).toLocaleString('en-IN', { minimumFractionDigits:2 })}`],
    ['Balance', `₹ ${Number(data.balance).toLocaleString('en-IN', { minimumFractionDigits:2 })}`],
    ['Reference', String(data.reference || '')],
    ['Status', 'SUCCESS']
  ];
  const startX = 36, startY = doc.y;
  const colW = [120, 360];
  doc.rect(startX, startY, colW[0]+colW[1], 24).fill('#f0f4ff');
  doc.fillColor('#000').fontSize(10).text('Transaction Details', startX+6, startY+7);
  let y = startY + 28;
  entries.forEach((row, i) => {
    if (i % 2 === 1) { doc.rect(startX, y-2, colW[0]+colW[1], 22).fill('#f8faff'); doc.fillColor('#000'); }
    doc.fontSize(10).text(row[0], startX+6, y, { width: colW[0]-12 });
    doc.text(row[1], startX+colW[0]+6, y, { width: colW[1]-12 });
    y += 20;
  });
  doc.moveDown();
  doc.fontSize(10).text('Thank you for using our ATM.', { align: 'center' });
  doc.end();
  return filePath;
}

router.get('/balance', authenticate('atm:use'), async (req, res) => {
  const [rows] = await pool.query('SELECT balance, account_type, name FROM users WHERE id = ?', [req.user.id]);
  if (!rows.length) return res.status(404).json({ error: 'User not found' });
  res.json(rows[0]);
});

router.post('/withdraw', authenticate('atm:use'), async (req, res) => {
  const { amount } = req.body || {};
  const amt = Number(amount);
  if (!Number.isFinite(amt) || amt <= 0) return res.status(400).json({ error: 'Invalid amount' });
  if (amt > 10000) return res.status(400).json({ error: 'Exceeds daily limit' });

  const conn = await pool.getConnection();
  try {
    await conn.beginTransaction();
    const [[user]] = await conn.query('SELECT balance FROM users WHERE id = ? FOR UPDATE', [req.user.id]);
    if (!user) throw new Error('User not found');
    if (Number(user.balance) < amt) {
      await conn.rollback();
      return res.status(400).json({ error: 'Insufficient balance' });
    }
    const newBal = Number(user.balance) - amt;
    await conn.query('UPDATE users SET balance = ? WHERE id = ?', [newBal, req.user.id]);
    const denoms = breakdownDenominations(amt);
    const [tx] = await conn.query('INSERT INTO transactions (user_id, type, amount, status, meta) VALUES (?, "WITHDRAW", ?, "SUCCESS", JSON_OBJECT("denoms", JSON_ARRAY()))', [req.user.id, amt]);
    await conn.commit();
    res.json({ balance: newBal, denominations: denoms, referenceId: tx.insertId, receiptUrl: `/api/atm/receipt/${tx.insertId}` });
  } catch (e) {
    await conn.rollback();
    res.status(500).json({ error: 'Withdrawal failed' });
  } finally {
    conn.release();
  }
});

router.post('/deposit', authenticate('atm:use'), async (req, res) => {
  const { amount } = req.body || {};
  const amt = Number(amount);
  if (!Number.isFinite(amt) || amt <= 0) return res.status(400).json({ error: 'Invalid amount' });
  const conn = await pool.getConnection();
  try {
    await conn.beginTransaction();
    const [[user]] = await conn.query('SELECT balance FROM users WHERE id = ? FOR UPDATE', [req.user.id]);
    const newBal = Number(user.balance) + amt;
    await conn.query('UPDATE users SET balance = ? WHERE id = ?', [newBal, req.user.id]);
    const denoms = breakdownDenominations(amt);
    const [tx] = await conn.query('INSERT INTO transactions (user_id, type, amount, status, meta) VALUES (?, "DEPOSIT", ?, "SUCCESS", JSON_OBJECT("denoms", JSON_ARRAY()))', [req.user.id, amt]);
    await conn.commit();
    res.json({ balance: newBal, denominations: denoms, referenceId: tx.insertId, receiptUrl: `/api/atm/receipt/${tx.insertId}` });
  } catch (e) {
    await conn.rollback();
    res.status(500).json({ error: 'Deposit failed' });
  } finally {
    conn.release();
  }
});

// router.post('/transfer', authenticate('atm:use'), async (req, res) => {
//   const { recipientAccount, amount } = req.body || {};
//   const amt = Number(amount);
//   if (!/^\w{3,}$/.test(recipientAccount || '')) return res.status(400).json({ error: 'Invalid account' });
//   if (!Number.isFinite(amt) || amt <= 0) return res.status(400).json({ error: 'Invalid amount' });
//   const conn = await pool.getConnection();
//   try {
//     await conn.beginTransaction();
//     const [[sender]] = await conn.query('SELECT id, balance FROM users WHERE id = ? FOR UPDATE', [req.user.id]);
//     const [[recipient]] = await conn.query('SELECT id, balance FROM users WHERE username = ? FOR UPDATE', [recipientAccount]);
//     if (!recipient) {
//       await conn.rollback();
//       return res.status(404).json({ error: 'Recipient not found' });
//     }
//     if (Number(sender.balance) < amt) {
//       await conn.rollback();
//       return res.status(400).json({ error: 'Insufficient balance' });
//     }
//     const newSenderBal = Number(sender.balance) - amt;
//     const newRecipientBal = Number(recipient.balance) + amt;
//     await conn.query('UPDATE users SET balance = ? WHERE id = ?', [newSenderBal, sender.id]);
//     await conn.query('UPDATE users SET balance = ? WHERE id = ?', [newRecipientBal, recipient.id]);
//     const [tx1] = await conn.query('INSERT INTO transactions (user_id, type, amount, status, meta) VALUES (?, "TRANSFER", ?, "SUCCESS", NULL)', [sender.id, amt]);
//     await conn.query('INSERT INTO transactions (user_id, type, amount, status, meta) VALUES (?, "TRANSFER", ?, "SUCCESS", NULL)', [recipient.id, amt]);
//     await conn.commit();
//     res.json({ balance: newSenderBal, referenceId: tx1.insertId, receiptUrl: `/api/atm/receipt/${tx1.insertId}` });
//   } catch (e) {
//     await conn.rollback();
//     res.status(500).json({ error: 'Transfer failed' });
//   } finally {
//     conn.release();
//   }
// });
// ... (imports and existing functions remain the same)

router.post('/transfer', authenticate('atm:use'), async (req, res) => {
  // Note: recipientAccount from client is now recipientCardNumber
  const { recipientCardNumber, amount } = req.body || {}; 
  const amt = Number(amount);

  // Validation for Recipient Card Number (assuming 16 digits)
  if (!/^\d{16}$/.test(recipientCardNumber || '')) {
      return res.status(400).json({ error: 'Invalid 16-digit recipient card number' });
  }
  if (!Number.isFinite(amt) || amt <= 0) return res.status(400).json({ error: 'Invalid amount' });
  
  const conn = await pool.getConnection();
  try {
      await conn.beginTransaction();

      // 1. Fetch sender's user details AND card number for reference/self-check
      const [[sender]] = await conn.query(
          'SELECT u.id, u.balance, c.card_number FROM users u JOIN cards c ON u.id = c.user_id WHERE u.id = ? FOR UPDATE', 
          [req.user.id]
      );

      if (!sender) {
          await conn.rollback();
          return res.status(404).json({ error: 'Sender not found or has no card' });
      }
      
      // 2. Look up recipient's user_id and balance using their card number
      const [[recipientCardData]] = await conn.query(
          'SELECT u.id AS recipient_id, u.balance AS recipient_balance FROM users u JOIN cards c ON u.id = c.user_id WHERE c.card_number = ? FOR UPDATE', 
          [recipientCardNumber]
      );

      if (!recipientCardData) {
          await conn.rollback();
          return res.status(404).json({ error: 'Recipient card not found' });
      }
      
      // Prevent transfer to self
      if (sender.card_number === recipientCardNumber) {
          await conn.rollback();
          return res.status(400).json({ error: 'Cannot transfer to the same account' });
      }

      if (Number(sender.balance) < amt) {
          await conn.rollback();
          return res.status(400).json({ error: 'Insufficient balance' });
      }
      
      // Transfer logic
      const newSenderBal = Number(sender.balance) - amt;
      const newRecipientBal = Number(recipientCardData.recipient_balance) + amt;

      // Update balances
      await conn.query('UPDATE users SET balance = ? WHERE id = ?', [newSenderBal, sender.id]);
      await conn.query('UPDATE users SET balance = ? WHERE id = ?', [newRecipientBal, recipientCardData.recipient_id]);

      // Insert transaction records using allowed ENUM value 'TRANSFER'
      const [tx1] = await conn.query('INSERT INTO transactions (user_id, type, amount, status, meta) VALUES (?, "TRANSFER", ?, "SUCCESS", JSON_OBJECT("to_card", ?))', [sender.id, amt, recipientCardNumber]);
      await conn.query('INSERT INTO transactions (user_id, type, amount, status, meta) VALUES (?, "TRANSFER", ?, "SUCCESS", JSON_OBJECT("from_card", ?))', [recipientCardData.recipient_id, amt, sender.card_number]);
      
      await conn.commit();
      
      res.json({ balance: newSenderBal, referenceId: tx1.insertId, receiptUrl: `/api/atm/receipt/${tx1.insertId}` });
  } catch (e) {
      await conn.rollback();
      console.error('Transfer error:', e);
      res.status(500).json({ error: 'Transfer failed due to a server error' });
  } finally {
      conn.release();
  }
});

// ... (other router exports and receiptEndpoint remain the same)
export default router;

// Additional receipt streaming endpoint: /api/atm/receipt/:transactionId
export async function receiptEndpoint(app){
  app.get('/api/atm/receipt/:transactionId', authenticate('atm:use'), async (req, res) => {
    const id = Number(req.params.transactionId)
    if(!Number.isFinite(id)) return res.status(400).json({ error: 'Invalid id' })
    const [[tx]] = await pool.query('SELECT t.id, t.type, t.amount, t.status, u.balance FROM transactions t JOIN users u ON u.id = t.user_id WHERE t.id = ? AND t.user_id = ?', [id, req.user.id])
    if(!tx) return res.status(404).json({ error: 'Not found' })
    res.setHeader('Content-Type', 'application/pdf')
    res.setHeader('Content-Disposition', `attachment; filename="ATM_Receipt_${id}.pdf"`)
    const doc = new PDFDocument({ margin: 36, size: 'A4' })
    doc.pipe(res)
    doc.fontSize(20).fillColor('#000').text('Quick Cash - ATM Receipt', { align: 'center' })
    doc.moveDown()
    const rows = [
      ['Date', new Date().toISOString().replace('T',' ').slice(0,19)],
      ['Type', tx.type],
      ['Amount', `₹ ${Number(tx.amount).toLocaleString('en-IN', { minimumFractionDigits:2 })}`],
      ['Status', tx.status],
      ['Reference', String(tx.id)],
    ]
    const startX = 36, startY = doc.y; const colW = [120, 360]
    doc.rect(startX, startY, colW[0]+colW[1], 24).fill('#f0f4ff')
    doc.fillColor('#000').fontSize(10).text('Transaction Details', startX+6, startY+7)
    let y = startY + 28
    rows.forEach((r,i)=>{ if(i%2===1){ doc.rect(startX, y-2, colW[0]+colW[1], 22).fill('#f8faff'); doc.fillColor('#000') } doc.text(r[0], startX+6, y, { width: colW[0]-12 }); doc.text(r[1], startX+colW[0]+6, y, { width: colW[1]-12 }); y+=20 })
    doc.moveDown(); doc.fontSize(10).text('Thank you for using our ATM.', { align: 'center' });
    doc.end()
  })
}


// import express from 'express';
// import { authenticate } from '../middleware/auth.js';
// import { pool } from '../config/db.js';
// import PDFDocument from 'pdfkit';
// import fs from 'fs';
// import path from 'path';
// import { fileURLToPath } from 'url';

// const __filename = fileURLToPath(import.meta.url);
// const __dirname = path.dirname(__filename);
// const router = express.Router();

// function breakdownDenominations(amount) {
//   const notes = [2000, 500, 200, 100, 50, 20, 10];
//   let remaining = Math.floor(amount);
//   const result = {};
//   for (const n of notes) {
//     const count = Math.floor(remaining / n);
//     if (count > 0) {
//       result[n] = count;
//       remaining -= count * n;
//     }
//   }
//   if (remaining > 0) result[1] = remaining; // coins
//   return result;
// }

// async function generateReceiptPdf(transactionId, data) {
//   const receiptsDir = path.join(__dirname, '..', '..', 'receipts');
//   if (!fs.existsSync(receiptsDir)) fs.mkdirSync(receiptsDir, { recursive: true });
//   const filePath = path.join(receiptsDir, `receipt_${transactionId}.pdf`);
//   const doc = new PDFDocument({ margin: 36, size: 'A4' });
//   doc.pipe(fs.createWriteStream(filePath));
//   // Title
//   doc.fontSize(20).fillColor('#000').text('Quick Cash - ATM Receipt', { align: 'center' });
//   doc.moveDown();
//   // Details table
//   const entries = [
//     ['Date', new Date().toISOString().replace('T',' ').slice(0,19)],
//     ['Type', data.type],
//     ['Amount', `₹ ${Number(data.amount).toLocaleString('en-IN', { minimumFractionDigits:2 })}`],
//     ['Balance', `₹ ${Number(data.balance).toLocaleString('en-IN', { minimumFractionDigits:2 })}`],
//     ['Reference', String(data.reference || '')],
//     ['Status', 'SUCCESS']
//   ];
//   const startX = 36, startY = doc.y;
//   const colW = [120, 360];
//   doc.rect(startX, startY, colW[0]+colW[1], 24).fill('#f0f4ff');
//   doc.fillColor('#000').fontSize(10).text('Transaction Details', startX+6, startY+7);
//   let y = startY + 28;
//   entries.forEach((row, i) => {
//     if (i % 2 === 1) { doc.rect(startX, y-2, colW[0]+colW[1], 22).fill('#f8faff'); doc.fillColor('#000'); }
//     doc.fontSize(10).text(row[0], startX+6, y, { width: colW[0]-12 });
//     doc.text(row[1], startX+colW[0]+6, y, { width: colW[1]-12 });
//     y += 20;
//   });
//   doc.moveDown();
//   doc.fontSize(10).text('Thank you for using our ATM.', { align: 'center' });
//   doc.end();
//   return filePath;
// }

// router.get('/balance', authenticate('atm:use'), async (req, res) => {
//   const [rows] = await pool.query('SELECT balance, account_type, name FROM users WHERE id = ?', [req.user.id]);
//   if (!rows.length) return res.status(404).json({ error: 'User not found' });
//   res.json(rows[0]);
// });

// router.post('/withdraw', authenticate('atm:use'), async (req, res) => {
//   const { amount } = req.body || {};
//   const amt = Number(amount);
//   if (!Number.isFinite(amt) || amt <= 0) return res.status(400).json({ error: 'Invalid amount' });
//   if (amt > 10000) return res.status(400).json({ error: 'Exceeds daily limit' });

//   const conn = await pool.getConnection();
//   try {
//     await conn.beginTransaction();
//     const [[user]] = await conn.query('SELECT balance FROM users WHERE id = ? FOR UPDATE', [req.user.id]);
//     if (!user) throw new Error('User not found');
//     if (Number(user.balance) < amt) {
//       await conn.rollback();
//       return res.status(400).json({ error: 'Insufficient balance' });
//     }
//     const newBal = Number(user.balance) - amt;
//     await conn.query('UPDATE users SET balance = ? WHERE id = ?', [newBal, req.user.id]);
//     const denoms = breakdownDenominations(amt);
//     const [tx] = await conn.query('INSERT INTO transactions (user_id, type, amount, status, meta) VALUES (?, "WITHDRAW", ?, "SUCCESS", JSON_OBJECT("denoms", JSON_ARRAY()))', [req.user.id, amt]);
//     const receiptPath = await generateReceiptPdf(tx.insertId, { type: 'WITHDRAW', amount: amt, balance: newBal, denominations: denoms });
//     await conn.query('INSERT INTO receipts (transaction_id, receipt_number, pdf_path) VALUES (?, UUID(), ?)', [tx.insertId, receiptPath]);
//     await conn.commit();
//     res.json({ balance: newBal, denominations: denoms, receiptPath });
//   } catch (e) {
//     await conn.rollback();
//     res.status(500).json({ error: 'Withdrawal failed' });
//   } finally {
//     conn.release();
//   }
// });

// router.post('/deposit', authenticate('atm:use'), async (req, res) => {
//   const { amount } = req.body || {};
//   const amt = Number(amount);
//   if (!Number.isFinite(amt) || amt <= 0) return res.status(400).json({ error: 'Invalid amount' });
//   const conn = await pool.getConnection();
//   try {
//     await conn.beginTransaction();
//     const [[user]] = await conn.query('SELECT balance FROM users WHERE id = ? FOR UPDATE', [req.user.id]);
//     const newBal = Number(user.balance) + amt;
//     await conn.query('UPDATE users SET balance = ? WHERE id = ?', [newBal, req.user.id]);
//     const denoms = breakdownDenominations(amt);
//     const [tx] = await conn.query('INSERT INTO transactions (user_id, type, amount, status, meta) VALUES (?, "DEPOSIT", ?, "SUCCESS", JSON_OBJECT("denoms", JSON_ARRAY()))', [req.user.id, amt]);
//     const receiptPath = await generateReceiptPdf(tx.insertId, { type: 'DEPOSIT', amount: amt, balance: newBal, denominations: denoms });
//     await conn.query('INSERT INTO receipts (transaction_id, receipt_number, pdf_path) VALUES (?, UUID(), ?)', [tx.insertId, receiptPath]);
//     await conn.commit();
//     res.json({ balance: newBal, denominations: denoms, receiptPath });
//   } catch (e) {
//     await conn.rollback();
//     res.status(500).json({ error: 'Deposit failed' });
//   } finally {
//     conn.release();
//   }
// });

// // TRANSFER using recipient CARD NUMBER (supports recipientCardNumber or 16-digit recipientAccount)
// router.post('/transfer', authenticate('atm:use'), async (req, res) => {
//   const amt = Number(req.body?.amount);
//   const recipientCardNumber = String(
//     (req.body?.recipientCardNumber ?? req.body?.recipientAccount ?? '')
//   ).replace(/\s+/g, ''); // allow spaces like "4111 1111 ..."

//   // Validate inputs
//   if (!/^\d{16}$/.test(recipientCardNumber)) {
//     return res.status(400).json({ error: 'Invalid recipient card number' });
//   }
//   if (!Number.isFinite(amt) || amt <= 0) {
//     return res.status(400).json({ error: 'Invalid amount' });
//   }

//   const conn = await pool.getConnection();
//   try {
//     await conn.beginTransaction();

//     // Lock sender row
//     const [[sender]] = await conn.query(
//       'SELECT id, balance FROM users WHERE id = ? FOR UPDATE',
//       [req.user.id]
//     );
//     if (!sender) {
//       await conn.rollback();
//       return res.status(404).json({ error: 'Sender not found' });
//     }

//     // Find recipient by CARD NUMBER and lock row
//     const [[recipient]] = await conn.query(
//       `SELECT u.id, u.balance
//          FROM users u
//          JOIN cards c ON c.user_id = u.id
//         WHERE c.card_number = ?
//         FOR UPDATE`,
//       [recipientCardNumber]
//     );
//     if (!recipient) {
//       await conn.rollback();
//       return res.status(404).json({ error: 'Recipient not found' });
//     }

//     // Prevent self-transfer (same user id)
//     if (recipient.id === sender.id) {
//       await conn.rollback();
//       return res.status(400).json({ error: 'Cannot transfer to the same account' });
//     }

//     // Sufficient balance?
//     if (Number(sender.balance) < amt) {
//       await conn.rollback();
//       return res.status(400).json({ error: 'Insufficient balance' });
//     }

//     // Compute new balances
//     const newSenderBal = Number(sender.balance) - amt;
//     const newRecipientBal = Number(recipient.balance) + amt;

//     // Apply updates
//     await conn.query('UPDATE users SET balance = ? WHERE id = ?', [newSenderBal, sender.id]);
//     await conn.query('UPDATE users SET balance = ? WHERE id = ?', [newRecipientBal, recipient.id]);

//     // Record transactions (keep meta NULL for portability)
//     const [txSender] = await conn.query(
//       'INSERT INTO transactions (user_id, type, amount, status, meta) VALUES (?, "TRANSFER", ?, "SUCCESS", NULL)',
//       [sender.id, amt]
//     );
//     await conn.query(
//       'INSERT INTO transactions (user_id, type, amount, status, meta) VALUES (?, "TRANSFER", ?, "SUCCESS", NULL)',
//       [recipient.id, amt]
//     );

//     await conn.commit();
//     res.json({ balance: newSenderBal, referenceId: txSender.insertId });
//   } catch (e) {
//     try { await conn.rollback(); } catch {}
//     res.status(500).json({ error: 'Transfer failed' });
//   } finally {
//     conn.release();
//   }
// });


// export default router;

// // Additional receipt streaming endpoint: /api/atm/receipt/:transactionId
// export async function receiptEndpoint(app){
//   app.get('/api/atm/receipt/:transactionId', authenticate('atm:use'), async (req, res) => {
//     const id = Number(req.params.transactionId)
//     if(!Number.isFinite(id)) return res.status(400).json({ error: 'Invalid id' })
//     const [[tx]] = await pool.query('SELECT t.id, t.type, t.amount, t.status, u.balance FROM transactions t JOIN users u ON u.id = t.user_id WHERE t.id = ? AND t.user_id = ?', [id, req.user.id])
//     if(!tx) return res.status(404).json({ error: 'Not found' })
//     res.setHeader('Content-Type', 'application/pdf')
//     res.setHeader('Content-Disposition', `attachment; filename="ATM_Receipt_${id}.pdf"`)
//     const doc = new PDFDocument({ margin: 36, size: 'A4' })
//     doc.pipe(res)
//     doc.fontSize(20).fillColor('#000').text('Quick Cash - ATM Receipt', { align: 'center' })
//     doc.moveDown()
//     const rows = [
//       ['Date', new Date().toISOString().replace('T',' ').slice(0,19)],
//       ['Type', tx.type],
//       ['Amount', `₹ ${Number(tx.amount).toLocaleString('en-IN', { minimumFractionDigits:2 })}`],
//       ['Status', tx.status],
//       ['Reference', String(tx.id)],
//     ]
//     const startX = 36, startY = doc.y; const colW = [120, 360]
//     doc.rect(startX, startY, colW[0]+colW[1], 24).fill('#f0f4ff')
//     doc.fillColor('#000').fontSize(10).text('Transaction Details', startX+6, startY+7)
//     let y = startY + 28
//     rows.forEach((r,i)=>{ if(i%2===1){ doc.rect(startX, y-2, colW[0]+colW[1], 22).fill('#f8faff'); doc.fillColor('#000') } doc.text(r[0], startX+6, y, { width: colW[0]-12 }); doc.text(r[1], startX+colW[0]+6, y, { width: colW[1]-12 }); y+=20 })
//     doc.moveDown(); doc.fontSize(10).text('Thank you for using our ATM.', { align: 'center' });
//     doc.end()
//   })
// }