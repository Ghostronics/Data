import { useState, useEffect, useCallback } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { useDropzone } from 'react-dropzone'
import { api } from '../utils/api'

const TIMEFRAMES = ['1m', '5m', '15m', '30m', '1h', '4h', 'D', 'W']
const SESSIONS = ['asian', 'london', 'new_york', 'overlap']
const EMOTIONS = ['confident', 'neutral', 'fearful', 'greedy', 'anxious', 'calm']
const EMOTIONS_AFTER = ['satisfied', 'neutral', 'frustrated', 'regretful', 'excited', 'calm']

const emptyTrade = {
  symbol: '', direction: 'long', status: 'open',
  entry_date: new Date().toISOString().split('T')[0], exit_date: '',
  entry_price: '', exit_price: '', stop_loss: '', take_profit: '',
  quantity: '', commission: '0', swap: '0',
  setup: '', strategy: '', timeframe: '', session: '',
  emotion_before: '', emotion_after: '', rating: '',
  followed_plan: true, notes: '', mistakes: '', lessons: '', tags: []
}

export default function TradeForm() {
  const { id } = useParams()
  const navigate = useNavigate()
  const [trade, setTrade] = useState(emptyTrade)
  const [files, setFiles] = useState([])
  const [existingImages, setExistingImages] = useState([])
  const [saving, setSaving] = useState(false)
  const [tagInput, setTagInput] = useState('')

  useEffect(() => {
    if (id) loadTrade()
  }, [id])

  async function loadTrade() {
    const data = await api.getTrade(id)
    setTrade({
      ...data,
      tags: data.tags || [],
      followed_plan: !!data.followed_plan
    })
    setExistingImages(data.images || [])
  }

  const onDrop = useCallback(acceptedFiles => {
    setFiles(prev => [...prev, ...acceptedFiles])
  }, [])

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop, accept: { 'image/*': ['.png', '.jpg', '.jpeg', '.webp'] }, maxFiles: 10
  })

  function updateField(field, value) {
    setTrade(prev => ({ ...prev, [field]: value }))
  }

  function addTag() {
    if (tagInput.trim() && !trade.tags.includes(tagInput.trim())) {
      updateField('tags', [...trade.tags, tagInput.trim()])
      setTagInput('')
    }
  }

  function removeTag(tag) {
    updateField('tags', trade.tags.filter(t => t !== tag))
  }

  async function handleSubmit(e) {
    e.preventDefault()
    setSaving(true)
    try {
      const payload = {
        ...trade,
        entry_price: parseFloat(trade.entry_price),
        exit_price: trade.exit_price ? parseFloat(trade.exit_price) : null,
        stop_loss: trade.stop_loss ? parseFloat(trade.stop_loss) : null,
        take_profit: trade.take_profit ? parseFloat(trade.take_profit) : null,
        quantity: parseFloat(trade.quantity),
        commission: parseFloat(trade.commission || 0),
        swap: parseFloat(trade.swap || 0),
        rating: trade.rating ? parseInt(trade.rating) : null,
        followed_plan: trade.followed_plan ? 1 : 0
      }

      let tradeId = id
      if (id) {
        await api.updateTrade(id, payload)
      } else {
        const result = await api.createTrade(payload)
        tradeId = result.id
      }

      // Upload images
      if (files.length > 0) {
        await api.uploadTradeImages(tradeId, files)
      }

      navigate(`/trade/${tradeId}`)
    } catch (err) {
      alert('Error: ' + err.message)
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="max-w-4xl">
      <h1 className="text-2xl font-bold mb-6">{id ? 'Editar Trade' : 'Nuevo Trade'}</h1>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Basic Info */}
        <div className="card">
          <h2 className="text-lg font-semibold mb-4">Información Básica</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div>
              <label className="label">Símbolo *</label>
              <input className="input" required value={trade.symbol} onChange={e => updateField('symbol', e.target.value.toUpperCase())} placeholder="EURUSD, SPY, BTC..." />
            </div>
            <div>
              <label className="label">Dirección *</label>
              <select className="select w-full" value={trade.direction} onChange={e => updateField('direction', e.target.value)}>
                <option value="long">Long</option>
                <option value="short">Short</option>
              </select>
            </div>
            <div>
              <label className="label">Estado</label>
              <select className="select w-full" value={trade.status} onChange={e => updateField('status', e.target.value)}>
                <option value="open">Abierto</option>
                <option value="closed">Cerrado</option>
                <option value="breakeven">Breakeven</option>
              </select>
            </div>
            <div>
              <label className="label">Timeframe</label>
              <select className="select w-full" value={trade.timeframe} onChange={e => updateField('timeframe', e.target.value)}>
                <option value="">Seleccionar</option>
                {TIMEFRAMES.map(tf => <option key={tf} value={tf}>{tf}</option>)}
              </select>
            </div>
          </div>
        </div>

        {/* Prices */}
        <div className="card">
          <h2 className="text-lg font-semibold mb-4">Precios y Gestión de Riesgo</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div>
              <label className="label">Fecha Entrada *</label>
              <input type="date" className="input" required value={trade.entry_date} onChange={e => updateField('entry_date', e.target.value)} />
            </div>
            <div>
              <label className="label">Fecha Salida</label>
              <input type="date" className="input" value={trade.exit_date} onChange={e => updateField('exit_date', e.target.value)} />
            </div>
            <div>
              <label className="label">Precio Entrada *</label>
              <input type="number" step="any" className="input" required value={trade.entry_price} onChange={e => updateField('entry_price', e.target.value)} />
            </div>
            <div>
              <label className="label">Precio Salida</label>
              <input type="number" step="any" className="input" value={trade.exit_price} onChange={e => updateField('exit_price', e.target.value)} />
            </div>
            <div>
              <label className="label">Stop Loss</label>
              <input type="number" step="any" className="input" value={trade.stop_loss} onChange={e => updateField('stop_loss', e.target.value)} />
            </div>
            <div>
              <label className="label">Take Profit</label>
              <input type="number" step="any" className="input" value={trade.take_profit} onChange={e => updateField('take_profit', e.target.value)} />
            </div>
            <div>
              <label className="label">Cantidad/Lotes *</label>
              <input type="number" step="any" className="input" required value={trade.quantity} onChange={e => updateField('quantity', e.target.value)} />
            </div>
            <div>
              <label className="label">Comisión</label>
              <input type="number" step="any" className="input" value={trade.commission} onChange={e => updateField('commission', e.target.value)} />
            </div>
          </div>
        </div>

        {/* Strategy & Session */}
        <div className="card">
          <h2 className="text-lg font-semibold mb-4">Estrategia y Sesión</h2>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            <div>
              <label className="label">Setup</label>
              <input className="input" value={trade.setup} onChange={e => updateField('setup', e.target.value)} placeholder="e.g., Break & Retest, FVG..." />
            </div>
            <div>
              <label className="label">Estrategia</label>
              <input className="input" value={trade.strategy} onChange={e => updateField('strategy', e.target.value)} placeholder="e.g., ICT, SMC, Price Action..." />
            </div>
            <div>
              <label className="label">Sesión</label>
              <select className="select w-full" value={trade.session} onChange={e => updateField('session', e.target.value)}>
                <option value="">Seleccionar</option>
                {SESSIONS.map(s => <option key={s} value={s}>{s.replace('_', ' ').replace(/\b\w/g, c => c.toUpperCase())}</option>)}
              </select>
            </div>
          </div>
        </div>

        {/* Psychology */}
        <div className="card">
          <h2 className="text-lg font-semibold mb-4">Psicología</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div>
              <label className="label">Emoción Antes</label>
              <select className="select w-full" value={trade.emotion_before} onChange={e => updateField('emotion_before', e.target.value)}>
                <option value="">Seleccionar</option>
                {EMOTIONS.map(e => <option key={e} value={e}>{e.charAt(0).toUpperCase() + e.slice(1)}</option>)}
              </select>
            </div>
            <div>
              <label className="label">Emoción Después</label>
              <select className="select w-full" value={trade.emotion_after} onChange={e => updateField('emotion_after', e.target.value)}>
                <option value="">Seleccionar</option>
                {EMOTIONS_AFTER.map(e => <option key={e} value={e}>{e.charAt(0).toUpperCase() + e.slice(1)}</option>)}
              </select>
            </div>
            <div>
              <label className="label">Rating (1-5)</label>
              <select className="select w-full" value={trade.rating} onChange={e => updateField('rating', e.target.value)}>
                <option value="">Sin rating</option>
                {[1, 2, 3, 4, 5].map(r => <option key={r} value={r}>{'★'.repeat(r)} ({r})</option>)}
              </select>
            </div>
            <div className="flex items-end">
              <label className="flex items-center gap-2 cursor-pointer">
                <input type="checkbox" className="w-5 h-5 rounded" checked={trade.followed_plan} onChange={e => updateField('followed_plan', e.target.checked)} />
                <span className="text-sm">Siguió el plan</span>
              </label>
            </div>
          </div>
        </div>

        {/* Notes */}
        <div className="card">
          <h2 className="text-lg font-semibold mb-4">Notas y Reflexión</h2>
          <div className="space-y-4">
            <div>
              <label className="label">Notas</label>
              <textarea className="input min-h-[80px]" value={trade.notes} onChange={e => updateField('notes', e.target.value)} placeholder="Notas generales sobre el trade..." />
            </div>
            <div>
              <label className="label">Errores</label>
              <textarea className="input min-h-[60px]" value={trade.mistakes} onChange={e => updateField('mistakes', e.target.value)} placeholder="Qué errores cometiste..." />
            </div>
            <div>
              <label className="label">Lecciones</label>
              <textarea className="input min-h-[60px]" value={trade.lessons} onChange={e => updateField('lessons', e.target.value)} placeholder="Qué aprendiste de este trade..." />
            </div>
            <div>
              <label className="label">Tags</label>
              <div className="flex gap-2 mb-2 flex-wrap">
                {trade.tags.map(tag => (
                  <span key={tag} className="badge-blue cursor-pointer" onClick={() => removeTag(tag)}>{tag} ×</span>
                ))}
              </div>
              <div className="flex gap-2">
                <input className="input" value={tagInput} onChange={e => setTagInput(e.target.value)} onKeyDown={e => e.key === 'Enter' && (e.preventDefault(), addTag())} placeholder="Agregar tag..." />
                <button type="button" className="btn-secondary" onClick={addTag}>+</button>
              </div>
            </div>
          </div>
        </div>

        {/* Images */}
        <div className="card">
          <h2 className="text-lg font-semibold mb-4">Screenshots / Charts</h2>

          {existingImages.length > 0 && (
            <div className="grid grid-cols-3 gap-4 mb-4">
              {existingImages.map(img => (
                <div key={img.id} className="relative group">
                  <img src={`/uploads/${img.filename}`} alt={img.original_name} className="rounded-lg w-full h-32 object-cover" />
                  <button type="button" className="absolute top-2 right-2 bg-red-600 text-white rounded-full w-6 h-6 text-xs opacity-0 group-hover:opacity-100 transition-opacity"
                    onClick={async () => {
                      await api.deleteTradeImage(img.id)
                      setExistingImages(prev => prev.filter(i => i.id !== img.id))
                    }}>×</button>
                </div>
              ))}
            </div>
          )}

          <div {...getRootProps()} className={`border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-colors ${isDragActive ? 'border-blue-500 bg-blue-500/10' : 'border-dark-500 hover:border-dark-400'}`}>
            <input {...getInputProps()} />
            {isDragActive ? (
              <p className="text-blue-400">Suelta las imágenes aquí...</p>
            ) : (
              <div>
                <p className="text-gray-400">Arrastra imágenes aquí o haz clic para seleccionar</p>
                <p className="text-sm text-gray-500 mt-1">PNG, JPG, WEBP (max 10MB)</p>
              </div>
            )}
          </div>

          {files.length > 0 && (
            <div className="mt-4 space-y-2">
              {files.map((file, i) => (
                <div key={i} className="flex items-center justify-between bg-dark-700 rounded-lg px-3 py-2">
                  <span className="text-sm">{file.name}</span>
                  <button type="button" className="text-red-400 text-sm" onClick={() => setFiles(prev => prev.filter((_, j) => j !== i))}>Quitar</button>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Submit */}
        <div className="flex gap-4">
          <button type="submit" className="btn-primary" disabled={saving}>
            {saving ? 'Guardando...' : id ? 'Actualizar Trade' : 'Guardar Trade'}
          </button>
          <button type="button" className="btn-secondary" onClick={() => navigate(-1)}>Cancelar</button>
        </div>
      </form>
    </div>
  )
}
