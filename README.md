# Trading Journal AI

Trading journal con análisis de IA, similar a Tradezella. Registra, analiza y mejora tu trading con inteligencia artificial.

## Features

- **Journal de Trading Completo**: Registra todos los detalles de tus trades (entrada, salida, SL, TP, R:R, setup, estrategia, emociones, etc.)
- **Dashboard con Métricas**: Win rate, profit factor, equity curve, P&L por día/sesión/estrategia/símbolo, análisis emocional, drawdown
- **Upload de Screenshots**: Sube fotos de tus charts (entrada, salida, setup)
- **AI Trade Analysis**: La IA analiza cada trade individual y te da feedback detallado
- **AI Journal Analysis**: Análisis completo de tu journal con patrones, fortalezas y plan de mejora
- **Pre-Market AI**: Sube fotos del pre-market y la IA las compara con escenarios anteriores de tu journal
- **AI Coach Chat**: Chat con un coach de trading que conoce todo tu historial
- **Diario Diario**: Plan pre-market, review post-market, mood tracking

## Tech Stack

- **Frontend**: React + Vite + TailwindCSS + Recharts
- **Backend**: Node.js + Express
- **Database**: SQLite (better-sqlite3)
- **AI**: Claude API (Anthropic)

## Setup

```bash
# Install dependencies
npm run setup

# Configure API key
cp .env.example .env
# Edit .env and add your ANTHROPIC_API_KEY

# Run development server
npm run dev
```

The app will be available at `http://localhost:5173`

## API Endpoints

- `GET/POST /api/trades` - CRUD de trades
- `POST /api/trades/:id/images` - Upload de imágenes
- `GET /api/dashboard/stats` - Métricas del dashboard
- `POST /api/ai/analyze-trade/:id` - Análisis IA de un trade
- `POST /api/ai/analyze-journal` - Análisis IA del journal completo
- `POST /api/ai/chat` - Chat con AI coach
- `GET/POST /api/premarket` - Análisis pre-market con comparación IA
- `GET/POST /api/daily-notes` - Notas diarias
