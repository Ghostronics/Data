import { useState, useEffect, useCallback } from 'react'
import { useDropzone } from 'react-dropzone'
import { api } from '../utils/api'
import ReactMarkdown from 'react-markdown'

export default function PreMarket() {
  const [analyses, setAnalyses] = useState([])
  const [showForm, setShowForm] = useState(false)
  const [selectedAnalysis, setSelectedAnalysis] = useState(null)
  const [loading, setLoading] = useState(false)
  const [form, setForm] = useState({
    symbol: '', date: new Date().toISOString().split('T')[0],
    bias: '', key_levels: '', notes: ''
  })
  const [imageFile, setImageFile] = useState(null)

  useEffect(() => { loadAnalyses() }, [])

  async function loadAnalyses() {
    const data = await api.getPremarketAnalyses()
    setAnalyses(data)
  }

  const onDrop = useCallback(files => {
    if (files.length > 0) setImageFile(files[0])
  }, [])

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop, accept: { 'image/*': ['.png', '.jpg', '.jpeg', '.webp'] }, maxFiles: 1
  })

  async function handleSubmit(e) {
    e.preventDefault()
    setLoading(true)
    try {
      const result = await api.createPremarketAnalysis(form, imageFile)
      setShowForm(false)
      setImageFile(null)
      setForm({ symbol: '', date: new Date().toISOString().split('T')[0], bias: '', key_levels: '', notes: '' })
      await loadAnalyses()
      if (result.ai_analysis) {
        const full = await api.getPremarketAnalysis(result.id)
        setSelectedAnalysis(full)
      }
    } catch (err) {
      alert('Error: ' + err.message)
    } finally {
      setLoading(false)
    }
  }

  async function handleDelete(id) {
    if (!confirm('Eliminar este análisis?')) return
    await api.deletePremarketAnalysis(id)
    if (selectedAnalysis?.id === id) setSelectedAnalysis(null)
    loadAnalyses()
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Pre-Market Analysis</h1>
          <p className="text-gray-400 text-sm mt-1">Sube fotos del pre-market y la IA comparará con escenarios anteriores</p>
        </div>
        <button className="btn-primary" onClick={() => setShowForm(!showForm)}>
          {showForm ? 'Cancelar' : '+ Nuevo Análisis'}
        </button>
      </div>

      {/* Form */}
      {showForm && (
        <form onSubmit={handleSubmit} className="card space-y-4">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div>
              <label className="label">Símbolo *</label>
              <input className="input" required value={form.symbol} onChange={e => setForm(p => ({ ...p, symbol: e.target.value.toUpperCase() }))} placeholder="EURUSD..." />
            </div>
            <div>
              <label className="label">Fecha</label>
              <input type="date" className="input" value={form.date} onChange={e => setForm(p => ({ ...p, date: e.target.value }))} />
            </div>
            <div>
              <label className="label">Bias</label>
              <select className="select w-full" value={form.bias} onChange={e => setForm(p => ({ ...p, bias: e.target.value }))}>
                <option value="">Seleccionar</option>
                <option value="bullish">Alcista</option>
                <option value="bearish">Bajista</option>
                <option value="neutral">Neutral</option>
              </select>
            </div>
          </div>

          <div>
            <label className="label">Niveles Clave</label>
            <input className="input" value={form.key_levels} onChange={e => setForm(p => ({ ...p, key_levels: e.target.value }))} placeholder="e.g., S: 1.0850, R: 1.0920, POI: 1.0880" />
          </div>

          <div>
            <label className="label">Notas</label>
            <textarea className="input min-h-[60px]" value={form.notes} onChange={e => setForm(p => ({ ...p, notes: e.target.value }))} placeholder="Observaciones del pre-market..." />
          </div>

          {/* Image Upload */}
          <div>
            <label className="label">Foto del Pre-Market</label>
            <div {...getRootProps()} className={`border-2 border-dashed rounded-lg p-6 text-center cursor-pointer transition-colors ${isDragActive ? 'border-blue-500 bg-blue-500/10' : 'border-dark-500 hover:border-dark-400'}`}>
              <input {...getInputProps()} />
              {imageFile ? (
                <div className="flex items-center justify-center gap-2">
                  <span className="text-emerald-400">{imageFile.name}</span>
                  <button type="button" className="text-red-400 text-sm" onClick={e => { e.stopPropagation(); setImageFile(null); }}>Quitar</button>
                </div>
              ) : (
                <p className="text-gray-400">Arrastra una imagen del chart o haz clic para seleccionar</p>
              )}
            </div>
          </div>

          <button type="submit" className="btn-primary" disabled={loading}>
            {loading ? 'Analizando con IA...' : 'Crear Análisis Pre-Market'}
          </button>
        </form>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* List */}
        <div className="space-y-3">
          <h2 className="text-lg font-semibold">Análisis Anteriores</h2>
          {analyses.length === 0 ? (
            <p className="text-gray-500">No hay análisis previos</p>
          ) : (
            analyses.map(a => (
              <div key={a.id} className={`card cursor-pointer transition-colors hover:border-blue-600/50 ${selectedAnalysis?.id === a.id ? 'border-blue-600' : ''}`}
                onClick={() => setSelectedAnalysis(a)}>
                <div className="flex items-center justify-between">
                  <div>
                    <span className="font-medium">{a.symbol}</span>
                    <span className="text-sm text-gray-400 ml-2">{a.date}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    {a.bias && <span className={`badge ${a.bias === 'bullish' ? 'badge-green' : a.bias === 'bearish' ? 'badge-red' : 'badge-yellow'}`}>{a.bias}</span>}
                    <button className="text-red-400 text-xs hover:underline" onClick={e => { e.stopPropagation(); handleDelete(a.id); }}>×</button>
                  </div>
                </div>
                {a.image_filename && <img src={`/uploads/${a.image_filename}`} alt="" className="mt-2 rounded-lg w-full h-24 object-cover" />}
              </div>
            ))
          )}
        </div>

        {/* Detail */}
        <div className="lg:col-span-2">
          {selectedAnalysis ? (
            <div className="space-y-4">
              <div className="card">
                <div className="flex items-center gap-3 mb-3">
                  <h2 className="text-xl font-bold">{selectedAnalysis.symbol}</h2>
                  <span className="text-gray-400">{selectedAnalysis.date}</span>
                  {selectedAnalysis.bias && (
                    <span className={`badge ${selectedAnalysis.bias === 'bullish' ? 'badge-green' : selectedAnalysis.bias === 'bearish' ? 'badge-red' : 'badge-yellow'}`}>
                      {selectedAnalysis.bias}
                    </span>
                  )}
                </div>
                {selectedAnalysis.key_levels && <p className="text-sm"><span className="text-gray-400">Niveles:</span> {selectedAnalysis.key_levels}</p>}
                {selectedAnalysis.notes && <p className="text-sm mt-2"><span className="text-gray-400">Notas:</span> {selectedAnalysis.notes}</p>}
              </div>

              {selectedAnalysis.image_filename && (
                <div className="card">
                  <img src={`/uploads/${selectedAnalysis.image_filename}`} alt="" className="rounded-lg w-full" />
                </div>
              )}

              {selectedAnalysis.ai_analysis && (
                <div className="card border-blue-600/30">
                  <h3 className="text-lg font-semibold mb-3 text-blue-400">Análisis IA - Comparación con Escenarios</h3>
                  <div className="prose prose-invert prose-sm max-w-none">
                    <ReactMarkdown>{selectedAnalysis.ai_analysis}</ReactMarkdown>
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className="card text-center py-16 text-gray-500">
              Selecciona un análisis para ver los detalles o crea uno nuevo
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
