import { useState, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { api } from '../utils/api'
import { format } from 'date-fns'

export default function TradeList() {
  const [trades, setTrades] = useState([])
  const [loading, setLoading] = useState(true)
  const [filters, setFilters] = useState({ status: '', symbol: '', direction: '', strategy: '' })
  const navigate = useNavigate()

  useEffect(() => { loadTrades() }, [filters])

  async function loadTrades() {
    try {
      setLoading(true)
      const params = {}
      Object.entries(filters).forEach(([k, v]) => { if (v) params[k] = v })
      const data = await api.getTrades(params)
      setTrades(data)
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  async function handleDelete(id) {
    if (!confirm('Eliminar este trade?')) return
    await api.deleteTrade(id)
    loadTrades()
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Trades</h1>
        <Link to="/trade/new" className="btn-primary">+ Nuevo Trade</Link>
      </div>

      {/* Filters */}
      <div className="flex gap-3 flex-wrap">
        <select className="select" value={filters.status} onChange={e => setFilters(p => ({ ...p, status: e.target.value }))}>
          <option value="">Todos los estados</option>
          <option value="open">Abiertos</option>
          <option value="closed">Cerrados</option>
        </select>
        <select className="select" value={filters.direction} onChange={e => setFilters(p => ({ ...p, direction: e.target.value }))}>
          <option value="">Todas las direcciones</option>
          <option value="long">Long</option>
          <option value="short">Short</option>
        </select>
        <input className="input w-40" placeholder="Símbolo..." value={filters.symbol} onChange={e => setFilters(p => ({ ...p, symbol: e.target.value }))} />
        <input className="input w-40" placeholder="Estrategia..." value={filters.strategy} onChange={e => setFilters(p => ({ ...p, strategy: e.target.value }))} />
      </div>

      {/* Trade Table */}
      {loading ? (
        <div className="text-center py-12 text-gray-400">Cargando trades...</div>
      ) : trades.length === 0 ? (
        <div className="card text-center py-12">
          <p className="text-gray-400 mb-4">No hay trades registrados</p>
          <Link to="/trade/new" className="btn-primary">Registrar primer trade</Link>
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-dark-600 text-left text-sm text-gray-400">
                <th className="pb-3 pr-4">Fecha</th>
                <th className="pb-3 pr-4">Símbolo</th>
                <th className="pb-3 pr-4">Dir.</th>
                <th className="pb-3 pr-4">Estado</th>
                <th className="pb-3 pr-4">Entrada</th>
                <th className="pb-3 pr-4">Salida</th>
                <th className="pb-3 pr-4">P&L</th>
                <th className="pb-3 pr-4">R:R</th>
                <th className="pb-3 pr-4">Setup</th>
                <th className="pb-3 pr-4">Rating</th>
                <th className="pb-3"></th>
              </tr>
            </thead>
            <tbody>
              {trades.map(trade => (
                <tr key={trade.id} className="border-b border-dark-700 hover:bg-dark-700/50 cursor-pointer" onClick={() => navigate(`/trade/${trade.id}`)}>
                  <td className="py-3 pr-4 text-sm">{trade.entry_date ? format(new Date(trade.entry_date), 'dd/MM/yyyy') : '-'}</td>
                  <td className="py-3 pr-4 font-medium">{trade.symbol}</td>
                  <td className="py-3 pr-4">
                    <span className={trade.direction === 'long' ? 'badge-green' : 'badge-red'}>
                      {trade.direction.toUpperCase()}
                    </span>
                  </td>
                  <td className="py-3 pr-4">
                    <span className={trade.status === 'closed' ? 'badge-blue' : 'badge-yellow'}>
                      {trade.status}
                    </span>
                  </td>
                  <td className="py-3 pr-4 text-sm">{trade.entry_price}</td>
                  <td className="py-3 pr-4 text-sm">{trade.exit_price || '-'}</td>
                  <td className={`py-3 pr-4 font-medium ${trade.pnl > 0 ? 'text-emerald-400' : trade.pnl < 0 ? 'text-red-400' : ''}`}>
                    {trade.pnl !== null ? `$${trade.pnl.toFixed(2)}` : '-'}
                  </td>
                  <td className="py-3 pr-4 text-sm">{trade.risk_reward_actual ? trade.risk_reward_actual.toFixed(2) : '-'}</td>
                  <td className="py-3 pr-4 text-sm text-gray-400">{trade.setup || '-'}</td>
                  <td className="py-3 pr-4 text-sm">
                    {trade.rating ? '★'.repeat(trade.rating) + '☆'.repeat(5 - trade.rating) : '-'}
                  </td>
                  <td className="py-3 text-right">
                    <button className="text-gray-400 hover:text-red-400 text-sm" onClick={e => { e.stopPropagation(); handleDelete(trade.id); }}>
                      Eliminar
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Summary */}
      {trades.length > 0 && (
        <div className="flex gap-6 text-sm text-gray-400">
          <span>Total: {trades.length}</span>
          <span className="text-emerald-400">Wins: {trades.filter(t => t.pnl > 0).length}</span>
          <span className="text-red-400">Losses: {trades.filter(t => t.pnl < 0).length}</span>
          <span>P&L: <span className={trades.reduce((s, t) => s + (t.pnl || 0), 0) >= 0 ? 'text-emerald-400' : 'text-red-400'}>
            ${trades.reduce((s, t) => s + (t.pnl || 0), 0).toFixed(2)}
          </span></span>
        </div>
      )}
    </div>
  )
}
