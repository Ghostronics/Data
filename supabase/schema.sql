-- GG Order Flow — Supabase Schema
-- Ejecutar en: Supabase Dashboard → SQL Editor

-- Tabla principal de sesiones
CREATE TABLE IF NOT EXISTS trading_sessions (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  date date NOT NULL UNIQUE,

  -- NQ / MNQ
  nq_gex numeric,
  nq_dex numeric,
  nq_hvl_all numeric,
  nq_hvl_0dte numeric,
  nq_call_resist numeric,
  nq_put_support numeric,

  -- ES / MES
  es_gex numeric,
  es_dex numeric,
  es_hvl_all numeric,
  es_hvl_0dte numeric,
  es_call_resist numeric,
  es_put_support numeric,

  -- VIX GEX
  vix_gex_net numeric,
  vix_call_resist numeric,
  vix_hvl numeric,

  -- Volatility filters (from TradingView)
  vvix numeric,
  skew numeric,

  -- Analysis output
  regime text CHECK (regime IN ('GEX-/DEX-', 'GEX-/DEX+', 'GEX+/DEX-', 'GEX+/DEX+', 'NEUTRO')),
  day_bias text CHECK (day_bias IN ('ALCISTA', 'BAJISTA', 'NEUTRO', 'SALTAR')),
  recommended_instrument text CHECK (recommended_instrument IN ('MNQ', 'MES')),
  analysis_text text,
  setup_a jsonb,
  setup_b jsonb,

  -- Meta
  image_urls text[] DEFAULT '{}',
  skip_day boolean DEFAULT false,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Index for fast date lookups
CREATE INDEX IF NOT EXISTS idx_trading_sessions_date ON trading_sessions (date DESC);

-- Row Level Security: public read, no write without service role
ALTER TABLE trading_sessions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public read" ON trading_sessions
  FOR SELECT USING (true);

-- Storage bucket for session images
INSERT INTO storage.buckets (id, name, public)
VALUES ('session-images', 'session-images', true)
ON CONFLICT (id) DO NOTHING;

CREATE POLICY "Public read images" ON storage.objects
  FOR SELECT USING (bucket_id = 'session-images');

CREATE POLICY "Service role upload" ON storage.objects
  FOR INSERT WITH CHECK (bucket_id = 'session-images');

CREATE POLICY "Service role update" ON storage.objects
  FOR UPDATE USING (bucket_id = 'session-images');
