import { useState, useEffect } from 'react'
import { api } from '../utils/api'
import { AreaChart, Area, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts'

const COLORS = ['#10b981', '#ef4444', '#3b82f6', '#f59e0b', '#8b5cf6', '#ec4899']

export default function Dashboard() {
  const [stats, setStats] = useState(null)
  const [loading, setLoading] = useState(true)
  const [dateRange, setDateRange] = useState({ from: '', to: '' })

  useEffect(() => {
    loadStats()
  }, [dateRange])

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

  if (loading) return <div className="flex items-center justify-center h-64"><div className="text-gray-400">Cargando dashboard...</div></div>
  if (!stats) return <div className="text-gray-400">No hay datos disponibles</div>

  const winLossData = [
    { name: 'Wins', value: stats.wins },
    { name: 'Losses', value: stats.losses },
    { name: 'Breakeven', value: stats.breakeven }
  ].filter(d => d.value > 0)

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Dashboard</h1>
        <div className="flex gap-3">
          <input type="date" className="input w-auto" value={dateRange.from} onChange={e => setDateRange(p => ({ ...p, from: e.target.value }))} />
          <input type="date" className="input w-auto" value={dateRange.to} onChange={e => setDateRange(p => ({ ...p, to: e.target.value }))} />
        </div>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
        <div className="stat-card">
          <span className="stat-label">Total Trades</span>
          <span className="stat-value">{stats.totalTrades}</span>
        </div>
        <div className="stat-card">
          <span className="stat-label">Win Rate</span>
          <span className={`stat-value ${stats.winRate >= 50 ? 'text-emerald-400' : 'text-red-400'}`}>{stats.winRate.toFixed(1)}%</span>
        </div>
        <div className="stat-card">
          <span className="stat-label">P&L Total</span>
          <span className={`stat-value ${stats.total_pnl >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>${stats.total_pnl.toFixed(2)}</span>
        </div>
        <div className="stat-card">
          <span className="stat-label">Profit Factor</span>
          <span className={`stat-value ${stats.profitFactor >= 1 ? 'text-emerald-400' : 'text-red-400'}`}>{stats.profitFactor.toFixed(2)}</span>
        </div>
        <div className="stat-card">
          <span className="stat-label">Avg R:R</span>
          <span className="stat-value text-blue-400">{stats.avgRR.toFixed(2)}</span>
        </div>
        <div className="stat-card">
          <span className="stat-label">Max Drawdown</span>
          <span className="stat-value text-red-400">${stats.maxDrawdown.toFixed(2)}</span>
        </div>
      </div>

      {/* Second Row Metrics */}
      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
        <div className="stat-card">
          <span className="stat-label">Avg P&L</span>
          <span className={`stat-value text-lg ${stats.avg_pnl >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>${stats.avg_pnl.toFixed(2)}</span>
        </div>
        <div className="stat-card">
          <span className="stat-label">Avg Win</span>
          <span className="stat-value text-lg text-emerald-400">${stats.avg_win.toFixed(2)}</span>
        </div>
        <div className="stat-card">
          <span className="stat-label">Avg Loss</span>
          <span className="stat-value text-lg text-red-400">${stats.avg_loss.toFixed(2)}</span>
        </div>
        <div className="stat-card">
          <span className="stat-label">Best Trade</span>
          <span className="stat-value text-lg text-emerald-400">${stats.best_trade.toFixed(2)}</span>
        </div>
        <div className="stat-card">
          <span className="stat-label">Worst Trade</span>
          <span className="stat-value text-lg text-red-400">${stats.worst_trade.toFixed(2)}</span>
        </div>
        <div className="stat-card">
          <span className="stat-label">Comisiones</span>
          <span className="stat-value text-lg text-yellow-400">${stats.total_commissions.toFixed(2)}</span>
        </div>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Equity Curve */}
        <div className="card">
          <h3 className="text-lg font-semibold mb-4">Curva de Equidad</h3>
          {stats.equityCurve.length > 0 ? (
            <ResponsiveContainer width="100%" height={300}>
              <AreaChart data={stats.equityCurve}>
                <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                <XAxis dataKey="date" stroke="#64748b" fontSize={12} />
                <YAxis stroke="#64748b" fontSize={12} />
                <Tooltip contentStyle={{ backgroundColor: '#1e293b', border: '1px solid #334155', borderRadius: '8px' }} />
                <Area type="monotone" dataKey="cumulative" stroke="#3b82f6" fill="#3b82f6" fillOpacity={0.1} />
              </AreaChart>
            </ResponsiveContainer>
          ) : <p className="text-gray-500 text-center py-12">No hay datos suficientes</p>}
        </div>

        {/* Win/Loss Distribution */}
        <div className="card">
          <h3 className="text-lg font-semibold mb-4">Distribución Win/Loss</h3>
          {winLossData.length > 0 ? (
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie data={winLossData} cx="50%" cy="50%" innerRadius={60} outerRadius={100} dataKey="value" label={({ name, value }) => `${name}: ${value}`}>
                  {winLossData.map((_, i) => <Cell key={i} fill={COLORS[i]} />)}
                </Pie>
                <Tooltip contentStyle={{ backgroundColor: '#1e293b', border: '1px solid #334155', borderRadius: '8px' }} />
              </PieChart>
            </ResponsiveContainer>
          ) : <p className="text-gray-500 text-center py-12">No hay datos suficientes</p>}
        </div>

        {/* P&L by Day of Week */}
        <div className="card">
          <h3 className="text-lg font-semibold mb-4">P&L por Día de la Semana</h3>
          {stats.byDayOfWeek.length > 0 ? (
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={stats.byDayOfWeek}>
                <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                <XAxis dataKey="day" stroke="#64748b" />
                <YAxis stroke="#64748b" />
                <Tooltip contentStyle={{ backgroundColor: '#1e293b', border: '1px solid #334155', borderRadius: '8px' }} />
                <Bar dataKey="pnl" fill="#3b82f6" radius={[4, 4, 0, 0]}>
                  {stats.byDayOfWeek.map((entry, i) => (
                    <Cell key={i} fill={entry.pnl >= 0 ? '#10b981' : '#ef4444'} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          ) : <p className="text-gray-500 text-center py-12">No hay datos suficientes</p>}
        </div>

        {/* P&L by Strategy */}
        <div className="card">
          <h3 className="text-lg font-semibold mb-4">P&L por Estrategia</h3>
          {stats.byStrategy.length > 0 ? (
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={stats.byStrategy} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                <XAxis type="number" stroke="#64748b" />
                <YAxis type="category" dataKey="strategy" stroke="#64748b" width={100} fontSize={12} />
                <Tooltip contentStyle={{ backgroundColor: '#1e293b', border: '1px solid #334155', borderRadius: '8px' }} />
                <Bar dataKey="pnl" radius={[0, 4, 4, 0]}>
                  {stats.byStrategy.map((entry, i) => (
                    <Cell key={i} fill={entry.pnl >= 0 ? '#10b981' : '#ef4444'} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          ) : <p className="text-gray-500 text-center py-12">No hay datos suficientes</p>}
        </div>

        {/* By Symbol */}
        <div className="card">
          <h3 className="text-lg font-semibold mb-4">Top Símbolos</h3>
          <div className="space-y-2 max-h-72 overflow-y-auto">
            {stats.bySymbol.map(s => (
              <div key={s.symbol} className="flex items-center justify-between px-3 py-2 bg-dark-700 rounded-lg">
                <div>
                  <span className="font-medium">{s.symbol}</span>
                  <span className="text-sm text-gray-400 ml-2">{s.trades} trades</span>
                </div>
                <div className="text-right">
                  <span className={s.pnl >= 0 ? 'text-emerald-400' : 'text-red-400'}>${s.pnl.toFixed(2)}</span>
                  <span className="text-sm text-gray-400 ml-2">WR: {((s.wins / s.trades) * 100).toFixed(0)}%</span>
                </div>
              </div>
            ))}
            {stats.bySymbol.length === 0 && <p className="text-gray-500 text-center py-4">Sin datos</p>}
          </div>
        </div>

        {/* Emotion Analysis */}
        <div className="card">
          <h3 className="text-lg font-semibold mb-4">Impacto Emocional</h3>
          <div className="space-y-2 max-h-72 overflow-y-auto">
            {stats.byEmotionBefore.map(e => (
              <div key={e.emotion} className="flex items-center justify-between px-3 py-2 bg-dark-700 rounded-lg">
                <div>
                  <span className="font-medium capitalize">{e.emotion}</span>
                  <span className="text-sm text-gray-400 ml-2">{e.trades} trades</span>
                </div>
                <div className="text-right">
                  <span className={e.pnl >= 0 ? 'text-emerald-400' : 'text-red-400'}>${e.pnl.toFixed(2)}</span>
                  <span className="text-sm text-gray-400 ml-2">WR: {((e.wins / e.trades) * 100).toFixed(0)}%</span>
                </div>
              </div>
            ))}
            {stats.byEmotionBefore.length === 0 && <p className="text-gray-500 text-center py-4">Sin datos emocionales</p>}
          </div>
        </div>
      </div>

      {/* Consecutive Stats */}
      <div className="grid grid-cols-2 gap-4">
        <div className="stat-card">
          <span className="stat-label">Max Wins Consecutivos</span>
          <span className="stat-value text-emerald-400">{stats.maxConsecWins}</span>
        </div>
        <div className="stat-card">
          <span className="stat-label">Max Losses Consecutivos</span>
          <span className="stat-value text-red-400">{stats.maxConsecLosses}</span>
        </div>
      </div>
    </div>
  )
}
