const express = require('express');
const router = express.Router();
const multer = require('multer');
const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 50 * 1024 * 1024 } });

// GET /api/backup - Export all data as JSON
router.get('/', (req, res) => {
  const db = req.app.locals.db;

  try {
    const accounts = db.prepare('SELECT * FROM accounts').all();
    const trades = db.prepare('SELECT * FROM trades').all();
    const tradeImages = db.prepare('SELECT * FROM trade_images').all();
    const dailyNotes = db.prepare('SELECT * FROM daily_notes').all();
    const premarketAnalyses = db.prepare('SELECT * FROM premarket_analyses').all();
    const aiAnalyses = db.prepare('SELECT * FROM ai_analyses').all();

    const backup = {
      version: '1.0',
      created_at: new Date().toISOString(),
      data: {
        accounts,
        trades,
        trade_images: tradeImages,
        daily_notes: dailyNotes,
        premarket_analyses: premarketAnalyses,
        ai_analyses: aiAnalyses
      }
    };

    res.setHeader('Content-Type', 'application/json');
    res.setHeader('Content-Disposition', `attachment; filename=trading-journal-backup-${new Date().toISOString().split('T')[0]}.json`);
    res.json(backup);
  } catch (err) {
    res.status(500).json({ error: 'Error creating backup: ' + err.message });
  }
});

// POST /api/backup/restore - Import data from JSON backup
router.post('/restore', upload.single('backup'), (req, res) => {
  const db = req.app.locals.db;

  try {
    let backup;

    if (req.file) {
      backup = JSON.parse(req.file.buffer.toString('utf8'));
    } else if (req.body && req.body.data) {
      backup = req.body;
    } else {
      return res.status(400).json({ error: 'No backup data provided' });
    }

    if (!backup.data) {
      return res.status(400).json({ error: 'Invalid backup format' });
    }

    const d = backup.data;
    let counts = { accounts: 0, trades: 0, daily_notes: 0, premarket_analyses: 0 };

    const runRestore = db.transaction(() => {
      // Restore accounts
      if (d.accounts?.length) {
        const stmt = db.prepare(`INSERT OR REPLACE INTO accounts (id, name, broker, type, initial_balance, currency, created_at) VALUES (?, ?, ?, ?, ?, ?, ?)`);
        for (const a of d.accounts) {
          stmt.run(a.id, a.name, a.broker, a.type, a.initial_balance, a.currency, a.created_at);
          counts.accounts++;
        }
      }

      // Restore trades
      if (d.trades?.length) {
        const stmt = db.prepare(`INSERT OR REPLACE INTO trades (id, account_id, symbol, direction, status, entry_date, exit_date, entry_price, exit_price, stop_loss, take_profit, quantity, commission, swap, pnl, pnl_percentage, risk_reward_planned, risk_reward_actual, setup, strategy, timeframe, session, emotion_before, emotion_after, rating, followed_plan, notes, mistakes, lessons, tags, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`);
        for (const t of d.trades) {
          stmt.run(t.id, t.account_id, t.symbol, t.direction, t.status, t.entry_date, t.exit_date, t.entry_price, t.exit_price, t.stop_loss, t.take_profit, t.quantity, t.commission, t.swap, t.pnl, t.pnl_percentage, t.risk_reward_planned, t.risk_reward_actual, t.setup, t.strategy, t.timeframe, t.session, t.emotion_before, t.emotion_after, t.rating, t.followed_plan, t.notes, t.mistakes, t.lessons, t.tags, t.created_at, t.updated_at);
          counts.trades++;
        }
      }

      // Restore trade images metadata
      if (d.trade_images?.length) {
        const stmt = db.prepare(`INSERT OR REPLACE INTO trade_images (id, trade_id, filename, original_name, type, notes, created_at) VALUES (?, ?, ?, ?, ?, ?, ?)`);
        for (const img of d.trade_images) {
          stmt.run(img.id, img.trade_id, img.filename, img.original_name, img.type, img.notes, img.created_at);
        }
      }

      // Restore daily notes
      if (d.daily_notes?.length) {
        const stmt = db.prepare(`INSERT OR REPLACE INTO daily_notes (id, date, pre_market_plan, post_market_review, mood, market_conditions, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?)`);
        for (const n of d.daily_notes) {
          stmt.run(n.id, n.date, n.pre_market_plan, n.post_market_review, n.mood, n.market_conditions, n.created_at, n.updated_at);
          counts.daily_notes++;
        }
      }

      // Restore premarket analyses
      if (d.premarket_analyses?.length) {
        const stmt = db.prepare(`INSERT OR REPLACE INTO premarket_analyses (id, symbol, date, image_filename, original_name, bias, key_levels, notes, ai_analysis, similar_scenarios, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`);
        for (const p of d.premarket_analyses) {
          stmt.run(p.id, p.symbol, p.date, p.image_filename, p.original_name, p.bias, p.key_levels, p.notes, p.ai_analysis, p.similar_scenarios, p.created_at);
          counts.premarket_analyses++;
        }
      }

      // Restore AI analyses
      if (d.ai_analyses?.length) {
        const stmt = db.prepare(`INSERT OR REPLACE INTO ai_analyses (id, trade_id, type, prompt, response, created_at) VALUES (?, ?, ?, ?, ?, ?)`);
        for (const a of d.ai_analyses) {
          stmt.run(a.id, a.trade_id, a.type, a.prompt, a.response, a.created_at);
        }
      }
    });

    runRestore();

    res.json({
      success: true,
      message: 'Backup restored successfully',
      counts
    });
  } catch (err) {
    res.status(500).json({ error: 'Error restoring backup: ' + err.message });
  }
});

module.exports = router;
