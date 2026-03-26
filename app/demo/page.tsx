import SessionDashboard from "@/components/SessionDashboard";
import type { TradingSession } from "@/lib/types";

const DEMO_SESSION: TradingSession = {
  id: "demo-001",
  date: new Date().toISOString().slice(0, 10),
  nq_gex: -2.3,
  nq_dex: -1.1,
  nq_hvl_all: 21280,
  nq_hvl_0dte: 21310,
  nq_call_resist: 21500,
  nq_put_support: 20900,
  es_gex: -1.8,
  es_dex: -0.9,
  es_hvl_all: 5890,
  es_hvl_0dte: 5895,
  es_call_resist: 5960,
  es_put_support: 5820,
  vix_gex_net: 1.2,
  vix_call_resist: 22.5,
  vix_hvl: 19.8,
  vvix: 112,
  skew: 141,
  regime: "GEX-/DEX-",
  day_bias: "BAJISTA",
  recommended_instrument: "MNQ",
  skip_day: false,
  analysis_text: `RÉGIMEN: GEX— / DEX— — BAJISTA FUERTE
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

NQ: GEX negativo (-2.3M) con DEX negativo (-1.1M). Dealers cortos en gamma y vendiendo futuros activamente. Sesgo bajista de alta convicción. Precio bajo HVL amplifica caídas. Cada rebote hacia HVL 21,280-21,310 es una oportunidad de SHORT si el order flow confirma.

ES: Confluencia de régimen con NQ. GEX -1.8M / DEX -0.9M. Mismo sesgo bajista. HVL 5890-5895 en confluencia fuerte (5 puntos). Nivel muy relevante.

VIX GEX: Positivo (+1.2M) → techo estructural de volatilidad presente. Calls masivos en strikes 22-23 actúan como piso estructural para NQ. VIX bajo su Call Resistance (22.5) → sin señal de pánico extremo.

FILTROS:
• VVIX 112 → parámetros estándar.
• SKEW 141 → neutro-bajista. Sin señal contraria extrema.

PLAN: SHORT en rebotes hacia HVL con confirmación de BigTrades rojos + CVD negativo. No LONG hasta que GEX o DEX gire positivo.`,
  setup_a: {
    direction: "SHORT",
    instrument: "MNQ",
    entry_zone: "21,280-21,320",
    stop: "21,380",
    target: "20,950",
    rr: "3.3:1",
    conditions: [
      "3+ BigTrades rojos en 60 seg (filtro 40 contratos)",
      "CVD negativo o girando negativo",
      "Rechazo en HVL 0DTE / All Exp",
      "Dentro ventana 9:35-11:30 AM ET",
    ],
    invalidation: "Cierre de vela por encima de 21,380 con volumen",
    notes: "Fade hacia HVL. Si precio está EN el HVL esperar 15-30 min de consolidación.",
  },
  setup_b: {
    direction: "SHORT",
    instrument: "MNQ",
    entry_zone: "21,460-21,500",
    stop: "21,560",
    target: "21,280",
    rr: "2.0:1",
    conditions: [
      "Rally hacia Call Resistance 21,500",
      "BigTrades rojos en Call Resistance",
      "CVD gira negativo en resistencia",
      "VIX no rompe 22.5 (Call Resistance VIX)",
    ],
    invalidation: "Cierre por encima de Call Resistance 21,500 con volumen sostenido",
    notes: "Subasta fallida en Call Resistance. Mayor R:R si hay absorción clara.",
  },
  image_urls: [],
  created_at: new Date().toISOString(),
  updated_at: new Date().toISOString(),
};

export default function DemoPage() {
  return (
    <div>
      <div className="mb-4 px-3 py-2 bg-accent-blue/5 border border-accent-blue/20 rounded-lg text-xs text-accent-blue">
        ⚡ Modo demo — datos de ejemplo para previsualizar el dashboard
      </div>
      <SessionDashboard session={DEMO_SESSION} />
    </div>
  );
}
