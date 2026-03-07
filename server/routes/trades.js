const express = require('express');
const router = express.Router();
const { v4: uuidv4 } = require('uuid');
const multer = require('multer');
const path = require('path');

const storage = multer.diskStorage({
  destination: path.join(__dirname, '../uploads'),
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname);
    cb(null, `${uuidv4()}${ext}`);
  }
});
const upload = multer({ storage, limits: { fileSize: 10 * 1024 * 1024 } });

// List trades with filters
router.get('/', (req, res) => {
  const db = req.app.locals.db;
  const { account_id, status, symbol, strategy, from, to, direction, session } = req.query;
  let sql = 'SELECT * FROM trades WHERE 1=1';
  const params = [];

  if (account_id) { sql += ' AND account_id = ?'; params.push(account_id); }
  if (status) { sql += ' AND status = ?'; params.push(status); }
  if (symbol) { sql += ' AND symbol LIKE ?'; params.push(`%${symbol}%`); }
  if (strategy) { sql += ' AND strategy = ?'; params.push(strategy); }
  if (direction) { sql += ' AND direction = ?'; params.push(direction); }
  if (session) { sql += ' AND session = ?'; params.push(session); }
  if (from) { sql += ' AND entry_date >= ?'; params.push(from); }
  if (to) { sql += ' AND entry_date <= ?'; params.push(to); }

  sql += ' ORDER BY entry_date DESC';
  const trades = db.prepare(sql).all(...params);

  // Attach images
  const imgStmt = db.prepare('SELECT * FROM trade_images WHERE trade_id = ?');
  for (const trade of trades) {
    trade.images = imgStmt.all(trade.id);
    trade.tags = trade.tags ? JSON.parse(trade.tags) : [];
  }

  res.json(trades);
});

// Get single trade
router.get('/:id', (req, res) => {
  const db = req.app.locals.db;
  const trade = db.prepare('SELECT * FROM trades WHERE id = ?').get(req.params.id);
  if (!trade) return res.status(404).json({ error: 'Trade not found' });
  trade.images = db.prepare('SELECT * FROM trade_images WHERE trade_id = ?').all(trade.id);
  trade.tags = trade.tags ? JSON.parse(trade.tags) : [];
  trade.ai_analyses = db.prepare('SELECT * FROM ai_analyses WHERE trade_id = ? ORDER BY created_at DESC').all(trade.id);
  res.json(trade);
});

// Create trade
router.post('/', (req, res) => {
  const db = req.app.locals.db;
  const id = uuidv4();
  const t = req.body;

  // Calculate P&L if closed
  let pnl = null, pnl_percentage = null, rr_actual = null;
  if (t.exit_price && t.status === 'closed') {
    const diff = t.direction === 'long'
      ? (t.exit_price - t.entry_price)
      : (t.entry_price - t.exit_price);
    pnl = diff * t.quantity - (t.commission || 0) - (t.swap || 0);
    pnl_percentage = (diff / t.entry_price) * 100;

    if (t.stop_loss) {
      const risk = Math.abs(t.entry_price - t.stop_loss);
      if (risk > 0) rr_actual = diff / risk;
    }
  }

  let rr_planned = null;
  if (t.stop_loss && t.take_profit) {
    const risk = Math.abs(t.entry_price - t.stop_loss);
    const reward = Math.abs(t.take_profit - t.entry_price);
    if (risk > 0) rr_planned = reward / risk;
  }

  db.prepare(`INSERT INTO trades (id, account_id, symbol, direction, status, entry_date, exit_date,
    entry_price, exit_price, stop_loss, take_profit, quantity, commission, swap, pnl, pnl_percentage,
    risk_reward_planned, risk_reward_actual, setup, strategy, timeframe, session,
    emotion_before, emotion_after, rating, followed_plan, notes, mistakes, lessons, tags)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`).run(
    id, t.account_id || null, t.symbol, t.direction, t.status || 'open',
    t.entry_date, t.exit_date || null, t.entry_price, t.exit_price || null,
    t.stop_loss || null, t.take_profit || null, t.quantity,
    t.commission || 0, t.swap || 0, pnl, pnl_percentage, rr_planned, rr_actual,
    t.setup || null, t.strategy || null, t.timeframe || null, t.session || null,
    t.emotion_before || null, t.emotion_after || null, t.rating || null,
    t.followed_plan !== undefined ? t.followed_plan : 1,
    t.notes || null, t.mistakes || null, t.lessons || null,
    t.tags ? JSON.stringify(t.tags) : null
  );

  res.json({ id, pnl, pnl_percentage, risk_reward_planned: rr_planned, risk_reward_actual: rr_actual });
});

