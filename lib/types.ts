export type GexRegime =
  | "GEX-/DEX-"
  | "GEX-/DEX+"
  | "GEX+/DEX-"
  | "GEX+/DEX+"
  | "NEUTRO";

export type DayBias = "ALCISTA" | "BAJISTA" | "NEUTRO" | "SALTAR";

export interface SetupPlan {
  direction: "LONG" | "SHORT";
  instrument: "MNQ" | "MES";
  entry_zone: string;
  stop: string;
  target: string;
  rr: string;
  conditions: string[];
  invalidation: string;
  notes?: string;
}

export interface TradingSession {
  id: string;
  date: string; // ISO date "2025-03-26"

  // NQ Data
  nq_gex: number | null;
  nq_dex: number | null;
  nq_hvl_all: number | null;
  nq_hvl_0dte: number | null;
  nq_call_resist: number | null;
  nq_put_support: number | null;

  // ES Data
  es_gex: number | null;
  es_dex: number | null;
  es_hvl_all: number | null;
  es_hvl_0dte: number | null;
  es_call_resist: number | null;
  es_put_support: number | null;

  // VIX
  vix_gex_net: number | null;
  vix_call_resist: number | null;
  vix_hvl: number | null;

  // Volatility filters
  vvix: number | null;
  skew: number | null;

  // Analysis
  regime: GexRegime | null;
  day_bias: DayBias | null;
  recommended_instrument: "MNQ" | "MES" | null;
  analysis_text: string | null;
  setup_a: SetupPlan | null;
  setup_b: SetupPlan | null;

  // Images
  image_urls: string[];

  skip_day: boolean;
  created_at: string;
  updated_at: string;
}

export interface UploadPayload {
  date: string;
  vvix: number;
  skew: number;
  images: string[]; // base64 strings
  manual?: boolean; // skip Claude analysis, use overrides directly
  overrides?: Partial<ExtractedLevels>;
}

export interface ExtractedLevels {
  nq_gex?: number;
  nq_dex?: number;
  nq_hvl_all?: number;
  nq_hvl_0dte?: number;
  nq_call_resist?: number;
  nq_put_support?: number;
  es_gex?: number;
  es_dex?: number;
  es_hvl_all?: number;
  es_hvl_0dte?: number;
  es_call_resist?: number;
  es_put_support?: number;
  vix_gex_net?: number;
  vix_call_resist?: number;
  vix_hvl?: number;
  regime?: GexRegime;
  day_bias?: DayBias;
  recommended_instrument?: "MNQ" | "MES";
  skip_day?: boolean;
  setup_a?: SetupPlan;
  setup_b?: SetupPlan;
  analysis_text?: string;
}
