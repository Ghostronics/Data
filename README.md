# GG Order Flow — Dashboard Institucional

Dashboard web profesional de Order Flow para el Gamma Trading System de Anthony (GG).
Dark theme inspirado en MenthorQ/SpotGamma.

**Stack:** Next.js 14 · Tailwind CSS · Supabase · Claude Opus 4.6 · Vercel

---

## Qué hace

- **Tú subes** las capturas de MenthorQ (NQ, ES, VIX GEX) desde `/admin`
- **Claude** extrae automáticamente todos los niveles gamma y genera el análisis completo
- El **dashboard** se actualiza con charts propios: gauge GEX/DEX, mapa de niveles, régimen, setups A/B
- **Historial** completo de sesiones anteriores accesible desde cualquier dispositivo

---

## Setup rápido (15 min)

### 1. Supabase (base de datos + imágenes)

1. Ve a [supabase.com](https://supabase.com) → New project → crea uno gratis
2. En el proyecto: **SQL Editor** → pega el contenido de `supabase/schema.sql` → Run
3. Ve a **Settings → API** y copia:
   - `Project URL`
   - `anon public` key
   - `service_role` key (secret)

### 2. Anthropic (Claude)

1. Ve a [console.anthropic.com](https://console.anthropic.com) → API Keys → Create key

### 3. Variables de entorno

```bash
cp .env.example .env.local
# Edita .env.local con tus claves
```

```env
ANTHROPIC_API_KEY=sk-ant-...
NEXT_PUBLIC_SUPABASE_URL=https://xxxxxxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJ...
SUPABASE_SERVICE_ROLE_KEY=eyJ...
ADMIN_PASSWORD=tu_password_segura
```

### 4. Instalar y correr local

```bash
npm install
npm run dev
# Abre http://localhost:3000
```

---

## Deploy en Vercel (gratis, acceso desde móvil y PC)

1. Sube el repo a GitHub (ghostronics/data)
2. Ve a [vercel.com](https://vercel.com) → New Project → importa el repo
3. En **Environment Variables** añade las 5 variables del `.env.local`
4. Deploy → Vercel te da una URL pública tipo `gg-orderflow.vercel.app`

---

## Uso diario

### Como admin (GG)

1. Abre `/admin` en el browser
2. Ingresa la contraseña
3. Escribe VVIX y SKEW (de TradingView)
4. Sube las capturas de MenthorQ (NQ GEX, ES GEX, VIX GEX — hasta 6 imágenes)
5. Clic en **"Generar Análisis del Día"**
6. Claude analiza las imágenes (~20-30 seg) y el dashboard se actualiza

### Como usuario

- `/` — Dashboard de hoy con todos los charts y el análisis
- `/history` — Lista de todas las sesiones anteriores
- `/day/2025-03-26` — Sesión específica por fecha

---

## Estructura

```
app/
├── page.tsx                  # Dashboard de hoy
├── admin/page.tsx            # Panel de subida (protegido)
├── history/page.tsx          # Historial
├── day/[date]/page.tsx       # Día específico
└── api/
    ├── upload/route.ts       # POST: analizar y guardar sesión
    └── sessions/
        ├── route.ts          # GET: lista de sesiones
        └── [date]/route.ts   # GET: sesión por fecha

components/
├── NavBar.tsx
├── SessionDashboard.tsx      # Layout completo del dashboard
├── GexGauge.tsx              # Gauge semicircular GEX/DEX
├── LevelMap.tsx              # Mapa visual de niveles (SVG)
├── RegimeCard.tsx            # Régimen GEX+DEX con colores
├── InstrumentCard.tsx        # Tabla de niveles NQ/ES
├── SetupCard.tsx             # Setup A/B con entrada/stop/target
├── VixSection.tsx            # VIX GEX estructura
├── FiltersBar.tsx            # Metros VVIX y SKEW
└── AnalysisCard.tsx          # Análisis de texto completo

lib/
├── types.ts                  # TypeScript types
├── supabase.ts               # Clientes Supabase
└── claude.ts                 # Claude API + prompt de extracción

supabase/
└── schema.sql                # SQL para crear la tabla y bucket
```

---

## Costos estimados (uso diario)

| Servicio | Plan | Costo |
|---|---|---|
| Vercel | Hobby (free) | $0 |
| Supabase | Free tier | $0 |
| Anthropic (Claude) | Pay-per-use | ~$0.05–0.10/sesión |

**Total: ~$1-2/mes** en uso real (1 análisis diario × 5 días/semana).
