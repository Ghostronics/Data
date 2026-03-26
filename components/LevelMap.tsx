"use client";

interface LevelMapProps {
  instrument: "NQ" | "ES";
  hvlAll: number | null;
  hvl0dte: number | null;
  callResist: number | null;
  putSupport: number | null;
  currentPrice?: number | null;
}

interface Level {
  value: number;
  label: string;
  sublabel: string;
  color: string;
  dashed: boolean;
  priority: string;
}

export default function LevelMap({
  instrument,
  hvlAll,
  hvl0dte,
  callResist,
  putSupport,
  currentPrice,
}: LevelMapProps) {
  const fmt = (v: number) =>
    instrument === "NQ"
      ? v.toLocaleString("en-US", { maximumFractionDigits: 0 })
      : v.toFixed(2);

  const levels: Level[] = [];
  if (callResist != null)
    levels.push({ value: callResist, label: `CALL RES  ${fmt(callResist)}`, sublabel: "TECHO DURO — FADE AGRESIVO", color: "#ff4757", dashed: true, priority: "PRIMARY" });
  if (hvlAll != null)
    levels.push({ value: hvlAll, label: `HVL  ${fmt(hvlAll)}`, sublabel: "IMÁN — PRECIO CONVERGE AQUÍ", color: "#f39c12", dashed: false, priority: "TARGET" });
  if (hvl0dte != null)
    levels.push({ value: hvl0dte, label: `HVL 0DTE  ${fmt(hvl0dte)}`, sublabel: "IMÁN INTRADÍA", color: "#ffd32a", dashed: true, priority: "SECONDARY" });
  if (putSupport != null)
    levels.push({ value: putSupport, label: `PUT SUPPORT  ${fmt(putSupport)}`, sublabel: "SUELO FUERTE — BID AGRESIVO", color: "#00d68f", dashed: true, priority: "PRIMARY" });

  const allVals = [...levels.map((l) => l.value), ...(currentPrice != null ? [currentPrice] : [])];
  if (allVals.length === 0)
    return (
      <div className="trading-card p-4 flex items-center justify-center h-32">
        <p className="text-text-muted text-sm">Sin niveles</p>
      </div>
    );

  const pad = instrument === "NQ" ? 130 : 18;
  const minVal = Math.min(...allVals) - pad;
  const maxVal = Math.max(...allVals) + pad;
  const range = maxVal - minVal;

  const W = 420, H = 400;
  const lp = 58, rp = 8, tp = 16, bp = 16;
  const chartW = 130, chartH = H - tp - bp;
  const labelX = lp + chartW + 14;
  const labelW = W - labelX - rp;
  const BOX_H = 36;

  const toY = (v: number) => tp + ((maxVal - v) / range) * chartH;

  // Sort descending by value = top to bottom
  const sorted = [...levels].sort((a, b) => b.value - a.value);

  // Compute label Y positions with anti-overlap
  const rawYs = sorted.map((l) => toY(l.value));
  const labelYs: number[] = [];
  rawYs.forEach((y, i) => {
    const ideal = Math.max(tp, Math.min(y - BOX_H / 2, tp + chartH - BOX_H));
    if (i === 0) { labelYs.push(ideal); return; }
    const prev = labelYs[i - 1] + BOX_H + 4;
    labelYs.push(Math.max(ideal, prev));
  });

  // Grid price ticks
  const ticks = [0, 0.25, 0.5, 0.75, 1].map((p) => ({
    y: tp + p * chartH,
    price: maxVal - p * range,
  }));

  return (
    <div className="trading-card p-3">
      <div className="text-xs uppercase tracking-widest text-text-secondary font-medium mb-2">
        Niveles Gamma — {instrument}
      </div>
      <svg width="100%" viewBox={`0 0 ${W} ${H}`} className="overflow-visible">
        {/* Background */}
        <rect x={lp} y={tp} width={chartW} height={chartH} fill="rgba(255,255,255,0.015)" rx={3} />

        {/* Call resistance zone */}
        {callResist != null && (
          <rect x={lp} y={tp} width={chartW} height={Math.max(0, toY(callResist) - tp)} fill="rgba(255,71,87,0.08)" />
        )}
        {/* Put support zone */}
        {putSupport != null && (
          <rect x={lp} y={toY(putSupport)} width={chartW} height={Math.max(0, tp + chartH - toY(putSupport))} fill="rgba(0,214,143,0.08)" />
        )}

        {/* Grid ticks */}
        {ticks.map(({ y, price }, i) => (
          <g key={i}>
            <line x1={lp} y1={y} x2={lp + chartW} y2={y} stroke="#1a2540" strokeWidth={0.8} />
            <text x={lp - 5} y={y + 3.5} textAnchor="end" fontSize={8} fill="#3a4a60">
              {fmt(price)}
            </text>
          </g>
        ))}

        {/* Level lines + label boxes */}
        {sorted.map((level, i) => {
          const lineY = toY(level.value);
          const boxY = labelYs[i];
          const midBox = boxY + BOX_H / 2;
          return (
            <g key={i}>
              {/* Horizontal line across chart */}
              <line
                x1={lp} y1={lineY} x2={lp + chartW} y2={lineY}
                stroke={level.color} strokeWidth={1.5}
                strokeDasharray={level.dashed ? "6,4" : undefined}
                opacity={0.9}
              />
              {/* Connector */}
              <line
                x1={lp + chartW} y1={lineY} x2={labelX} y2={midBox}
                stroke={level.color} strokeWidth={0.5} opacity={0.35}
              />
              {/* Price on left axis */}
              <text x={lp - 5} y={lineY + 3.5} textAnchor="end" fontSize={9} fill={level.color} fontWeight="600">
                {fmt(level.value)}
              </text>
              {/* Label box */}
              <rect x={labelX} y={boxY} width={labelW} height={BOX_H} rx={4}
                fill={`${level.color}15`} stroke={level.color} strokeWidth={0.7} strokeOpacity={0.45} />
              {/* Priority pill */}
              <rect x={labelX + 6} y={boxY + 5} width={level.priority === "SECONDARY" ? 52 : 40} height={10} rx={2} fill={`${level.color}28`} />
              <text x={labelX + 8} y={boxY + 13} fontSize={6.5} fill={level.color} opacity={0.85} letterSpacing={0.5}>
                {level.priority}
              </text>
              {/* Level label */}
              <text x={labelX + 8} y={boxY + 23} fontSize={9.5} fill={level.color} fontWeight="700">
                {level.label}
              </text>
              {/* Sublabel */}
              <text x={labelX + 8} y={boxY + 32} fontSize={7.5} fill={level.color} opacity={0.6}>
                {level.sublabel}
              </text>
            </g>
          );
        })}

        {/* Current price */}
        {currentPrice != null && (
          <g>
            <line x1={lp} y1={toY(currentPrice)} x2={lp + chartW} y2={toY(currentPrice)}
              stroke="#4fc3f7" strokeWidth={1} strokeDasharray="3,3" opacity={0.9} />
            <polygon
              points={`${lp + 2},${toY(currentPrice)} ${lp + 11},${toY(currentPrice) - 5} ${lp + 11},${toY(currentPrice) + 5}`}
              fill="#4fc3f7" opacity={0.9}
            />
            <text x={lp - 5} y={toY(currentPrice) + 3.5} textAnchor="end" fontSize={9} fill="#4fc3f7" fontWeight="600">
              {fmt(currentPrice)}
            </text>
          </g>
        )}

        {/* Chart border */}
        <rect x={lp} y={tp} width={chartW} height={chartH} fill="none" stroke="#1e2a3e" strokeWidth={1} rx={3} />
      </svg>
    </div>
  );
}
