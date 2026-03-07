import { useState, useEffect, useCallback } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { useDropzone } from 'react-dropzone'
import { api } from '../utils/api'

const emptyTrade = {
  symbol: '', direction: 'long', status: 'closed',
  entry_date: new Date().toISOString().split('T')[0], exit_date: '',
  entry_price: '', exit_price: '',
  quantity: '', pnl: '',
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
        stop_loss: null,
        take_profit: null,
        quantity: parseFloat(trade.quantity),
        commission: 0,
        swap: 0,
        pnl: trade.pnl ? parseFloat(trade.pnl) : null,
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
    <div className="tf-container">
      <div className="tf-header">
        <h1 className="tf-title">{id ? 'Editar Trade' : 'Nuevo Trade'}</h1>
        <p className="tf-subtitle">Registra tu operación con precisión</p>
      </div>

      <form onSubmit={handleSubmit} className="tf-form">
        {/* Basic Info */}
        <div className="tf-card">
          <h2 className="tf-card-heading">Información Básica</h2>
          <div className="tf-grid-2">
            <div className="tf-field">
              <label className="tf-label">Símbolo *</label>
              <input className="tf-input" required value={trade.symbol} onChange={e => updateField('symbol', e.target.value.toUpperCase())} placeholder="EURUSD, SPY, NQ..." />
            </div>
            <div className="tf-field">
              <label className="tf-label">Dirección *</label>
              <div className="tf-dir-group">
                <button type="button" className={`tf-dir-btn long ${trade.direction === 'long' ? 'active' : ''}`} onClick={() => updateField('direction', 'long')}>
                  <span>▲</span> LONG
                </button>
                <button type="button" className={`tf-dir-btn short ${trade.direction === 'short' ? 'active' : ''}`} onClick={() => updateField('direction', 'short')}>
                  <span>▼</span> SHORT
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Prices & Risk */}
        <div className="tf-card">
          <h2 className="tf-card-heading">Precios y Gestión de Riesgo</h2>
          <div className="tf-grid-2">
            <div className="tf-field">
              <label className="tf-label">Precio de Entrada *</label>
              <input type="number" step="any" className="tf-input" required value={trade.entry_price} onChange={e => updateField('entry_price', e.target.value)} placeholder="0.00" />
            </div>
            <div className="tf-field">
              <label className="tf-label">Precio de Salida</label>
              <input type="number" step="any" className="tf-input" value={trade.exit_price} onChange={e => updateField('exit_price', e.target.value)} placeholder="0.00" />
            </div>
            <div className="tf-field">
              <label className="tf-label">Cantidad / Contratos *</label>
              <input type="number" step="any" className="tf-input" required value={trade.quantity} onChange={e => updateField('quantity', e.target.value)} placeholder="1" />
            </div>
            <div className="tf-field">
              <label className="tf-label">P&L ($)</label>
              <input type="number" step="any" className="tf-input" value={trade.pnl} onChange={e => updateField('pnl', e.target.value)} placeholder="+150.00" />
            </div>
          </div>
          <div className="tf-grid-2" style={{ marginTop: '12px' }}>
            <div className="tf-field">
              <label className="tf-label">Fecha Entrada *</label>
              <input type="date" className="tf-input" required value={trade.entry_date} onChange={e => updateField('entry_date', e.target.value)} />
            </div>
            <div className="tf-field">
              <label className="tf-label">Fecha Salida</label>
              <input type="date" className="tf-input" value={trade.exit_date} onChange={e => updateField('exit_date', e.target.value)} />
            </div>
          </div>
        </div>

        {/* Strategy - collapsible extras */}
        <details className="tf-card tf-details">
          <summary className="tf-card-heading tf-summary">Estrategia y Detalles Adicionales</summary>
          <div className="tf-details-content">
            <div className="tf-grid-2">
              <div className="tf-field">
                <label className="tf-label">Setup</label>
                <input className="tf-input" value={trade.setup} onChange={e => updateField('setup', e.target.value)} placeholder="Break & Retest, FVG..." />
              </div>
              <div className="tf-field">
                <label className="tf-label">Estrategia</label>
                <input className="tf-input" value={trade.strategy} onChange={e => updateField('strategy', e.target.value)} placeholder="ICT, SMC, Price Action..." />
              </div>
            </div>

            <div className="tf-field" style={{ marginTop: '12px' }}>
              <label className="tf-label">Notas</label>
              <textarea className="tf-input tf-textarea" value={trade.notes} onChange={e => updateField('notes', e.target.value)} placeholder="Notas sobre el trade..." />
            </div>

            <div className="tf-field" style={{ marginTop: '12px' }}>
              <label className="tf-label">Tags</label>
              <div className="tf-tags-row">
                {trade.tags.map(tag => (
                  <span key={tag} className="tf-tag" onClick={() => removeTag(tag)}>{tag} ×</span>
                ))}
              </div>
              <div className="tf-tag-input-row">
                <input className="tf-input" value={tagInput} onChange={e => setTagInput(e.target.value)} onKeyDown={e => e.key === 'Enter' && (e.preventDefault(), addTag())} placeholder="Agregar tag..." />
                <button type="button" className="tf-tag-add" onClick={addTag}>+</button>
              </div>
            </div>
          </div>
        </details>

        {/* Images */}
        <details className="tf-card tf-details">
          <summary className="tf-card-heading tf-summary">Screenshots / Charts</summary>
          <div className="tf-details-content">
            {existingImages.length > 0 && (
              <div className="tf-images-grid">
                {existingImages.map(img => (
                  <div key={img.id} className="tf-img-wrap">
                    <img src={`/uploads/${img.filename}`} alt={img.original_name} />
                    <button type="button" className="tf-img-del"
                      onClick={async () => {
                        await api.deleteTradeImage(img.id)
                        setExistingImages(prev => prev.filter(i => i.id !== img.id))
                      }}>×</button>
                  </div>
                ))}
              </div>
            )}

            <div {...getRootProps()} className={`tf-dropzone ${isDragActive ? 'active' : ''}`}>
              <input {...getInputProps()} />
              {isDragActive ? (
                <p className="tf-drop-text active">Suelta las imágenes aquí...</p>
              ) : (
                <div className="tf-drop-text">
                  <p>Arrastra imágenes o toca para seleccionar</p>
                  <span>PNG, JPG, WEBP (max 10MB)</span>
                </div>
              )}
            </div>

            {files.length > 0 && (
              <div className="tf-file-list">
                {files.map((file, i) => (
                  <div key={i} className="tf-file-row">
                    <span>{file.name}</span>
                    <button type="button" onClick={() => setFiles(prev => prev.filter((_, j) => j !== i))}>Quitar</button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </details>

        {/* Submit */}
        <div className="tf-actions">
          <button type="submit" className="tf-submit" disabled={saving}>
            {saving ? 'Guardando...' : id ? 'Actualizar Trade' : 'Guardar Trade'}
          </button>
          <button type="button" className="tf-cancel" onClick={() => navigate(-1)}>Cancelar</button>
        </div>
      </form>
    </div>
  )
}
