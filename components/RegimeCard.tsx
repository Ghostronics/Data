import type { GexRegime, DayBias } from "@/lib/types";
import clsx from "clsx";
import { TrendingUp, TrendingDown, Minus, AlertTriangle } from "lucide-react";

const REGIME_META: Record<
  GexRegime,
  { label: string; description: string; color: string; bg: string; border: string; icon: React.ReactNode }
> = {
  "GEX-/DEX-": {
    label: "Bajista Fuerte",
    description: "Dealers cortos en gamma + vendiendo futuros. Caídas amplificadas.",
    color: "text-gex-negative",
    bg: "regime-bajista",
    border: "border-gex-negative/30",
    icon: <TrendingDown size={20} className="text-gex-negative" />,
  },
  "GEX-/DEX+": {
    label: "Rally Expansivo",
    description: "Gamma negativo + dealers comprando. Riesgo de subasta fallida en resistencia.",
    color: "text-accent-orange",
    bg: "regime-neutro",
    border: "border-accent-orange/30",
    icon: <TrendingUp size={20} className="text-accent-orange" />,
  },
  "GEX+/DEX-": {
    label: "Caída Frenada",
    description: "GEX positivo amortigua. LONG en Put Support con absorción → target HVL.",
    color: "text-accent-blue",
    bg: "regime-neutro",
    border: "border-accent-blue/30",
    icon: <TrendingDown size={20} className="text-accent-blue" />,
  },
  "GEX+/DEX+": {
    label: "Compresión Alcista",
    description: "Dealers largos + comprando futuros. Chop tranquilo. Muy selectivo.",
    color: "text-gex-positive",
    bg: "regime-alcista",
    border: "border-gex-positive/30",
    icon: <TrendingUp size={20} className="text-gex-positive" />,
  },
  NEUTRO: {
    label: "Señal Mixta",
    description: "GEX neutro. Señales poco claras. Reducir tamaño o saltar el día.",
    color: "text-gex-neutral",
    bg: "regime-neutro",
    border: "border-gex-neutral/30",
    icon: <Minus size={20} className="text-gex-neutral" />,
  },
};

const BIAS_META: Record<
  DayBias,
  { color: string; label: string }
> = {
  ALCISTA: { color: "text-gex-positive", label: "Alcista" },
  BAJISTA: { color: "text-gex-negative", label: "Bajista" },
  NEUTRO: { color: "text-gex-neutral", label: "Neutro" },
  SALTAR: { color: "text-text-muted", label: "No Operar" },
};

interface RegimeCardProps {
  regime: GexRegime | null;
  dayBias: DayBias | null;
  recommendedInstrument: "MNQ" | "MES" | null;
  skipDay: boolean;
}

export default function RegimeCard({
  regime,
  dayBias,
  recommendedInstrument,
  skipDay,
}: RegimeCardProps) {
  if (!regime) {
    return (
      <div className="trading-card p-5 flex items-center justify-center gap-3">
        <Minus size={16} className="text-text-muted" />
        <span className="text-text-muted text-sm">Sin datos de régimen</span>
      </div>
    );
  }

  const meta = REGIME_META[regime];
  const biasMeta = dayBias ? BIAS_META[dayBias] : null;

  return (
    <div className={clsx("trading-card p-5 border", meta.bg, meta.border)}>
      <div className="flex items-start justify-between gap-4">
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-1">
            {meta.icon}
            <span className={clsx("font-bold text-lg", meta.color)}>{meta.label}</span>
            {skipDay && (
              <span className="flex items-center gap-1 text-xs bg-text-muted/10 text-text-muted px-2 py-0.5 rounded-full">
                <AlertTriangle size={10} />
                Saltar día
              </span>
            )}
          </div>
          <p className="text-text-secondary text-sm leading-relaxed">{meta.description}</p>
        </div>

        <div className="text-right shrink-0">
          <div className="mono text-base font-semibold text-text-primary mb-1">{regime}</div>
          {biasMeta && (
            <div className={clsx("text-xs font-medium", biasMeta.color)}>
              Sesgo: {biasMeta.label}
            </div>
          )}
          {recommendedInstrument && !skipDay && (
            <div className="text-xs text-text-secondary mt-1">
              Instr. recom:{" "}
              <span className="text-accent-blue font-medium">{recommendedInstrument}</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
