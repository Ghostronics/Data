const Database = require('better-sqlite3');
const path = require('path');

const DB_PATH = path.join(__dirname, 'journal.db');

function initDatabase() {
  const db = new Database(DB_PATH);
  db.pragma('journal_mode = WAL');
  db.pragma('foreign_keys = ON');

  db.exec(`
    CREATE TABLE IF NOT EXISTS accounts (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      broker TEXT,
      type TEXT DEFAULT 'live',
      initial_balance REAL DEFAULT 0,
      currency TEXT DEFAULT 'USD',
      created_at TEXT DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS trades (
      id TEXT PRIMARY KEY,
      account_id TEXT,
      symbol TEXT NOT NULL,
      direction TEXT NOT NULL CHECK(direction IN ('long', 'short')),
      status TEXT DEFAULT 'open' CHECK(status IN ('open', 'closed', 'breakeven')),
      entry_date TEXT NOT NULL,
      exit_date TEXT,
      entry_price REAL NOT NULL,
      exit_price REAL,
      stop_loss REAL,
      take_profit REAL,
      quantity REAL NOT NULL,
      commission REAL DEFAULT 0,
      swap REAL DEFAULT 0,
      pnl REAL,
      pnl_percentage REAL,
      risk_reward_planned REAL,
      risk_reward_actual REAL,
      setup TEXT,
      strategy TEXT,
      timeframe TEXT,
      session TEXT CHECK(session IN ('asian', 'london', 'new_york', 'overlap', NULL)),
      emotion_before TEXT CHECK(emotion_before IN ('confident', 'neutral', 'fearful', 'greedy', 'anxious', 'calm', NULL)),
      emotion_after TEXT CHECK(emotion_after IN ('satisfied', 'neutral', 'frustrated', 'regretful', 'excited', 'calm', NULL)),
      rating INTEGER CHECK(rating BETWEEN 1 AND 5 OR rating IS NULL),
      followed_plan INTEGER DEFAULT 1,
      notes TEXT,
      mistakes TEXT,
      lessons TEXT,
      tags TEXT,
      created_at TEXT DEFAULT (datetime('now')),
      updated_at TEXT DEFAULT (datetime('now')),
      FOREIGN KEY (account_id) REFERENCES accounts(id)
    );

    CREATE TABLE IF NOT EXISTS trade_images (
      id TEXT PRIMARY KEY,
      trade_id TEXT NOT NULL,
      filename TEXT NOT NULL,
      original_name TEXT,
      type TEXT DEFAULT 'chart' CHECK(type IN ('chart', 'entry', 'exit', 'setup', 'result', 'other')),
      notes TEXT,
      created_at TEXT DEFAULT (datetime('now')),
      FOREIGN KEY (trade_id) REFERENCES trades(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS premarket_analyses (
      id TEXT PRIMARY KEY,
      symbol TEXT NOT NULL,
      date TEXT NOT NULL,
      image_filename TEXT,
      original_name TEXT,
      bias TEXT CHECK(bias IN ('bullish', 'bearish', 'neutral', NULL)),
      key_levels TEXT,
      notes TEXT,
      ai_analysis TEXT,
      similar_scenarios TEXT,
      created_at TEXT DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS ai_analyses (
      id TEXT PRIMARY KEY,
      trade_id TEXT,
      type TEXT NOT NULL CHECK(type IN ('trade_review', 'pattern_analysis', 'journal_summary', 'premarket')),
      prompt TEXT,
      response TEXT NOT NULL,
      created_at TEXT DEFAULT (datetime('now')),
      FOREIGN KEY (trade_id) REFERENCES trades(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS daily_notes (
      id TEXT PRIMARY KEY,
      date TEXT NOT NULL UNIQUE,
      pre_market_plan TEXT,
      post_market_review TEXT,
      mood TEXT,
      market_conditions TEXT,
      created_at TEXT DEFAULT (datetime('now')),
      updated_at TEXT DEFAULT (datetime('now'))
    );
  `);

  // Insert default account if none exists
  const count = db.prepare('SELECT COUNT(*) as count FROM accounts').get();
  if (count.count === 0) {
    const { v4: uuidv4 } = require('uuid');
    db.prepare('INSERT INTO accounts (id, name, broker, type, initial_balance) VALUES (?, ?, ?, ?, ?)').run(
      uuidv4(), 'Main Account', 'Default', 'live', 10000
    );
  }

  return db;
}

module.exports = { initDatabase };
