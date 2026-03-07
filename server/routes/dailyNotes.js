const express = require('express');
const router = express.Router();
const { v4: uuidv4 } = require('uuid');

router.get('/', (req, res) => {
  const db = req.app.locals.db;
  const { from, to } = req.query;
  let sql = 'SELECT * FROM daily_notes WHERE 1=1';
  const params = [];
  if (from) { sql += ' AND date >= ?'; params.push(from); }
  if (to) { sql += ' AND date <= ?'; params.push(to); }
  sql += ' ORDER BY date DESC';
  res.json(db.prepare(sql).all(...params));
});

router.get('/:date', (req, res) => {
  const db = req.app.locals.db;
  const note = db.prepare('SELECT * FROM daily_notes WHERE date = ?').get(req.params.date);
  res.json(note || null);
});

router.post('/', (req, res) => {
  const db = req.app.locals.db;
  const { date, pre_market_plan, post_market_review, mood, market_conditions } = req.body;
  const existing = db.prepare('SELECT id FROM daily_notes WHERE date = ?').get(date);

  if (existing) {
    db.prepare('UPDATE daily_notes SET pre_market_plan = ?, post_market_review = ?, mood = ?, market_conditions = ?, updated_at = datetime(\'now\') WHERE date = ?').run(
      pre_market_plan, post_market_review, mood, market_conditions, date
    );
    res.json({ id: existing.id });
  } else {
    const id = uuidv4();
    db.prepare('INSERT INTO daily_notes (id, date, pre_market_plan, post_market_review, mood, market_conditions) VALUES (?, ?, ?, ?, ?, ?)').run(
      id, date, pre_market_plan || null, post_market_review || null, mood || null, market_conditions || null
    );
    res.json({ id });
  }
});

module.exports = router;
