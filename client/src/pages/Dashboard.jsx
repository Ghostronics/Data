import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { api } from '../utils/api'
import { AreaChart, Area, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts'
import { format, startOfMonth, endOfMonth, eachDayOfInterval, isSameDay, getDay, addMonths, subMonths } from 'date-fns'
import { es } from 'date-fns/locale'

export default function Dashboard() {
  const navigate = useNavigate()
  const [stats, setStats] = useState(null)
  const [loading, setLoading] = useState(true)
  const [dateRange, setDateRange] = useState({ from: '', to: '' })
  const [calMonth, setCalMonth] = useState(new Date())
  const [allTrades, setAllTrades] = useState([])

  useEffect(() => { loadStats() }, [dateRange])
  useEffect(() => { loadTrades() }, [])

  async function loadStats() {
    try {
      setLoading(true)
      const params = {}
      if (dateRange.from) params.from = dateRange.from
      if (dateRange.to) params.to = dateRange.to
      const data = await api.getStats(params)
      setStats(data)
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  async function loadTrades() {
    try {
      const data = await api.getTrades({})
      setAllTrades(data)
    } catch (err) {
      console.error(err)
    }
  }

  if (loading) return (
    <div className="dash-loading">
      <div className="dash-loading-spinner" />
      <span>Cargando dashboard...</span>
    </div>
  )
  if (!stats) return <div className="dash-empty">No hay datos disponibles</div>

  const winLossData = [
    { name: 'Wins', value: stats.wins },
    { name: 'Losses', value: stats.losses },
    { name: 'BE', value: stats.breakeven }
  ].filter(d => d.value > 0)

  // Calendar data
  const monthStart = startOfMonth(calMonth)
  const monthEnd = endOfMonth(calMonth)
  const daysInMonth = eachDayOfInterval({ start: monthStart, end: monthEnd })
  const startPad = getDay(monthStart)

  // Map trades to dates
  const tradesByDate = {}
  allTrades.forEach(t => {
    const d = t.entry_date?.split('T')[0]
    if (d) {
      if (!tradesByDate[d]) tradesByDate[d] = { trades: [], pnl: 0 }
      tradesByDate[d].trades.push(t)
      tradesByDate[d].pnl += (t.pnl || 0)
    }
  })

  const CHART_COLORS = ['#00ff88', '#ff4466', '#3b82f6']
  const tooltipStyle = { backgroundColor: '#0a0a0a', border: '1px solid rgba(0,255,136,0.15)', borderRadius: '8px', color: '#e5e7eb' }

  return (
    <div className="dash">
      {/* Header */}
      <div className="dash-header">
        <div>
          <h1 className="dash-title">Dashboard</h1>
          <p className="dash-subtitle">Resumen de tu rendimiento</p>
        </div>
        <div className="dash-date-filters">
          <input type="date" className="dash-date-input" value={dateRange.from} onChange={e => setDateRange(p => ({ ...p, from: e.target.value }))} />
          <span className="dash-date-sep">—</span>
          <input type="date" className="dash-date-input" value={dateRange.to} onChange={e => setDateRange(p => ({ ...p, to: e.target.value }))} />
        </div>
      </div>

      {/* Key Metrics */}
      <div className="dash-metrics">
        <div className="dash-metric">
          <span className="dash-metric-label">Total Trades</span>
          <span className="dash-metric-value">{stats.totalTrades}</span>
        </div>
        <div className="dash-metric">
          <span className="dash-metric-label">Win Rate</span>
          <span className={`dash-metric-value ${stats.winRate >= 50 ? 'profit' : 'loss'}`}>{stats.winRate.toFixed(1)}%</span>
        </div>
        <div className="dash-metric accent">
          <span className="dash-metric-label">P&L Total</span>
          <span className={`dash-metric-value big ${stats.total_pnl >= 0 ? 'profit' : 'loss'}`}>
            {stats.total_pnl >= 0 ? '+' : ''}${stats.total_pnl.toFixed(2)}
          </span>
        </div>
        <div className="dash-metric">
          <span className="dash-metric-label">Profit Factor</span>
          <span className={`dash-metric-value ${stats.profitFactor >= 1 ? 'profit' : 'loss'}`}>{stats.profitFactor.toFixed(2)}</span>
        </div>
        <div className="dash-metric">
          <span className="dash-metric-label">Avg Win</span>
          <span className="dash-metric-value profit">${stats.avg_win.toFixed(2)}</span>
        </div>
        <div className="dash-metric">
          <span className="dash-metric-label">Avg Loss</span>
          <span className="dash-metric-value loss">${stats.avg_loss.toFixed(2)}</span>
        </div>
        <div className="dash-metric">
          <span className="dash-metric-label">Best Trade</span>
          <span className="dash-metric-value profit">${stats.best_trade.toFixed(2)}</span>
        </div>
        <div className="dash-metric">
          <span className="dash-metric-label">Max Drawdown</span>
          <span className="dash-metric-value loss">${stats.maxDrawdown.toFixed(2)}</span>
        </div>
      </div>

      {/* Trading Calendar */}
      <div className="dash-card dash-calendar-card">
        <div className="dash-card-header">
          <h3 className="dash-card-title">Calendario de Trading</h3>
          <div className="dash-cal-nav">
            <button onClick={() => setCalMonth(subMonths(calMonth, 1))} className="dash-cal-arrow">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M15 18l-6-6 6-6"/></svg>
            </button>
            <span className="dash-cal-month">{format(calMonth, 'MMMM yyyy', { locale: es })}</span>
            <button onClick={() => setCalMonth(addMonths(calMonth, 1))} className="dash-cal-arrow">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M9 18l6-6-6-6"/></svg>
            </button>
          </div>
        </div>

        <div className="dash-cal-grid-header">
          {['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'].map(d => (
            <span key={d} className="dash-cal-dlabel">{d}</span>
          ))}
        </div>
        <div className="dash-cal-grid">
          {Array.from({ length: startPad }).map((_, i) => (
            <div key={`pad-${i}`} className="dash-cal-cell empty" />
          ))}
          {daysInMonth.map(day => {
            const dateStr = format(day, 'yyyy-MM-dd')
            const dayData = tradesByDate[dateStr]
            const isToday = isSameDay(day, new Date())
            const hasTrades = dayData && dayData.trades.length > 0
            const pnlClass = hasTrades ? (dayData.pnl > 0 ? 'win' : dayData.pnl < 0 ? 'lose' : 'be') : ''

            return (
              <div
                key={dateStr}
                className={`dash-cal-cell ${pnlClass} ${isToday ? 'today' : ''}`}
                onClick={() => hasTrades ? navigate(`/trades?date=${dateStr}`) : navigate('/trade/new')}
                title={hasTrades ? `${dayData.trades.length} trades | P&L: $${dayData.pnl.toFixed(2)}` : 'Click para añadir trade'}
              >
                <span className="dash-cal-num">{format(day, 'd')}</span>
                {hasTrades && (
                  <div className="dash-cal-info">
                    <span className="dash-cal-trades">{dayData.trades.length}t</span>
                    <span className={`dash-cal-pnl ${dayData.pnl >= 0 ? 'profit' : 'loss'}`}>
                      {dayData.pnl >= 0 ? '+' : ''}{dayData.pnl.toFixed(0)}
                    </span>
                  </div>
                )}
                {!hasTrades && (
                  <span className="dash-cal-add">+</span>
                )}
              </div>
            )
          })}
        </div>
      </div>

      {/* Charts Grid */}
      <div className="dash-charts-grid">
        {/* Equity Curve */}
        <div className="dash-card">
          <h3 className="dash-card-title">Curva de Equidad</h3>
          {stats.equityCurve.length > 0 ? (
            <ResponsiveContainer width="100%" height={280}>
              <AreaChart data={stats.equityCurve}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                <XAxis dataKey="date" stroke="#4b5563" fontSize={11} />
                <YAxis stroke="#4b5563" fontSize={11} />
                <Tooltip contentStyle={tooltipStyle} />
                <Area type="monotone" dataKey="cumulative" stroke="#00ff88" fill="#00ff88" fillOpacity={0.08} strokeWidth={2} />
              </AreaChart>
            </ResponsiveContainer>
          ) : <p className="dash-no-data">No hay datos suficientes</p>}
        </div>

        {/* Win/Loss */}
        <div className="dash-card">
          <h3 className="dash-card-title">Distribución Win/Loss</h3>
          {winLossData.length > 0 ? (
            <ResponsiveContainer width="100%" height={280}>
              <PieChart>
                <Pie data={winLossData} cx="50%" cy="50%" innerRadius={60} outerRadius={95} dataKey="value" label={({ name, value }) => `${name}: ${value}`}>
                  {winLossData.map((_, i) => <Cell key={i} fill={CHART_COLORS[i]} />)}
                </Pie>
                <Tooltip contentStyle={tooltipStyle} />
              </PieChart>
            </ResponsiveContainer>
          ) : <p className="dash-no-data">No hay datos suficientes</p>}
        </div>

        {/* P&L by Day */}
        <div className="dash-card">
          <h3 className="dash-card-title">P&L por Día de la Semana</h3>
          {stats.byDayOfWeek.length > 0 ? (
            <ResponsiveContainer width="100%" height={280}>
              <BarChart data={stats.byDayOfWeek}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                <XAxis dataKey="day" stroke="#4b5563" fontSize={11} />
                <YAxis stroke="#4b5563" fontSize={11} />
                <Tooltip contentStyle={tooltipStyle} />
                <Bar dataKey="pnl" radius={[4, 4, 0, 0]}>
                  {stats.byDayOfWeek.map((entry, i) => (
                    <Cell key={i} fill={entry.pnl >= 0 ? '#00ff88' : '#ff4466'} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          ) : <p className="dash-no-data">No hay datos suficientes</p>}
        </div>

        {/* P&L by Strategy */}
        <div className="dash-card">
          <h3 className="dash-card-title">P&L por Estrategia</h3>
          {stats.byStrategy.length > 0 ? (
            <ResponsiveContainer width="100%" height={280}>
              <BarChart data={stats.byStrategy} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                <XAxis type="number" stroke="#4b5563" fontSize={11} />
                <YAxis type="category" dataKey="strategy" stroke="#4b5563" width={80} fontSize={11} />
                <Tooltip contentStyle={tooltipStyle} />
                <Bar dataKey="pnl" radius={[0, 4, 4, 0]}>
                  {stats.byStrategy.map((entry, i) => (
                    <Cell key={i} fill={entry.pnl >= 0 ? '#00ff88' : '#ff4466'} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          ) : <p className="dash-no-data">No hay datos suficientes</p>}
        </div>

        {/* Top Symbols */}
        <div className="dash-card">
          <h3 className="dash-card-title">Top Símbolos</h3>
          <div className="dash-list">
            {stats.bySymbol.map(s => (
              <div key={s.symbol} className="dash-list-row">
                <div>
                  <span className="dash-list-main">{s.symbol}</span>
                  <span className="dash-list-sub">{s.trades} trades</span>
                </div>
                <div className="dash-list-right">
                  <span className={s.pnl >= 0 ? 'profit' : 'loss'}>${s.pnl.toFixed(2)}</span>
                  <span className="dash-list-sub">WR: {((s.wins / s.trades) * 100).toFixed(0)}%</span>
                </div>
              </div>
            ))}
            {stats.bySymbol.length === 0 && <p className="dash-no-data">Sin datos</p>}
          </div>
        </div>

        {/* Emotion Analysis */}
        <div className="dash-card">
          <h3 className="dash-card-title">Impacto Emocional</h3>
          <div className="dash-list">
            {stats.byEmotionBefore.map(e => (
              <div key={e.emotion} className="dash-list-row">
                <div>
                  <span className="dash-list-main capitalize">{e.emotion}</span>
                  <span className="dash-list-sub">{e.trades} trades</span>
                </div>
                <div className="dash-list-right">
                  <span className={e.pnl >= 0 ? 'profit' : 'loss'}>${e.pnl.toFixed(2)}</span>
                  <span className="dash-list-sub">WR: {((e.wins / e.trades) * 100).toFixed(0)}%</span>
                </div>
              </div>
            ))}
            {stats.byEmotionBefore.length === 0 && <p className="dash-no-data">Sin datos emocionales</p>}
          </div>
        </div>
      </div>

      {/* Streaks */}
      <div className="dash-streaks">
        <div className="dash-metric">
          <span className="dash-metric-label">Max Wins Consecutivos</span>
          <span className="dash-metric-value profit">{stats.maxConsecWins}</span>
        </div>
        <div className="dash-metric">
          <span className="dash-metric-label">Max Losses Consecutivos</span>
          <span className="dash-metric-value loss">{stats.maxConsecLosses}</span>
        </div>
      </div>
    </div>
  )
}
