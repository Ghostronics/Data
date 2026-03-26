import clsx from "clsx";

interface FiltersBarProps {
  vvix: number | null;
  skew: number | null;
}

function Meter({
  label,
  value,
  zones,
  unit = "",
}: {
  label: string;
  value: number | null;
  zones: Array<{ min: number; max: number; color: string; label: string }>;
  unit?: string;
}) {
  if (value === null) {
    return (
      <div className="trading-card p-4">
        <div className="text-xs text-text-muted uppercase tracking-widest mb-2">{label}</div>
        <div className="text-2xl mono font-bold text-text-muted">—</div>
      </div>
    );
  }

  const activeZone = zones.find((z) => value >= z.min && value <= z.max) ?? zones[zones.length - 1];
  const allMin = zones[0].min;
  const allMax = zones[zones.length - 1].max;
  const pct = Math.min(100, Math.max(0, ((value - allMin) / (allMax - allMin)) * 100));

  return (
    <div className="trading-card p-4">
      <div className="flex items-center justify-between mb-1">
        <div className="text-xs text-text-muted uppercase tracking-widest">{label}</div>
        <span
          className={clsx(
            "text-xs px-2 py-0.5 rounded-full font-medium",
            activeZone.color
          )}
        >
          {activeZone.label}
        </span>
      </div>

      <div className="mono text-2xl font-bold text-text-primary mb-3">
        {value.toFixed(1)}{unit}
      </div>

      {/* Zone track */}
      <div className="relative h-2 rounded-full bg-bg-secondary overflow-hidden flex">
        {zones.map((z, i) => {
          const width = ((z.max - z.min) / (allMax - allMin)) * 100;
          const baseColors: Record<string, string> = {
            "text-accent-blue": "#4fc3f7",
            "text-gex-positive": "#00d68f",
            "text-gex-neutral": "#ffd32a",
            "text-gex-negative": "#ff4757",
            "text-text-muted": "#4a5a74",
            "text-accent-purple": "#a78bfa",
          };
          const bg = baseColors[z.color] ?? "#4a5a74";
          return (
            <div
              key={i}
              style={{ width: `${width}%`, background: `${bg}30` }}
              className="h-full"
            />
          );
        })}
        {/* Indicator */}
        <div
          className="absolute top-0 h-full w-1 rounded-full"
          style={{
            left: `calc(${pct}% - 2px)`,
            background: activeZone.color.includes("positive")
              ? "#00d68f"
              : activeZone.color.includes("negative")
              ? "#ff4757"
              : activeZone.color.includes("neutral")
              ? "#ffd32a"
              : activeZone.color.includes("blue")
              ? "#4fc3f7"
              : "#a78bfa",
          }}
        />
      </div>

      <div className="flex justify-between text-xs text-text-muted mt-1 mono">
        <span>{allMin}</span>
        <span>{allMax}</span>
      </div>
    </div>
  );
}

function VvixAdvice({ vvix }: { vvix: number }) {
  if (vvix > 140) return <p className="text-gex-negative text-xs">⛔ Saltar el día.</p>;
  if (vvix > 120) return <p className="text-gex-neutral text-xs">⚠️ Stops +20%, targets +30%.</p>;
  if (vvix < 100) return <p className="text-accent-blue text-xs">↓ Reducir targets 20%.</p>;
  return <p className="text-gex-positive text-xs">✓ Parámetros estándar.</p>;
}

function SkewAdvice({ skew }: { skew: number }) {
  if (skew > 155) return <p className="text-accent-purple text-xs">↑ Posible suelo contrario (cautela).</p>;
  if (skew > 145) return <p className="text-gex-negative text-xs">↓ Sesgo bajista institucional.</p>;
  if (skew < 130) return <p className="text-gex-positive text-xs">↑ Sesgo ligeramente alcista.</p>;
  return <p className="text-text-secondary text-xs">─ Neutro.</p>;
}

export default function FiltersBar({ vvix, skew }: FiltersBarProps) {
  return (
    <div className="space-y-3">
      <div className="text-xs text-text-secondary uppercase tracking-widest">
        Filtros de Volatilidad
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div>
          <Meter
            label="VVIX"
            value={vvix}
            zones={[
              { min: 70, max: 100, color: "text-accent-blue", label: "Bajo" },
              { min: 100, max: 120, color: "text-gex-positive", label: "Estándar" },
              { min: 120, max: 140, color: "text-gex-neutral", label: "Elevado" },
              { min: 140, max: 180, color: "text-gex-negative", label: "Extremo" },
            ]}
          />
          {vvix !== null && (
            <div className="mt-1.5 px-1">
              <VvixAdvice vvix={vvix} />
            </div>
          )}
        </div>
        <div>
          <Meter
            label="SKEW"
            value={skew}
            zones={[
              { min: 100, max: 130, color: "text-gex-positive", label: "Alcista" },
              { min: 130, max: 145, color: "text-gex-neutral", label: "Neutro" },
              { min: 145, max: 155, color: "text-gex-negative", label: "Bajista" },
              { min: 155, max: 175, color: "text-accent-purple", label: "Extremo" },
            ]}
          />
          {skew !== null && (
            <div className="mt-1.5 px-1">
              <SkewAdvice skew={skew} />
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
