import { useState, useEffect } from 'react'
import { api } from '../utils/api'
import { format, subDays, addDays, startOfMonth, endOfMonth, eachDayOfInterval, isSameDay, getDay } from 'date-fns'
import { es } from 'date-fns/locale'

const MOODS = [
  { value: 'excellent', label: 'Excelente', emoji: '🟢', color: 'text-emerald-400' },
  { value: 'good', label: 'Bien', emoji: '🔵', color: 'text-blue-400' },
  { value: 'neutral', label: 'Neutral', emoji: '🟡', color: 'text-yellow-400' },
  { value: 'bad', label: 'Mal', emoji: '🟠', color: 'text-orange-400' },
  { value: 'terrible', label: 'Terrible', emoji: '🔴', color: 'text-red-400' },
]

export default function DailyJournal() {
  const [date, setDate] = useState(new Date().toISOString().split('T')[0])
  const [note, setNote] = useState({
    pre_market_plan: '', post_market_review: '', mood: '', market_conditions: ''
  })
  const [trades, setTrades] = useState([])
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [activeTab, setActiveTab] = useState('journal')

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
      setTimeout(() => setSaved(false), 2500)
    } catch (err) {
      alert('Error: ' + err.message)
    } finally {
      setSaving(false)
    }
  }

  const dayPnl = trades.reduce((sum, t) => sum + (t.pnl || 0), 0)
  const wins = trades.filter(t => (t.pnl || 0) > 0).length
  const losses = trades.filter(t => (t.pnl || 0) < 0).length
  const winRate = trades.length > 0 ? ((wins / trades.length) * 100).toFixed(0) : null
  const selectedDate = new Date(date + 'T12:00:00')
  const currentMood = MOODS.find(m => m.value === note.mood)
  const dayLabel = format(selectedDate, "EEEE, d 'de' MMMM yyyy", { locale: es })

  // Mini calendar
  const monthStart = startOfMonth(selectedDate)
  const monthEnd = endOfMonth(selectedDate)
  const daysInMonth = eachDayOfInterval({ start: monthStart, end: monthEnd })
  const startPad = getDay(monthStart)

  return (
    <div className="daily-journal">
      {/* Header */}
      <div className="dj-header">
        <div>
          <h1 className="dj-title">Diario de Trading</h1>
          <p className="dj-subtitle">{dayLabel}</p>
        </div>
        <div className="dj-date-nav">
          <button className="dj-nav-btn" onClick={() => setDate(format(subDays(selectedDate, 1), 'yyyy-MM-dd'))}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M15 18l-6-6 6-6"/></svg>
          </button>
          <input type="date" className="dj-date-input" value={date} onChange={e => setDate(e.target.value)} />
          <button className="dj-nav-btn" onClick={() => setDate(format(addDays(selectedDate, 1), 'yyyy-MM-dd'))}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M9 18l6-6-6-6"/></svg>
          </button>
        </div>
      </div>

      {/* Stats Row */}
      <div className="dj-stats-row">
        <div className="dj-stat">
          <span className="dj-stat-label">P&L del Día</span>
          <span className={`dj-stat-value ${dayPnl >= 0 ? 'profit' : 'loss'}`}>
            {dayPnl >= 0 ? '+' : ''}${dayPnl.toFixed(2)}
          </span>
        </div>
        <div className="dj-stat-divider" />
        <div className="dj-stat">
          <span className="dj-stat-label">Trades</span>
          <span className="dj-stat-value">{trades.length}</span>
        </div>
        <div className="dj-stat-divider" />
        <div className="dj-stat">
          <span className="dj-stat-label">Win Rate</span>
          <span className="dj-stat-value">{winRate ? `${winRate}%` : '—'}</span>
        </div>
        <div className="dj-stat-divider" />
        <div className="dj-stat">
          <span className="dj-stat-label">Estado</span>
          <span className="dj-stat-value">{currentMood ? `${currentMood.emoji} ${currentMood.label}` : '—'}</span>
        </div>
      </div>

      {/* Mobile Tabs */}
      <div className="dj-tabs">
        <button className={`dj-tab ${activeTab === 'journal' ? 'active' : ''}`} onClick={() => setActiveTab('journal')}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 20h9"/><path d="M16.5 3.5a2.121 2.121 0 013 3L7 19l-4 1 1-4L16.5 3.5z"/></svg>
          Diario
        </button>
        <button className={`dj-tab ${activeTab === 'trades' ? 'active' : ''}`} onClick={() => setActiveTab('trades')}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M22 12h-4l-3 9L9 3l-3 9H2"/></svg>
          Trades ({trades.length})
        </button>
        <button className={`dj-tab ${activeTab === 'calendar' ? 'active' : ''}`} onClick={() => setActiveTab('calendar')}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>
          Calendario
        </button>
      </div>

      <div className="dj-content">
        {/* Journal Section */}
        <div className={`dj-main ${activeTab !== 'journal' ? 'dj-hidden-mobile' : ''}`}>
          {/* Mood Selector */}
          <div className="dj-card">
            <h3 className="dj-card-title">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"/><path d="M8 14s1.5 2 4 2 4-2 4-2"/><line x1="9" y1="9" x2="9.01" y2="9"/><line x1="15" y1="9" x2="15.01" y2="9"/></svg>
              Estado de Ánimo
            </h3>
            <div className="dj-mood-grid">
              {MOODS.map(m => (
                <button
                  key={m.value}
                  className={`dj-mood-btn ${note.mood === m.value ? 'active' : ''}`}
                  onClick={() => setNote(p => ({ ...p, mood: m.value }))}
                >
                  <span className="dj-mood-emoji">{m.emoji}</span>
                  <span className="dj-mood-label">{m.label}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Market Conditions */}
          <div className="dj-card">
            <h3 className="dj-card-title">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M22 12h-4l-3 9L9 3l-3 9H2"/></svg>
              Condiciones del Mercado
            </h3>
            <textarea
              className="dj-textarea"
              rows="3"
              value={note.market_conditions}
              onChange={e => setNote(p => ({ ...p, market_conditions: e.target.value }))}
              placeholder="Tendencia general, volatilidad, noticias clave, niveles importantes..."
            />
          </div>

          {/* Pre-Market Plan */}
          <div className="dj-card">
            <h3 className="dj-card-title">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M9 11l3 3L22 4"/><path d="M21 12v7a2 2 0 01-2 2H5a2 2 0 01-2-2V5a2 2 0 012-2h11"/></svg>
              Plan Pre-Market
            </h3>
            <textarea
              className="dj-textarea"
              rows="4"
              value={note.pre_market_plan}
              onChange={e => setNote(p => ({ ...p, pre_market_plan: e.target.value }))}
              placeholder="¿Qué setups buscarás hoy? Niveles clave, reglas de riesgo, metas del día..."
            />
          </div>

          {/* Post-Market Review */}
          <div className="dj-card">
            <h3 className="dj-card-title">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/></svg>
              Review Post-Market
            </h3>
            <textarea
              className="dj-textarea"
              rows="4"
              value={note.post_market_review}
              onChange={e => setNote(p => ({ ...p, post_market_review: e.target.value }))}
              placeholder="¿Seguiste tu plan? ¿Qué hiciste bien? ¿Qué puedes mejorar mañana?"
            />
          </div>

          {/* Save Button */}
          <div className="dj-save-bar">
            <button className="dj-save-btn" onClick={handleSave} disabled={saving}>
              {saving ? (
                <><svg className="dj-spinner" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83"/></svg>Guardando...</>
              ) : saved ? (
                <><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M20 6L9 17l-5-5"/></svg>Guardado</>
              ) : (
                <><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M19 21H5a2 2 0 01-2-2V5a2 2 0 012-2h11l5 5v11a2 2 0 01-2 2z"/><polyline points="17 21 17 13 7 13 7 21"/><polyline points="7 3 7 8 15 8"/></svg>Guardar Notas</>
              )}
            </button>
            {saved && <span className="dj-saved-msg">Cambios guardados correctamente</span>}
          </div>
        </div>

        {/* Trades Section */}
        <div className={`dj-sidebar-section ${activeTab !== 'trades' ? 'dj-hidden-mobile' : ''}`}>
          <div className="dj-card">
            <h3 className="dj-card-title">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M22 12h-4l-3 9L9 3l-3 9H2"/></svg>
              Trades del Día
            </h3>
            {trades.length === 0 ? (
              <div className="dj-empty">
                <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="dj-empty-icon"><path d="M22 12h-4l-3 9L9 3l-3 9H2"/></svg>
                <p>Sin trades para este día</p>
                <span>Los trades aparecerán aquí automáticamente</span>
              </div>
            ) : (
              <div className="dj-trades-list">
                {trades.map(t => (
                  <div key={t.id} className="dj-trade-row">
                    <div className="dj-trade-info">
                      <div className="dj-trade-top">
                        <span className="dj-trade-symbol">{t.symbol}</span>
                        <span className={`dj-trade-dir ${t.direction === 'long' ? 'long' : 'short'}`}>
                          {t.direction === 'long' ? '▲' : '▼'} {t.direction?.toUpperCase()}
                        </span>
                      </div>
                      {t.setup && <span className="dj-trade-setup">{t.setup}</span>}
                    </div>
                    <span className={`dj-trade-pnl ${(t.pnl || 0) >= 0 ? 'profit' : 'loss'}`}>
                      {t.pnl !== null ? `${t.pnl >= 0 ? '+' : ''}$${t.pnl.toFixed(2)}` : '—'}
                    </span>
                  </div>
                ))}
                {/* Summary bar */}
                <div className="dj-trades-summary">
                  <span>{wins}W - {losses}L</span>
                  <span className={dayPnl >= 0 ? 'profit' : 'loss'}>
                    Total: {dayPnl >= 0 ? '+' : ''}${dayPnl.toFixed(2)}
                  </span>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Calendar Section */}
        <div className={`dj-sidebar-section ${activeTab !== 'calendar' ? 'dj-hidden-mobile' : ''}`}>
          <div className="dj-card">
            <h3 className="dj-card-title">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>
              {format(selectedDate, 'MMMM yyyy', { locale: es })}
            </h3>
            <div className="dj-mini-cal">
              <div className="dj-cal-header">
                {['Do', 'Lu', 'Ma', 'Mi', 'Ju', 'Vi', 'Sa'].map(d => (
                  <span key={d} className="dj-cal-day-label">{d}</span>
                ))}
              </div>
              <div className="dj-cal-grid">
                {Array.from({ length: startPad }).map((_, i) => (
                  <span key={`pad-${i}`} className="dj-cal-day empty" />
                ))}
                {daysInMonth.map(day => {
                  const isSelected = isSameDay(day, selectedDate)
                  const isToday = isSameDay(day, new Date())
                  return (
                    <button
                      key={day.toISOString()}
                      className={`dj-cal-day ${isSelected ? 'selected' : ''} ${isToday ? 'today' : ''}`}
                      onClick={() => setDate(format(day, 'yyyy-MM-dd'))}
                    >
                      {format(day, 'd')}
                    </button>
                  )
                })}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
