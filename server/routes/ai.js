const express = require('express');
const router = express.Router();
const { v4: uuidv4 } = require('uuid');
const fs = require('fs');
const path = require('path');

async function callClaude(messages, maxTokens = 4096) {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) throw new Error('ANTHROPIC_API_KEY not configured');

  const response = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': apiKey,
      'anthropic-version': '2023-06-01'
    },
    body: JSON.stringify({
      model: 'claude-sonnet-4-20250514',
      max_tokens: maxTokens,
      messages
    })
  });

  if (!response.ok) {
    const err = await response.text();
    throw new Error(`Claude API error: ${response.status} - ${err}`);
  }

  const data = await response.json();
  return data.content[0].text;
}

// Analyze a single trade
router.post('/analyze-trade/:tradeId', async (req, res) => {
  try {
    const db = req.app.locals.db;
    const trade = db.prepare('SELECT * FROM trades WHERE id = ?').get(req.params.tradeId);
    if (!trade) return res.status(404).json({ error: 'Trade not found' });

    const images = db.prepare('SELECT * FROM trade_images WHERE trade_id = ?').all(trade.id);

    // Build message content
    const content = [];

    // Add images if available
    for (const img of images) {
      const imgPath = path.join(__dirname, '../uploads', img.filename);
      if (fs.existsSync(imgPath)) {
        const imgData = fs.readFileSync(imgPath);
        const ext = path.extname(img.filename).slice(1).toLowerCase();
        const mediaType = ext === 'jpg' ? 'image/jpeg' : ext === 'png' ? 'image/png' : ext === 'webp' ? 'image/webp' : 'image/jpeg';
        content.push({
          type: 'image',
          source: { type: 'base64', media_type: mediaType, data: imgData.toString('base64') }
        });
      }
    }

    content.push({
      type: 'text',
      text: `Eres un mentor experto de trading. Analiza este trade y proporciona feedback detallado en español.

DATOS DEL TRADE:
- Símbolo: ${trade.symbol}
- Dirección: ${trade.direction}
- Entrada: ${trade.entry_price} | Salida: ${trade.exit_price || 'Aún abierto'}
- Stop Loss: ${trade.stop_loss || 'No definido'} | Take Profit: ${trade.take_profit || 'No definido'}
- Cantidad: ${trade.quantity}
- P&L: ${trade.pnl !== null ? '$' + trade.pnl.toFixed(2) : 'N/A'}
- R:R Planificado: ${trade.risk_reward_planned ? trade.risk_reward_planned.toFixed(2) : 'N/A'}
- R:R Real: ${trade.risk_reward_actual ? trade.risk_reward_actual.toFixed(2) : 'N/A'}
- Setup: ${trade.setup || 'No especificado'}
- Estrategia: ${trade.strategy || 'No especificada'}
- Timeframe: ${trade.timeframe || 'No especificado'}
- Sesión: ${trade.session || 'No especificada'}
- Emoción antes: ${trade.emotion_before || 'No registrada'}
- Emoción después: ${trade.emotion_after || 'No registrada'}
- Rating: ${trade.rating || 'Sin rating'}/5
- Siguió plan: ${trade.followed_plan ? 'Sí' : 'No'}
- Notas: ${trade.notes || 'Sin notas'}
- Errores: ${trade.mistakes || 'Ninguno registrado'}
- Lecciones: ${trade.lessons || 'Ninguna registrada'}

${images.length > 0 ? 'Se han adjuntado imágenes del chart. Analízalas también.' : ''}

Proporciona:
1. **Análisis del Trade**: Evaluación general de la ejecución
2. **Gestión de Riesgo**: Evaluación del stop loss, take profit y R:R
3. **Puntos Positivos**: Qué se hizo bien
4. **Áreas de Mejora**: Qué se puede mejorar
5. **Análisis Emocional**: Cómo las emociones pudieron afectar la decisión
6. **Consejos Específicos**: Recomendaciones concretas para futuros trades similares
7. **Calificación**: Tu calificación del trade del 1 al 10`
    });

    const analysis = await callClaude([{ role: 'user', content }]);

    // Save analysis
    const analysisId = uuidv4();
    db.prepare('INSERT INTO ai_analyses (id, trade_id, type, response) VALUES (?, ?, ?, ?)').run(
      analysisId, trade.id, 'trade_review', analysis
    );

    res.json({ id: analysisId, analysis });
  } catch (error) {
    console.error('AI analysis error:', error);
    res.status(500).json({ error: error.message });
  }
});

