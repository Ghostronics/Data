"use client";

interface LevelMapProps {
  instrument: "NQ" | "ES";
  hvlAll: number | null;
  hvl0dte: number | null;
  callResist: number | null;
  putSupport: number | null;
  currentPrice?: number | null;
}

export default function LevelMap({
  instrument,
  hvlAll,
  hvl0dte,
  callResist,
  putSupport,
  currentPrice,
}: LevelMapProps) {
  const allLevels = [hvlAll, hvl0dte, callResist, putSupport, currentPrice].filter(
    (v): v is number => v !== null && v !== undefined
  );

  if (allLevels.length === 0) {
    return (
      <div className="trading-card p-4 h-full flex items-center justify-center">
        <p className="text-text-muted text-sm">Sin niveles</p>
      </div>
    );
  }

  const padding = instrument === "NQ" ? 150 : 20;
  const minVal = Math.min(...allLevels) - padding;
  const maxVal = Math.max(...allLevels) + padding;
  const range = maxVal - minVal;

  const toY = (val: number, height: number) =>
    ((maxVal - val) / range) * height;

  const svgWidth = 280;
  const svgHeight = 320;
  const leftPad = 70;
  const rightPad = 20;
  const topPad = 16;
  const bottomPad = 16;
  const chartHeight = svgHeight - topPad - bottomPad;
  const chartWidth = svgWidth - leftPad - rightPad;

  const y = (val: number) => topPad + toY(val, chartHeight);
  const formatPrice = (v: number) =>
    instrument === "NQ"
      ? v.toLocaleString("en-US", { maximumFractionDigits: 0 })
      : v.toFixed(2);

  return (
    <div className="trading-card p-4">
      <div className="flex items-center justify-between mb-3">
        <span className="text-xs uppercase tracking-widest text-text-secondary">
          Mapa de Niveles — {instrument}
        </span>
        <div className="flex items-center gap-3 text-xs text-text-muted">
          <span className="flex items-center gap-1">
            <span className="inline-block w-3 h-0.5 bg-gex-negative opacity-60" />
            Resist.
          </span>
          <span className="flex items-center gap-1">
            <span className="inline-block w-3 h-0.5 bg-white opacity-60" />
            HVL
          </span>
          <span className="flex items-center gap-1">
            <span className="inline-block w-3 h-0.5 bg-gex-positive opacity-60" />
            Support
          </span>
        </div>
      </div>

      <svg width="100%" viewBox={`0 0 ${svgWidth} ${svgHeight}`} className="overflow-visible">
        {/* Chart area background */}
        <rect x={leftPad} y={topPad} width={chartWidth} height={chartHeight} fill="rgba(255,255,255,0.01)" rx={4} />

        {/* Call Resistance zone */}
        {callResist !== null && (
          <>
            <rect
              x={leftPad}
              y={topPad}
              width={chartWidth}
              height={Math.max(0, y(callResist) - topPad)}
              fill="rgba(255,71,87,0.06)"
            />
            <line
              x1={leftPad}
              y1={y(callResist)}
              x2={leftPad + chartWidth}
              y2={y(callResist)}
              stroke="#ff4757"
              strokeWidth={1.5}
            />
            <text x={leftPad - 6} y={y(callResist) + 4} textAnchor="end" fontSize={9} fill="#ff4757" className="mono">
              {formatPrice(callResist)}
            </text>
            <text x={leftPad + chartWidth + 4} y={y(callResist) + 4} fontSize={8} fill="#ff4757" opacity={0.7}>
              CR
            </text>
          </>
        )}

        {/* Put Support zone */}
        {putSupport !== null && (
          <>
            <rect
              x={leftPad}
              y={y(putSupport)}
              width={chartWidth}
              height={Math.max(0, topPad + chartHeight - y(putSupport))}
              fill="rgba(0,214,143,0.06)"
            />
            <line
              x1={leftPad}
              y1={y(putSupport)}
              x2={leftPad + chartWidth}
              y2={y(putSupport)}
              stroke="#00d68f"
              strokeWidth={1.5}
            />
            <text x={leftPad - 6} y={y(putSupport) + 4} textAnchor="end" fontSize={9} fill="#00d68f" className="mono">
              {formatPrice(putSupport)}
            </text>
            <text x={leftPad + chartWidth + 4} y={y(putSupport) + 4} fontSize={8} fill="#00d68f" opacity={0.7}>
              PS
            </text>
          </>
        )}

        {/* HVL All Exp */}
        {hvlAll !== null && (
          <>
            <line
              x1={leftPad}
              y1={y(hvlAll)}
              x2={leftPad + chartWidth}
              y2={y(hvlAll)}
              stroke="#e8f0fe"
              strokeWidth={1.5}
            />
            <text x={leftPad - 6} y={y(hvlAll) + 4} textAnchor="end" fontSize={9} fill="#e8f0fe" className="mono">
              {formatPrice(hvlAll)}
            </text>
            <text x={leftPad + chartWidth + 4} y={y(hvlAll) + 4} fontSize={8} fill="#e8f0fe" opacity={0.6}>
              HVL
            </text>
          </>
        )}

        {/* HVL 0DTE — dashed yellow */}
        {hvl0dte !== null && (
          <>
            <line
              x1={leftPad}
              y1={y(hvl0dte)}
              x2={leftPad + chartWidth}
              y2={y(hvl0dte)}
              stroke="#ffd32a"
              strokeWidth={1.5}
              strokeDasharray="5,4"
            />
            <text x={leftPad - 6} y={y(hvl0dte) + 4} textAnchor="end" fontSize={9} fill="#ffd32a" className="mono">
              {formatPrice(hvl0dte)}
            </text>
            <text x={leftPad + chartWidth + 4} y={y(hvl0dte) + 4} fontSize={8} fill="#ffd32a" opacity={0.8}>
              0DTE
            </text>
          </>
        )}

        {/* Current price */}
        {currentPrice !== null && currentPrice !== undefined && (
          <>
            <line
              x1={leftPad}
              y1={y(currentPrice)}
              x2={leftPad + chartWidth}
              y2={y(currentPrice)}
              stroke="#4fc3f7"
              strokeWidth={1}
              strokeDasharray="2,3"
              opacity={0.8}
            />
            <polygon
              points={`${leftPad - 2},${y(currentPrice)} ${leftPad + 8},${y(currentPrice) - 5} ${leftPad + 8},${y(currentPrice) + 5}`}
              fill="#4fc3f7"
            />
            <text x={leftPad - 8} y={y(currentPrice) + 4} textAnchor="end" fontSize={9} fill="#4fc3f7" className="mono">
              {formatPrice(currentPrice)}
            </text>
          </>
        )}

        {/* Chart border */}
        <rect
          x={leftPad}
          y={topPad}
          width={chartWidth}
          height={chartHeight}
          fill="none"
          stroke="#1e2a3e"
          strokeWidth={1}
          rx={4}
        />
      </svg>
    </div>
  );
}