// Update trade
router.put('/:id', (req, res) => {
  const db = req.app.locals.db;
  const t = req.body;

  let pnl = null, pnl_percentage = null, rr_actual = null;
  if (t.exit_price && t.status === 'closed') {
    const diff = t.direction === 'long'
      ? (t.exit_price - t.entry_price)
      : (t.entry_price - t.exit_price);
    pnl = diff * t.quantity - (t.commission || 0) - (t.swap || 0);
    pnl_percentage = (diff / t.entry_price) * 100;

    if (t.stop_loss) {
      const risk = Math.abs(t.entry_price - t.stop_loss);
      if (risk > 0) rr_actual = diff / risk;
    }
  }

  let rr_planned = null;
  if (t.stop_loss && t.take_profit) {
    const risk = Math.abs(t.entry_price - t.stop_loss);
    const reward = Math.abs(t.take_profit - t.entry_price);
    if (risk > 0) rr_planned = reward / risk;
  }

  db.prepare(`UPDATE trades SET account_id = ?, symbol = ?, direction = ?, status = ?,
    entry_date = ?, exit_date = ?, entry_price = ?, exit_price = ?, stop_loss = ?, take_profit = ?,
    quantity = ?, commission = ?, swap = ?, pnl = ?, pnl_percentage = ?,
    risk_reward_planned = ?, risk_reward_actual = ?, setup = ?, strategy = ?, timeframe = ?,
    session = ?, emotion_before = ?, emotion_after = ?, rating = ?, followed_plan = ?,
    notes = ?, mistakes = ?, lessons = ?, tags = ?, updated_at = datetime('now')
    WHERE id = ?`).run(
    t.account_id || null, t.symbol, t.direction, t.status || 'open',
    t.entry_date, t.exit_date || null, t.entry_price, t.exit_price || null,
    t.stop_loss || null, t.take_profit || null, t.quantity,
    t.commission || 0, t.swap || 0, pnl, pnl_percentage, rr_planned, rr_actual,
    t.setup || null, t.strategy || null, t.timeframe || null, t.session || null,
    t.emotion_before || null, t.emotion_after || null, t.rating || null,
    t.followed_plan !== undefined ? t.followed_plan : 1,
    t.notes || null, t.mistakes || null, t.lessons || null,
    t.tags ? JSON.stringify(t.tags) : null, req.params.id
  );

  res.json({ success: true, pnl, pnl_percentage });
});

// Delete trade
router.delete('/:id', (req, res) => {
  const db = req.app.locals.db;
  db.prepare('DELETE FROM trades WHERE id = ?').run(req.params.id);
  res.json({ success: true });
});

// Upload images for a trade
router.post('/:id/images', upload.array('images', 10), (req, res) => {
  const db = req.app.locals.db;
  const tradeId = req.params.id;
  const type = req.body.type || 'chart';
  const results = [];

  for (const file of req.files) {
    const id = uuidv4();
    db.prepare('INSERT INTO trade_images (id, trade_id, filename, original_name, type) VALUES (?, ?, ?, ?, ?)').run(
      id, tradeId, file.filename, file.originalname, type
    );
    results.push({ id, filename: file.filename, original_name: file.originalname, type });
  }

  res.json(results);
});

// Delete image
router.delete('/images/:imageId', (req, res) => {
  const db = req.app.locals.db;
  db.prepare('DELETE FROM trade_images WHERE id = ?').run(req.params.imageId);
  res.json({ success: true });
});

// Get unique strategies
router.get('/meta/strategies', (req, res) => {
  const db = req.app.locals.db;
  const strategies = db.prepare('SELECT DISTINCT strategy FROM trades WHERE strategy IS NOT NULL').all();
  res.json(strategies.map(s => s.strategy));
});

// Get unique symbols
router.get('/meta/symbols', (req, res) => {
  const db = req.app.locals.db;
  const symbols = db.prepare('SELECT DISTINCT symbol FROM trades ORDER BY symbol').all();
  res.json(symbols.map(s => s.symbol));
});

module.exports = router;