// Analyze journal performance (summary)
router.post('/analyze-journal', async (req, res) => {
  try {
    const db = req.app.locals.db;
    const { from, to, account_id } = req.body;
    let where = "status = 'closed'";
    const params = [];
    if (account_id) { where += ' AND account_id = ?'; params.push(account_id); }
    if (from) { where += ' AND entry_date >= ?'; params.push(from); }
    if (to) { where += ' AND entry_date <= ?'; params.push(to); }

    const trades = db.prepare(`SELECT * FROM trades WHERE ${where} ORDER BY entry_date`).all(...params);
    if (trades.length === 0) return res.status(400).json({ error: 'No closed trades found for analysis' });

    const wins = trades.filter(t => t.pnl > 0).length;
    const totalPnl = trades.reduce((sum, t) => sum + (t.pnl || 0), 0);

    const tradesSummary = trades.map(t =>
      `${t.entry_date} | ${t.symbol} ${t.direction} | P&L: $${(t.pnl || 0).toFixed(2)} | R:R: ${t.risk_reward_actual ? t.risk_reward_actual.toFixed(2) : 'N/A'} | Setup: ${t.setup || '-'} | Estrategia: ${t.strategy || '-'} | Emoción: ${t.emotion_before || '-'}→${t.emotion_after || '-'} | Siguió plan: ${t.followed_plan ? 'Sí' : 'No'} | Errores: ${t.mistakes || '-'}`
    ).join('\n');

    const prompt = `Eres un coach profesional de trading. Analiza este diario de trading y proporciona un análisis completo en español.

RESUMEN:
- Total de trades: ${trades.length}
- Wins: ${wins} | Losses: ${trades.length - wins}
- Win Rate: ${((wins / trades.length) * 100).toFixed(1)}%
- P&L Total: $${totalPnl.toFixed(2)}

DETALLE DE TRADES:
${tradesSummary}

Proporciona un análisis completo que incluya:
1. **Resumen General**: Estado actual del trader
2. **Patrones Identificados**: Patrones recurrentes (buenos y malos)
3. **Mejores Setups**: Qué estrategias/setups están funcionando mejor
4. **Peores Setups**: Qué evitar
5. **Análisis Emocional**: Cómo las emociones están afectando el rendimiento
6. **Gestión de Riesgo**: Evaluación general del manejo del riesgo
7. **Plan de Mejora**: Pasos concretos para mejorar en las próximas semanas
8. **Fortalezas**: Lo que se está haciendo bien y debe mantenerse`;

    const analysis = await callClaude([{ role: 'user', content: prompt }]);

    const analysisId = uuidv4();
    db.prepare('INSERT INTO ai_analyses (id, type, response) VALUES (?, ?, ?)').run(
      analysisId, 'journal_summary', analysis
    );

    res.json({ id: analysisId, analysis });
  } catch (error) {
    console.error('Journal analysis error:', error);
    res.status(500).json({ error: error.message });
  }
});

// Chat with AI about trading
router.post('/chat', async (req, res) => {
  try {
    const db = req.app.locals.db;
    const { message, context } = req.body;

    // Gather context
    const recentTrades = db.prepare("SELECT * FROM trades WHERE status = 'closed' ORDER BY exit_date DESC LIMIT 20").all();
    const stats = db.prepare(`SELECT COUNT(*) as total,
      SUM(CASE WHEN pnl > 0 THEN 1 ELSE 0 END) as wins,
      SUM(pnl) as total_pnl FROM trades WHERE status = 'closed'`).get();

    const systemContext = `Eres un asistente de trading experto. Tienes acceso al diario del trader.
Estadísticas actuales: ${stats.total} trades cerrados, ${stats.wins} ganadores, P&L total: $${(stats.total_pnl || 0).toFixed(2)}.
Últimos trades: ${recentTrades.map(t => `${t.symbol} ${t.direction} P&L:$${(t.pnl || 0).toFixed(2)}`).join(', ')}.
Responde siempre en español.`;

    const analysis = await callClaude([
      { role: 'user', content: `${systemContext}\n\nPregunta del trader: ${message}` }
    ]);

    res.json({ response: analysis });
  } catch (error) {
    console.error('Chat error:', error);
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
