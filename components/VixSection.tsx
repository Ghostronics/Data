import clsx from "clsx";

interface VixSectionProps {
  vixGexNet: number | null;
  vixCallResist: number | null;
  vixHvl: number | null;
}

export default function VixSection({
  vixGexNet,
  vixCallResist,
  vixHvl,
}: VixSectionProps) {
  const isPositive = vixGexNet !== null && vixGexNet > 0;
  const isNegative = vixGexNet !== null && vixGexNet < 0;

  const signal =
    isPositive
      ? { label: "Techo estructural de volatilidad", color: "text-gex-positive", detail: "Calls masivos VIX → piso NQ" }
      : isNegative
      ? { label: "Piso de volatilidad poco definido", color: "text-gex-negative", detail: "Riesgo de spike VIX" }
      : { label: "Sin datos VIX GEX", color: "text-text-muted", detail: "" };

  return (
    <div className="trading-card p-4">
      <div className="text-xs text-text-secondary uppercase tracking-widest mb-3">
        VIX GEX — Estructura de Volatilidad
      </div>

      <div className="grid grid-cols-3 gap-3 mb-4">
        <div className="bg-bg-secondary rounded-lg p-3 text-center">
          <div className="text-xs text-text-muted mb-1">Net GEX VIX</div>
          <div
            className={clsx(
              "mono text-sm font-bold",
              isPositive ? "text-gex-positive" : isNegative ? "text-gex-negative" : "text-text-muted"
            )}
          >
            {vixGexNet !== null ? `${vixGexNet > 0 ? "+" : ""}${vixGexNet.toFixed(2)}M` : "—"}
          </div>
        </div>
        <div className="bg-bg-secondary rounded-lg p-3 text-center">
          <div className="text-xs text-text-muted mb-1">Call Resist VIX</div>
          <div className="mono text-sm font-semibold text-gex-negative">
            {vixCallResist !== null ? vixCallResist.toFixed(1) : "—"}
          </div>
        </div>
        <div className="bg-bg-secondary rounded-lg p-3 text-center">
          <div className="text-xs text-text-muted mb-1">HVL VIX</div>
          <div className="mono text-sm font-semibold text-gex-neutral">
            {vixHvl !== null ? vixHvl.toFixed(1) : "—"}
          </div>
        </div>
      </div>

      {vixGexNet !== null && (
        <div
          className={clsx(
            "rounded-lg p-3 border text-sm",
            isPositive
              ? "bg-gex-positive/5 border-gex-positive/20"
              : "bg-gex-negative/5 border-gex-negative/20"
          )}
        >
          <span className={clsx("font-medium", signal.color)}>{signal.label}</span>
          {signal.detail && (
            <span className="text-text-secondary text-xs ml-2">{signal.detail}</span>
          )}
        </div>
      )}

      {vixCallResist !== null && (
        <p className="text-xs text-text-muted mt-2">
          ⚠️ Si VIX cruza{" "}
          <span className="mono text-gex-negative">{vixCallResist.toFixed(1)}</span> →
          ampliar stops urgente.
        </p>
      )}
    </div>
  );
}
