import { useState, useRef } from 'react'
import { api } from '../utils/api'

export default function Backup() {
  const [status, setStatus] = useState(null)
  const [loading, setLoading] = useState(false)
  const fileRef = useRef()

  async function handleExport() {
    setLoading(true)
    setStatus(null)
    try {
      const data = await api.exportBackup()
      const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' })
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `trading-journal-backup-${new Date().toISOString().split('T')[0]}.json`
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      URL.revokeObjectURL(url)

      const c = data.data
      setStatus({
        type: 'success',
        msg: `Backup exportado: ${c.trades?.length || 0} trades, ${c.daily_notes?.length || 0} notas, ${c.accounts?.length || 0} cuentas`
      })
    } catch (err) {
      setStatus({ type: 'error', msg: 'Error al exportar: ' + err.message })
    } finally {
      setLoading(false)
    }
  }

  async function handleImport(e) {
    const file = e.target.files?.[0]
    if (!file) return

    setLoading(true)
    setStatus(null)
    try {
      const text = await file.text()
      const data = JSON.parse(text)

      if (!data.data) {
        setStatus({ type: 'error', msg: 'Archivo de backup inválido' })
        return
      }

      const result = await api.restoreBackup(data)
      setStatus({
        type: 'success',
        msg: `Restaurado: ${result.counts.trades} trades, ${result.counts.daily_notes} notas, ${result.counts.accounts} cuentas`
      })
    } catch (err) {
      setStatus({ type: 'error', msg: 'Error al restaurar: ' + err.message })
    } finally {
      setLoading(false)
      if (fileRef.current) fileRef.current.value = ''
    }
  }

  return (
    <div className="backup-page">
      <div className="backup-header">
        <h1 className="backup-title">Backup & Restauración</h1>
        <p className="backup-subtitle">Protege tus datos antes de cada actualización</p>
      </div>

      {/* Export */}
      <div className="backup-card">
        <div className="backup-card-icon export">
          <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/>
          </svg>
        </div>
        <div className="backup-card-content">
          <h2>Exportar Backup</h2>
          <p>Descarga un archivo JSON con todos tus trades, notas diarias, análisis pre-market y configuraciones. Guárdalo en un lugar seguro.</p>
          <button className="backup-btn export" onClick={handleExport} disabled={loading}>
            {loading ? 'Exportando...' : 'Descargar Backup'}
          </button>
        </div>
      </div>

      {/* Import */}
      <div className="backup-card">
        <div className="backup-card-icon import">
          <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/>
          </svg>
        </div>
        <div className="backup-card-content">
          <h2>Restaurar Backup</h2>
          <p>Sube un archivo de backup previo para restaurar todos tus datos. Los datos existentes con el mismo ID se actualizarán, los nuevos se agregarán.</p>
          <label className="backup-btn import">
            {loading ? 'Restaurando...' : 'Subir Archivo de Backup'}
            <input type="file" accept=".json" onChange={handleImport} ref={fileRef} hidden disabled={loading} />
          </label>
        </div>
      </div>

      {/* Status */}
      {status && (
        <div className={`backup-status ${status.type}`}>
          {status.type === 'success' ? (
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M20 6L9 17l-5-5"/></svg>
          ) : (
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"/><line x1="15" y1="9" x2="9" y2="15"/><line x1="9" y1="9" x2="15" y2="15"/></svg>
          )}
          <span>{status.msg}</span>
        </div>
      )}

      {/* Info */}
      <div className="backup-info">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"/><line x1="12" y1="16" x2="12" y2="12"/><line x1="12" y1="8" x2="12.01" y2="8"/></svg>
        <p>Recomendación: Exporta un backup antes de cada actualización del sistema para proteger tus datos.</p>
      </div>
    </div>
  )
}
