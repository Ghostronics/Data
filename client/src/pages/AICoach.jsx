import { useState } from 'react'
import { api } from '../utils/api'
import ReactMarkdown from 'react-markdown'

export default function AICoach() {
  const [messages, setMessages] = useState([])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const [journalAnalysis, setJournalAnalysis] = useState(null)
  const [analyzingJournal, setAnalyzingJournal] = useState(false)
  const [dateRange, setDateRange] = useState({ from: '', to: '' })

  async function sendMessage(e) {
    e.preventDefault()
    if (!input.trim() || loading) return

    const userMsg = { role: 'user', content: input }
    setMessages(prev => [...prev, userMsg])
    setInput('')
    setLoading(true)

    try {
      const result = await api.aiChat(input)
      setMessages(prev => [...prev, { role: 'assistant', content: result.response }])
    } catch (err) {
      setMessages(prev => [...prev, { role: 'assistant', content: `Error: ${err.message}. Asegúrate de configurar tu ANTHROPIC_API_KEY en el archivo .env` }])
    } finally {
      setLoading(false)
    }
  }

  async function analyzeJournal() {
    setAnalyzingJournal(true)
    try {
      const result = await api.analyzeJournal(dateRange)
      setJournalAnalysis(result.analysis)
    } catch (err) {
      alert('Error: ' + err.message)
    } finally {
      setAnalyzingJournal(false)
    }
  }

  const suggestedQuestions = [
    'Cuáles son mis errores más comunes?',
    'Qué estrategia me está dando mejores resultados?',
    'En qué sesión debería enfocarme?',
    'Cómo puedo mejorar mi gestión de riesgo?',
    'Qué patrones emocionales afectan mi trading?',
    'Dame un plan de mejora para esta semana'
  ]

  return (
    <div className="space-y-6 max-w-4xl">
      <div>
        <h1 className="text-2xl font-bold">AI Trading Coach</h1>
        <p className="text-gray-400 text-sm mt-1">Tu asistente de IA analiza tu journal y te da consejos personalizados</p>
      </div>

      {/* Journal Analysis Section */}
      <div className="card">
        <h2 className="text-lg font-semibold mb-3">Análisis Completo del Journal</h2>
        <p className="text-sm text-gray-400 mb-4">La IA analizará todos tus trades y te dará un reporte completo con recomendaciones</p>
        <div className="flex gap-3 items-end flex-wrap">
          <div>
            <label className="label">Desde</label>
            <input type="date" className="input w-auto" value={dateRange.from} onChange={e => setDateRange(p => ({ ...p, from: e.target.value }))} />
          </div>
          <div>
            <label className="label">Hasta</label>
            <input type="date" className="input w-auto" value={dateRange.to} onChange={e => setDateRange(p => ({ ...p, to: e.target.value }))} />
          </div>
          <button className="btn-primary" onClick={analyzeJournal} disabled={analyzingJournal}>
            {analyzingJournal ? 'Analizando journal...' : 'Analizar Mi Journal'}
          </button>
        </div>

        {journalAnalysis && (
          <div className="mt-6 border-t border-dark-600 pt-6">
            <div className="prose prose-invert prose-sm max-w-none">
              <ReactMarkdown>{journalAnalysis}</ReactMarkdown>
            </div>
          </div>
        )}
      </div>

      {/* Chat Section */}
      <div className="card">
        <h2 className="text-lg font-semibold mb-3">Chat con tu Coach de Trading</h2>

        {/* Suggested Questions */}
        {messages.length === 0 && (
          <div className="mb-4">
            <p className="text-sm text-gray-400 mb-2">Preguntas sugeridas:</p>
            <div className="flex flex-wrap gap-2">
              {suggestedQuestions.map(q => (
                <button key={q} className="text-sm bg-dark-700 hover:bg-dark-600 text-gray-300 px-3 py-1.5 rounded-full transition-colors"
                  onClick={() => { setInput(q) }}>
                  {q}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Messages */}
        <div className="space-y-4 max-h-[500px] overflow-y-auto mb-4">
          {messages.map((msg, i) => (
            <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
              <div className={`max-w-[80%] rounded-lg px-4 py-3 ${msg.role === 'user' ? 'bg-blue-600/30 text-blue-100' : 'bg-dark-700'}`}>
                {msg.role === 'assistant' ? (
                  <div className="prose prose-invert prose-sm max-w-none">
                    <ReactMarkdown>{msg.content}</ReactMarkdown>
                  </div>
                ) : (
                  <p className="text-sm">{msg.content}</p>
                )}
              </div>
            </div>
          ))}
          {loading && (
            <div className="flex justify-start">
              <div className="bg-dark-700 rounded-lg px-4 py-3 text-gray-400">
                Pensando...
              </div>
            </div>
          )}
        </div>

        {/* Input */}
        <form onSubmit={sendMessage} className="flex gap-3">
          <input className="input flex-1" value={input} onChange={e => setInput(e.target.value)}
            placeholder="Pregunta sobre tu trading..." disabled={loading} />
          <button type="submit" className="btn-primary" disabled={loading || !input.trim()}>Enviar</button>
        </form>
      </div>
    </div>
  )
}
