import { useState, useEffect } from 'react'
import { api } from '../utils/api'
import { format, subDays, addDays } from 'date-fns'

export default function DailyJournal() {
  const [date, setDate] = useState(new Date().toISOString().split('T')[0])
  const [note, setNote] = useState({
    pre_market_plan: '', post_market_review: '', mood: '', market_conditions: ''
  })
  const [trades, setTrades] = useState([])
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)

  useEffect(() => { loadDay() }, [date])

  async function loadDay() {
    try {
      const [noteData, tradesData] = await Promise.all([
        api.getDailyNote(date).catch(() => null),
        api.getTrades({ from: date, to: date })
      ])
      if (noteData) {
        setNote({
          pre_market_plan: noteData.pre_market_plan || '',
          post_market_review: noteData.post_market_review || '',
          mood: noteData.mood || '',
          market_conditions: noteData.market_conditions || ''
        })
      } else {
        setNote({ pre_market_plan: '', post_market_review: '', mood: '', market_conditions: '' })
      }
      setTrades(tradesData)
    } catch (err) {
      console.error(err)
    }
  }

  async function handleSave() {
    setSaving(true)
    try {
      await api.saveDailyNote({ date, ...note })
      setSaved(true)
      setTimeout(() => setSaved(false), 2000)
    } catch (err) {
      alert('Error: ' + err.message)
    } finally {
      setSaving(false)
    }
  }

  const dayPnl = trades.reduce((sum, t) => sum + (t.pnl || 0), 0)

  return (
    <div className="space-y-6 max-w-4xl">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Diario del Día</h1>
        <div className="flex items-center gap-3">
          <button className="btn-secondary" onClick={() => setDate(format(subDays(new Date(date + 'T12:00:00'), 1), 'yyyy-MM-dd'))}>&#8592;</button>
          <input type="date" className="input w-auto" value={date} onChange={e => setDate(e.target.value)} />
          <button className="btn-secondary" onClick={() => setDate(format(addDays(new Date(date + 'T12:00:00'), 1), 'yyyy-MM-dd'))}>&#8594;</button>
        </div>
      </div>

      {/* Day Summary */}
      <div className="grid grid-cols-3 gap-4">
        <div className="stat-card">
          <span className="stat-label">Trades del día</span>
          <span className="stat-value">{trades.length}</span>
        </div>
        <div className="stat-card">
          <span className="stat-label">P&L del día</span>
          <span className={`stat-value ${dayPnl >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>${dayPnl.toFixed(2)}</span>
        </div>
        <div className="stat-card">
          <span className="stat-label">Win Rate</span>
          <span className="stat-value text-blue-400">
            {trades.length > 0 ? `${((trades.filter(t => (t.pnl || 0) > 0).length / trades.length) * 100).toFixed(0)}%` : '-'}
          </span>
        </div>
      </div>

      {/* Trades of the day */}
      {trades.length > 0 && (
        <div className="card">
          <h2 className="text-lg font-semibold mb-3">Trades del Día</h2>
          <div className="space-y-2">
            {trades.map(t => (
              <div key={t.id} className="flex items-center justify-between bg-dark-700 rounded-lg px-4 py-3">
                <div className="flex items-center gap-3">
                  <span className="font-medium">{t.symbol}</span>
                  <span className={t.direction === 'long' ? 'badge-green' : 'badge-red'}>{t.direction}</span>
                  <span className="text-sm text-gray-400">{t.setup || ''}</span>
                </div>
                <span className={`font-medium ${(t.pnl || 0) >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                  {t.pnl !== null ? `$${t.pnl.toFixed(2)}` : '-'}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Journal Notes */}
      <div className="card">
        <h2 className="text-lg font-semibold mb-4">Notas del Día</h2>
        <div className="space-y-4">
          <div>
            <label className="label">Estado de ánimo</label>
            <select className="select w-full" value={note.mood} onChange={e => setNote(p => ({ ...p, mood: e.target.value }))}>
              <option value="">Seleccionar</option>
              <option value="excellent">Excelente</option>
              <option value="good">Bien</option>
              <option value="neutral">Neutral</option>
              <option value="bad">Mal</option>
              <option value="terrible">Terrible</option>
            </select>
          </div>
          <div>
            <label className="label">Condiciones del Mercado</label>
            <textarea className="input min-h-[60px]" value={note.market_conditions} onChange={e => setNote(p => ({ ...p, market_conditions: e.target.value }))}
              placeholder="Tendencia, volatilidad, noticias importantes..." />
          </div>
          <div>
            <label className="label">Plan Pre-Market</label>
            <textarea className="input min-h-[100px]" value={note.pre_market_plan} onChange={e => setNote(p => ({ ...p, pre_market_plan: e.target.value }))}
              placeholder="Qué planeas hacer hoy? Niveles, setups que buscar, reglas..." />
          </div>
          <div>
            <label className="label">Review Post-Market</label>
            <textarea className="input min-h-[100px]" value={note.post_market_review} onChange={e => setNote(p => ({ ...p, post_market_review: e.target.value }))}
              placeholder="Cómo fue el día? Seguiste tu plan? Qué mejorar?" />
          </div>
        </div>

        <div className="flex items-center gap-3 mt-4">
          <button className="btn-primary" onClick={handleSave} disabled={saving}>
            {saving ? 'Guardando...' : 'Guardar Notas'}
          </button>
          {saved && <span className="text-emerald-400 text-sm">Guardado!</span>}
        </div>
      </div>
    </div>
  )
}
