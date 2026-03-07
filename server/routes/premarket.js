const express = require('express');
const router = express.Router();
const { v4: uuidv4 } = require('uuid');
const multer = require('multer');
const path = require('path');
const fs = require('fs');

const storage = multer.diskStorage({
  destination: path.join(__dirname, '../uploads'),
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname);
    cb(null, `premarket-${uuidv4()}${ext}`);
  }
});
const upload = multer({ storage, limits: { fileSize: 10 * 1024 * 1024 } });

async function callClaudeWithImage(content) {
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
      max_tokens: 4096,
      messages: [{ role: 'user', content }]
    })
  });

  if (!response.ok) {
    const err = await response.text();
    throw new Error(`Claude API error: ${response.status} - ${err}`);
  }

  const data = await response.json();
  return data.content[0].text;
}

// List premarket analyses
router.get('/', (req, res) => {
  const db = req.app.locals.db;
  const { symbol, from, to } = req.query;
  let sql = 'SELECT * FROM premarket_analyses WHERE 1=1';
  const params = [];
  if (symbol) { sql += ' AND symbol LIKE ?'; params.push(`%${symbol}%`); }
  if (from) { sql += ' AND date >= ?'; params.push(from); }
  if (to) { sql += ' AND date <= ?'; params.push(to); }
  sql += ' ORDER BY date DESC';
  res.json(db.prepare(sql).all(...params));
});

// Get single premarket analysis
router.get('/:id', (req, res) => {
  const db = req.app.locals.db;
  const analysis = db.prepare('SELECT * FROM premarket_analyses WHERE id = ?').get(req.params.id);
  if (!analysis) return res.status(404).json({ error: 'Not found' });
  if (analysis.similar_scenarios) analysis.similar_scenarios = JSON.parse(analysis.similar_scenarios);
  res.json(analysis);
});

// Create premarket analysis with image
router.post('/', upload.single('image'), async (req, res) => {
  try {
    const db = req.app.locals.db;
    const id = uuidv4();
    const { symbol, date, bias, key_levels, notes } = req.body;

    let aiAnalysis = null;
    let similarScenarios = null;
    const content = [];

    // If image uploaded, analyze with AI
    if (req.file) {
      const imgPath = path.join(__dirname, '../uploads', req.file.filename);
      const imgData = fs.readFileSync(imgPath);
      const ext = path.extname(req.file.filename).slice(1).toLowerCase();
      const mediaType = ext === 'jpg' ? 'image/jpeg' : ext === 'png' ? 'image/png' : ext === 'webp' ? 'image/webp' : 'image/jpeg';

      content.push({
        type: 'image',
        source: { type: 'base64', media_type: mediaType, data: imgData.toString('base64') }
      });

      // Get previous trades for this symbol to find similar scenarios
      const previousTrades = db.prepare(`SELECT * FROM trades WHERE symbol = ? AND status = 'closed' ORDER BY entry_date DESC LIMIT 30`).all(symbol);

      // Get previous premarket analyses for same symbol
      const prevAnalyses = db.prepare('SELECT * FROM premarket_analyses WHERE symbol = ? ORDER BY date DESC LIMIT 10').all(symbol);

      const previousContext = previousTrades.length > 0
        ? `\n\nTRADES ANTERIORES EN ${symbol}:\n${previousTrades.map(t =>
          `${t.entry_date} | ${t.direction} | Entrada: ${t.entry_price} | Salida: ${t.exit_price} | P&L: $${(t.pnl || 0).toFixed(2)} | Setup: ${t.setup || '-'} | Notas: ${t.notes || '-'}`
        ).join('\n')}`
        : '';

      const prevAnalysesContext = prevAnalyses.length > 0
        ? `\n\nANÁLISIS PRE-MARKET ANTERIORES:\n${prevAnalyses.map(a =>
          `${a.date} | Bias: ${a.bias || '-'} | Niveles: ${a.key_levels || '-'} | Notas: ${a.notes || '-'}`
        ).join('\n')}`
        : '';

      content.push({
        type: 'text',
        text: `Eres un analista técnico experto. Analiza esta imagen de pre-market para ${symbol} y proporciona un análisis detallado en español.

Fecha: ${date}
Bias del trader: ${bias || 'No definido'}
Niveles clave identificados: ${key_levels || 'No definidos'}
Notas del trader: ${notes || 'Sin notas'}
${previousContext}
${prevAnalysesContext}

Proporciona:
1. **Análisis Técnico del Chart**: Qué ves en la imagen (soportes, resistencias, patrones, tendencia)
2. **Niveles Clave**: Niveles importantes que identificas
3. **Escenarios Posibles**:
   - Escenario alcista: condiciones y targets
   - Escenario bajista: condiciones y targets
4. **Comparación con Escenarios Anteriores**: Si hay trades anteriores, compara este setup con situaciones similares del pasado y cómo resultaron
5. **Recomendación**: Qué harías basado en el análisis
6. **Gestión de Riesgo**: Dónde colocarías el stop loss y por qué
7. **Confluencias**: Factores que alinean con cada escenario`
      });

      try {
        aiAnalysis = await callClaudeWithImage(content);
      } catch (err) {
        console.error('AI pre-market analysis error:', err);
      }
    }

    db.prepare(`INSERT INTO premarket_analyses (id, symbol, date, image_filename, original_name, bias, key_levels, notes, ai_analysis, similar_scenarios)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`).run(
      id, symbol, date, req.file ? req.file.filename : null, req.file ? req.file.originalname : null,
      bias || null, key_levels || null, notes || null, aiAnalysis,
      similarScenarios ? JSON.stringify(similarScenarios) : null
    );

    res.json({ id, ai_analysis: aiAnalysis });
  } catch (error) {
    console.error('Pre-market error:', error);
    res.status(500).json({ error: error.message });
  }
});

// Delete premarket analysis
router.delete('/:id', (req, res) => {
  const db = req.app.locals.db;
  db.prepare('DELETE FROM premarket_analyses WHERE id = ?').run(req.params.id);
  res.json({ success: true });
});

module.exports = router;
