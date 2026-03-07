const express = require('express');
const router = express.Router();

router.get('/stats', (req, res) => {
  const db = req.app.locals.db;
  const { account_id, from, to } = req.query;
  let where = "status = 'closed'";
  const params = [];

  if (account_id) { where += ' AND account_id = ?'; params.push(account_id); }
  if (from) { where += ' AND entry_date >= ?'; params.push(from); }
  if (to) { where += ' AND entry_date <= ?'; params.push(to); }

  const totalTrades = db.prepare(`SELECT COUNT(*) as count FROM trades WHERE ${where}`).get(...params).count;
  const wins = db.prepare(`SELECT COUNT(*) as count FROM trades WHERE ${where} AND pnl > 0`).get(...params).count;
  const losses = db.prepare(`SELECT COUNT(*) as count FROM trades WHERE ${where} AND pnl < 0`).get(...params).count;
  const breakeven = db.prepare(`SELECT COUNT(*) as count FROM trades WHERE ${where} AND pnl = 0`).get(...params).count;

  const pnlData = db.prepare(`SELECT
    COALESCE(SUM(pnl), 0) as total_pnl,
    COALESCE(AVG(pnl), 0) as avg_pnl,
    COALESCE(MAX(pnl), 0) as best_trade,
    COALESCE(MIN(pnl), 0) as worst_trade,
    COALESCE(AVG(CASE WHEN pnl > 0 THEN pnl END), 0) as avg_win,
    COALESCE(AVG(CASE WHEN pnl < 0 THEN pnl END), 0) as avg_loss,
    COALESCE(SUM(CASE WHEN pnl > 0 THEN pnl ELSE 0 END), 0) as gross_profit,
    COALESCE(SUM(CASE WHEN pnl < 0 THEN pnl ELSE 0 END), 0) as gross_loss,
    COALESCE(SUM(commission), 0) as total_commissions
  FROM trades WHERE ${where}`).get(...params);

  const winRate = totalTrades > 0 ? (wins / totalTrades) * 100 : 0;
  const profitFactor = pnlData.gross_loss !== 0 ? Math.abs(pnlData.gross_profit / pnlData.gross_loss) : 0;
  const avgRR = db.prepare(`SELECT COALESCE(AVG(risk_reward_actual), 0) as avg FROM trades WHERE ${where} AND risk_reward_actual IS NOT NULL`).get(...params).avg;

  // Consecutive wins/losses
  const allTrades = db.prepare(`SELECT pnl FROM trades WHERE ${where} ORDER BY exit_date`).all(...params);
  let maxConsecWins = 0, maxConsecLosses = 0, curWins = 0, curLosses = 0;
  for (const t of allTrades) {
    if (t.pnl > 0) { curWins++; curLosses = 0; maxConsecWins = Math.max(maxConsecWins, curWins); }
    else if (t.pnl < 0) { curLosses++; curWins = 0; maxConsecLosses = Math.max(maxConsecLosses, curLosses); }
    else { curWins = 0; curLosses = 0; }
  }

  // Max drawdown
  let peak = 0, balance = 0, maxDrawdown = 0;
  for (const t of allTrades) {
    balance += t.pnl;
    if (balance > peak) peak = balance;
    const dd = peak - balance;
    if (dd > maxDrawdown) maxDrawdown = dd;
  }

  // Equity curve
  const equityCurve = [];
  let cumPnl = 0;
  const dailyPnl = db.prepare(`SELECT DATE(exit_date) as date, SUM(pnl) as daily_pnl
    FROM trades WHERE ${where} GROUP BY DATE(exit_date) ORDER BY date`).all(...params);
  for (const d of dailyPnl) {
    cumPnl += d.daily_pnl;
    equityCurve.push({ date: d.date, pnl: d.daily_pnl, cumulative: cumPnl });
  }

  // By day of week
  const byDayOfWeek = db.prepare(`SELECT
    CASE CAST(strftime('%w', entry_date) AS INTEGER)
      WHEN 0 THEN 'Sun' WHEN 1 THEN 'Mon' WHEN 2 THEN 'Tue'
      WHEN 3 THEN 'Wed' WHEN 4 THEN 'Thu' WHEN 5 THEN 'Fri' WHEN 6 THEN 'Sat'
    END as day,
    COUNT(*) as trades, SUM(pnl) as pnl,
    SUM(CASE WHEN pnl > 0 THEN 1 ELSE 0 END) as wins
    FROM trades WHERE ${where}
    GROUP BY strftime('%w', entry_date) ORDER BY strftime('%w', entry_date)`).all(...params);

  // By session
  const bySession = db.prepare(`SELECT session, COUNT(*) as trades, SUM(pnl) as pnl,
    SUM(CASE WHEN pnl > 0 THEN 1 ELSE 0 END) as wins
    FROM trades WHERE ${where} AND session IS NOT NULL
    GROUP BY session`).all(...params);

  // By strategy
  const byStrategy = db.prepare(`SELECT strategy, COUNT(*) as trades, SUM(pnl) as pnl,
    SUM(CASE WHEN pnl > 0 THEN 1 ELSE 0 END) as wins
    FROM trades WHERE ${where} AND strategy IS NOT NULL
    GROUP BY strategy ORDER BY pnl DESC`).all(...params);

  // By symbol
  const bySymbol = db.prepare(`SELECT symbol, COUNT(*) as trades, SUM(pnl) as pnl,
    SUM(CASE WHEN pnl > 0 THEN 1 ELSE 0 END) as wins
    FROM trades WHERE ${where}
    GROUP BY symbol ORDER BY trades DESC LIMIT 20`).all(...params);

  // Emotion analysis
  const byEmotionBefore = db.prepare(`SELECT emotion_before as emotion, COUNT(*) as trades, SUM(pnl) as pnl,
    SUM(CASE WHEN pnl > 0 THEN 1 ELSE 0 END) as wins
    FROM trades WHERE ${where} AND emotion_before IS NOT NULL
    GROUP BY emotion_before`).all(...params);

  res.json({
    totalTrades, wins, losses, breakeven, winRate,
    ...pnlData, profitFactor, avgRR,
    maxConsecWins, maxConsecLosses, maxDrawdown,
    equityCurve, byDayOfWeek, bySession, byStrategy, bySymbol, byEmotionBefore
  });
});

module.exports = router;
