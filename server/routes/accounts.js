const express = require('express');
const router = express.Router();
const { v4: uuidv4 } = require('uuid');

router.get('/', (req, res) => {
  const db = req.app.locals.db;
  const accounts = db.prepare('SELECT * FROM accounts ORDER BY created_at DESC').all();
  res.json(accounts);
});

router.post('/', (req, res) => {
  const db = req.app.locals.db;
  const { name, broker, type, initial_balance, currency } = req.body;
  const id = uuidv4();
  db.prepare('INSERT INTO accounts (id, name, broker, type, initial_balance, currency) VALUES (?, ?, ?, ?, ?, ?)').run(
    id, name, broker || null, type || 'live', initial_balance || 0, currency || 'USD'
  );
  res.json({ id, name, broker, type, initial_balance, currency });
});

router.put('/:id', (req, res) => {
  const db = req.app.locals.db;
  const { name, broker, type, initial_balance, currency } = req.body;
  db.prepare('UPDATE accounts SET name = ?, broker = ?, type = ?, initial_balance = ?, currency = ? WHERE id = ?').run(
    name, broker, type, initial_balance, currency, req.params.id
  );
  res.json({ success: true });
});

router.delete('/:id', (req, res) => {
  const db = req.app.locals.db;
  db.prepare('DELETE FROM accounts WHERE id = ?').run(req.params.id);
  res.json({ success: true });
});

module.exports = router;
