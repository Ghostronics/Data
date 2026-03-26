import Anthropic from "@anthropic-ai/sdk";
import type { ExtractedLevels } from "./types";

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

const SYSTEM_PROMPT = `Eres un agente experto en trading institucional especializado en el
Gamma Trading System de Anthony (GG). Tienes conocimiento profundo de
mecánica de opciones, gamma exposure, order flow y futuros de índices.

MECÁNICA GAMMA:
▸ GEX POSITIVO (+0.5M o más): Dealers LARGOS en gamma → flujo CONTRACÍCLICO. HVL actúa como IMÁN.
▸ GEX NEGATIVO (-0.5M o menos): Dealers CORTOS en gamma → flujo PROCÍCLICO. HVL actúa como CATAPULTA.
▸ GEX NEUTRO (-0.5M a +0.5M): Señales mixtas → reducir tamaño o saltar el día.

COMBINACIONES GEX+DEX:
GEX— / DEX— → Bajista fuerte. Caídas amplificadas. SHORT en rebotes hacia niveles gamma.
GEX— / DEX+ → Rally activo en régimen expansivo. Riesgo de subasta fallida en resistencia.
GEX+ / DEX— → Caída frenada por GEX positivo. LONG en Put Support con absorción → target HVL.
GEX+ / DEX+ → Compresión alcista. Chop. Saltar el día o muy selectivo.

NIVELES: HVL All Exp, HVL 0DTE, Call Resistance, Put Support.
Confluencia HVL All Exp + HVL 0DTE < 30 pts = zona muy fuerte.

VIX GEX: positivo dominante → techo estructural volatilidad. VIX sobre Call Resistance → ampliar stops.

FILTROS:
VVIX < 100 → reducir targets 20%. VVIX 100-120 → estándar. VVIX > 120 → stops +20% targets +30%. VVIX > 140 → saltar.
SKEW < 130 → sesgo alcista. SKEW 130-145 → neutro. SKEW > 145 → bajista institucional. SKEW > 155 → posible suelo.

Challenge: Lucid Trading — riesgo $100/trade, máx 2 trades/día, máx -$200 diario.
Instrumentos: MNQ (NQ) y MES (ES).
Ventana: 9:35–11:30 AM ET.`;

const EXTRACTION_SCHEMA = `
Responde ÚNICAMENTE con un objeto JSON válido con esta estructura exacta (sin markdown, sin texto extra):
{
  "nq_gex": number_or_null,
  "nq_dex": number_or_null,
  "nq_hvl_all": number_or_null,
  "nq_hvl_0dte": number_or_null,
  "nq_call_resist": number_or_null,
  "nq_put_support": number_or_null,
  "es_gex": number_or_null,
  "es_dex": number_or_null,
  "es_hvl_all": number_or_null,
  "es_hvl_0dte": number_or_null,
  "es_call_resist": number_or_null,
  "es_put_support": number_or_null,
  "vix_gex_net": number_or_null,
  "vix_call_resist": number_or_null,
  "vix_hvl": number_or_null,
  "regime": "GEX-/DEX-" | "GEX-/DEX+" | "GEX+/DEX-" | "GEX+/DEX+" | "NEUTRO",
  "day_bias": "ALCISTA" | "BAJISTA" | "NEUTRO" | "SALTAR",
  "recommended_instrument": "MNQ" | "MES",
  "skip_day": boolean,
  "setup_a": {
    "direction": "LONG" | "SHORT",
    "instrument": "MNQ" | "MES",
    "entry_zone": "string",
    "stop": "string",
    "target": "string",
    "rr": "string",
    "conditions": ["string"],
    "invalidation": "string",
    "notes": "string"
  },
  "setup_b": {
    "direction": "LONG" | "SHORT",
    "instrument": "MNQ" | "MES",
    "entry_zone": "string",
    "stop": "string",
    "target": "string",
    "rr": "string",
    "conditions": ["string"],
    "invalidation": "string",
    "notes": "string"
  },
  "analysis_text": "string con el análisis completo en español"
}

Para los valores GEX/DEX usa millones (ej: 2.3 para 2.3M, -1.5 para -1.5M).
Para los niveles de precio usa el valor numérico (ej: 21340 para NQ 21,340).
El analysis_text debe tener el análisis completo del día en formato de texto con secciones: régimen, niveles NQ, niveles ES, VIX GEX, filtros volatilidad, plan del día.`;

export async function analyzeSessionImages(
  images: string[], // base64 strings
  vvix: number,
  skew: number,
  date: string
): Promise<ExtractedLevels> {
  const imageContent: Anthropic.ImageBlockParam[] = images.map((img) => ({
    type: "image",
    source: {
      type: "base64",
      media_type: "image/jpeg",
      data: img,
    },
  }));

  const response = await client.messages.create({
    model: "claude-opus-4-6",
    max_tokens: 4096,
    system: SYSTEM_PROMPT,
    messages: [
      {
        role: "user",
        content: [
          ...imageContent,
          {
            type: "text",
            text: `Analiza estas capturas de MenthorQ para la sesión del ${date}.
VVIX actual: ${vvix} | SKEW actual: ${skew}

Extrae todos los niveles visibles en las imágenes (NQ, ES, VIX GEX) y genera el análisis completo del día según el Gamma Trading System GG.
${EXTRACTION_SCHEMA}`,
          },
        ],
      },
    ],
  });

  const text = response.content
    .filter((b) => b.type === "text")
    .map((b) => (b as Anthropic.TextBlock).text)
    .join("");

  // Extract JSON from response (handle potential markdown wrapping)
  const jsonMatch = text.match(/\{[\s\S]*\}/);
  if (!jsonMatch) {
    throw new Error("Claude no devolvió JSON válido");
  }

  const extracted = JSON.parse(jsonMatch[0]) as ExtractedLevels;
  return extracted;
}
