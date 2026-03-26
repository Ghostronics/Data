"use client";

import { useMemo } from "react";

interface GexGaugeProps {
  value: number | null; // In millions
  label: string; // "NQ" or "ES"
  size?: number;
}

export default function GexGauge({ value, label, size = 140 }: GexGaugeProps) {
  const MAX = 5; // ±5M range

  const { angle, color, bgColor, textColor } = useMemo(() => {
    if (value === null) {
      return { angle: 0, color: "#4a5a74", bgColor: "rgba(74,90,116,0.1)", textColor: "#4a5a74" };
    }
    const clamped = Math.max(-MAX, Math.min(MAX, value));
    // -MAX = -135deg, 0 = 0deg, +MAX = +135deg
    const angle = (clamped / MAX) * 135;

    if (value > 0.5) return { angle, color: "#00d68f", bgColor: "rgba(0,214,143,0.08)", textColor: "#00d68f" };
    if (value < -0.5) return { angle, color: "#ff4757", bgColor: "rgba(255,71,87,0.08)", textColor: "#ff4757" };
    return { angle, color: "#ffd32a", bgColor: "rgba(255,211,42,0.08)", textColor: "#ffd32a" };
  }, [value]);

  const cx = size / 2;
  const cy = size / 2 + 10;
  const r = size * 0.38;
  const strokeWidth = 8;

  // Arc path helper
  function describeArc(startAngle: number, endAngle: number) {
    const toRad = (d: number) => ((d - 90) * Math.PI) / 180;
    const x1 = cx + r * Math.cos(toRad(startAngle));
    const y1 = cy + r * Math.sin(toRad(startAngle));
    const x2 = cx + r * Math.cos(toRad(endAngle));
    const y2 = cy + r * Math.sin(toRad(endAngle));
    const largeArc = Math.abs(endAngle - startAngle) > 180 ? 1 : 0;
    return `M ${x1} ${y1} A ${r} ${r} 0 ${largeArc} 1 ${x2} ${y2}`;
  }

  // Needle
  const needleAngleRad = ((angle - 90) * Math.PI) / 180;
  const needleLen = r - 8;
  const nx = cx + needleLen * Math.cos(needleAngleRad);
  const ny = cy + needleLen * Math.sin(needleAngleRad);

  const displayValue = value !== null ? `${value > 0 ? "+" : ""}${value.toFixed(2)}M` : "N/A";

  return (
    <div
      className="flex flex-col items-center trading-card p-4 gap-1"
      style={{ background: bgColor }}
    >
      <div className="text-xs text-text-secondary uppercase tracking-widest mb-1">
        {label} GEX
      </div>
      <svg width={size} height={size * 0.7} viewBox={`0 0 ${size} ${size * 0.7}`}>
        {/* Track */}
        <path
          d={describeArc(-135, 135)}
          fill="none"
          stroke="#1e2a3e"
          strokeWidth={strokeWidth}
          strokeLinecap="round"
        />
        {/* Red zone (negative) */}
        <path
          d={describeArc(-135, -5)}
          fill="none"
          stroke="rgba(255,71,87,0.3)"
          strokeWidth={strokeWidth}
          strokeLinecap="round"
        />
        {/* Green zone (positive) */}
        <path
          d={describeArc(5, 135)}
          fill="none"
          stroke="rgba(0,214,143,0.3)"
          strokeWidth={strokeWidth}
          strokeLinecap="round"
        />
        {/* Active arc */}
        {value !== null && (
          <path
            d={describeArc(value < 0 ? angle : 0, value >= 0 ? angle : 0)}
            fill="none"
            stroke={color}
            strokeWidth={strokeWidth}
            strokeLinecap="round"
          />
        )}
        {/* Needle */}
        <line
          x1={cx}
          y1={cy}
          x2={nx}
          y2={ny}
          stroke={color}
          strokeWidth={2.5}
          strokeLinecap="round"
        />
        <circle cx={cx} cy={cy} r={4} fill={color} />
        {/* Center dot shadow */}
        <circle cx={cx} cy={cy} r={6} fill="none" stroke={color} strokeWidth={1} opacity={0.3} />
      </svg>

      <div className="mono font-bold text-xl -mt-1" style={{ color: textColor }}>
        {displayValue}
      </div>
      <div className="text-xs text-text-secondary">
        {value === null ? "Sin datos" : value > 0.5 ? "Positivo ↑" : value < -0.5 ? "Negativo ↓" : "Neutro ─"}
      </div>
    </div>
  );
}
