import { useState, useEffect } from 'react'
import { useParams, Link, useNavigate } from 'react-router-dom'
import { api } from '../utils/api'
import ReactMarkdown from 'react-markdown'
import { format } from 'date-fns'

export default function TradeDetail() {
  const { id } = useParams()
  const navigate = useNavigate()
  const [trade, setTrade] = useState(null)
  const [analyzing, setAnalyzing] = useState(false)
  const [analysis, setAnalysis] = useState(null)
  const [selectedImage, setSelectedImage] = useState(null)

  useEffect(() => { loadTrade() }, [id])

  async function loadTrade() {
    const data = await api.getTrade(id)
    setTrade(data)
    if (data.ai_analyses?.length > 0) {
      setAnalysis(data.ai_analyses[0].response)
    }
  }

  async function handleAnalyze() {
    setAnalyzing(true)
    try {
      const result = await api.analyzeTrade(id)
      setAnalysis(result.analysis)
    } catch (err) {
      alert('Error al analizar: ' + err.message)
    } finally {
      setAnalyzing(false)
    }
  }

  if (!trade) return <div className="text-gray-400">Cargando...</div>

  return (
    <div className="space-y-6 max-w-5xl">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-bold">{trade.symbol}</h1>
            <span className={trade.direction === 'long' ? 'badge-green' : 'badge-red'}>{trade.direction.toUpperCase()}</span>
            <span className={trade.status === 'closed' ? 'badge-blue' : 'badge-yellow'}>{trade.status}</span>
          </div>
          <p className="text-gray-400 text-sm mt-1">
            {trade.entry_date && format(new Date(trade.entry_date), 'dd/MM/yyyy')}
            {trade.exit_date && ` - ${format(new Date(trade.exit_date), 'dd/MM/yyyy')}`}
          </p>
        </div>
        <div className="flex gap-3">
          <Link to={`/trade/edit/${id}`} className="btn-secondary">Editar</Link>
          <button onClick={handleAnalyze} className="btn-primary" disabled={analyzing}>
            {analyzing ? 'Analizando...' : 'Analizar con IA'}
          </button>
        </div>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        <div className="stat-card">
          <span className="stat-label">P&L</span>
          <span className={`stat-value ${(trade.pnl || 0) >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
            {trade.pnl !== null ? `$${trade.pnl.toFixed(2)}` : '-'}
          </span>
        </div>
        <div className="stat-card">
          <span className="stat-label">R:R Planificado</span>
          <span className="stat-value text-blue-400">{trade.risk_reward_planned ? trade.risk_reward_planned.toFixed(2) : '-'}</span>
        </div>
        <div className="stat-card">
          <span className="stat-label">R:R Real</span>
          <span className="stat-value text-blue-400">{trade.risk_reward_actual ? trade.risk_reward_actual.toFixed(2) : '-'}</span>
        </div>
        <div className="stat-card">
          <span className="stat-label">Cantidad</span>
          <span className="stat-value">{trade.quantity}</span>
        </div>
        <div className="stat-card">
          <span className="stat-label">Rating</span>
          <span className="stat-value text-yellow-400">{trade.rating ? '★'.repeat(trade.rating) : '-'}</span>
        </div>
      </div>

      {/* Details Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="card">
          <h3 className="text-lg font-semibold mb-3">Detalles del Trade</h3>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between"><span className="text-gray-400">Entrada:</span><span>{trade.entry_price}</span></div>
            <div className="flex justify-between"><span className="text-gray-400">Salida:</span><span>{trade.exit_price || '-'}</span></div>
            <div className="flex justify-between"><span className="text-gray-400">Stop Loss:</span><span>{trade.stop_loss || '-'}</span></div>
            <div className="flex justify-between"><span className="text-gray-400">Take Profit:</span><span>{trade.take_profit || '-'}</span></div>
            <div className="flex justify-between"><span className="text-gray-400">Comisión:</span><span>${trade.commission}</span></div>
            <div className="flex justify-between"><span className="text-gray-400">Swap:</span><span>${trade.swap}</span></div>
            <div className="flex justify-between"><span className="text-gray-400">Timeframe:</span><span>{trade.timeframe || '-'}</span></div>
            <div className="flex justify-between"><span className="text-gray-400">Sesión:</span><span className="capitalize">{trade.session || '-'}</span></div>
          </div>
        </div>

        <div className="card">
          <h3 className="text-lg font-semibold mb-3">Psicología y Estrategia</h3>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between"><span className="text-gray-400">Setup:</span><span>{trade.setup || '-'}</span></div>
            <div className="flex justify-between"><span className="text-gray-400">Estrategia:</span><span>{trade.strategy || '-'}</span></div>
            <div className="flex justify-between"><span className="text-gray-400">Emoción antes:</span><span className="capitalize">{trade.emotion_before || '-'}</span></div>
            <div className="flex justify-between"><span className="text-gray-400">Emoción después:</span><span className="capitalize">{trade.emotion_after || '-'}</span></div>
            <div className="flex justify-between"><span className="text-gray-400">Siguió plan:</span><span>{trade.followed_plan ? 'Sí' : 'No'}</span></div>
          </div>
          {trade.tags?.length > 0 && (
            <div className="mt-3 flex gap-1 flex-wrap">
              {trade.tags.map(tag => <span key={tag} className="badge-blue">{tag}</span>)}
            </div>
          )}
        </div>
      </div>

      {/* Notes */}
      {(trade.notes || trade.mistakes || trade.lessons) && (
        <div className="card">
          <h3 className="text-lg font-semibold mb-3">Notas y Reflexión</h3>
          {trade.notes && <div className="mb-3"><p className="text-sm text-gray-400 mb-1">Notas:</p><p className="text-sm">{trade.notes}</p></div>}
          {trade.mistakes && <div className="mb-3"><p className="text-sm text-red-400 mb-1">Errores:</p><p className="text-sm">{trade.mistakes}</p></div>}
          {trade.lessons && <div><p className="text-sm text-emerald-400 mb-1">Lecciones:</p><p className="text-sm">{trade.lessons}</p></div>}
        </div>
      )}

      {/* Images */}
      {trade.images?.length > 0 && (
        <div className="card">
          <h3 className="text-lg font-semibold mb-3">Screenshots</h3>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            {trade.images.map(img => (
              <img key={img.id} src={`/uploads/${img.filename}`} alt={img.original_name}
                className="rounded-lg w-full h-48 object-cover cursor-pointer hover:opacity-80 transition-opacity"
                onClick={() => setSelectedImage(img)} />
            ))}
          </div>
        </div>
      )}

      {/* Image Modal */}
      {selectedImage && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50" onClick={() => setSelectedImage(null)}>
          <img src={`/uploads/${selectedImage.filename}`} alt={selectedImage.original_name} className="max-w-[90vw] max-h-[90vh] rounded-lg" />
        </div>
      )}

      {/* AI Analysis */}
      {analysis && (
        <div className="card border-blue-600/30">
          <h3 className="text-lg font-semibold mb-3 text-blue-400">Análisis IA</h3>
          <div className="prose prose-invert prose-sm max-w-none">
            <ReactMarkdown>{analysis}</ReactMarkdown>
          </div>
        </div>
      )}
    </div>
  )
}
