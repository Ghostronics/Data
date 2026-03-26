import type { TradingSession } from "@/lib/types";
import clsx from "clsx";

interface InstrumentCardProps {
  instrument: "NQ" | "ES";
  session: TradingSession;
}

function Row({
  label,
  value,
  color,
  mono = true,
}: {
  label: string;
  value: string | null;
  color?: string;
  mono?: boolean;
}) {
  return (
    <div className="flex items-center justify-between py-2 border-b border-bg-border last:border-0">
      <span className="text-xs text-text-secondary">{label}</span>
      <span
        className={clsx(
          "text-sm font-medium",
          mono ? "mono" : "",
          color ?? "text-text-primary"
        )}
      >
        {value ?? "—"}
      </span>
    </div>
  );
}

function GexBadge({ value }: { value: number | null }) {
  if (value === null) return <span className="text-text-muted mono">—</span>;
  const color =
    value > 0.5 ? "text-gex-positive" : value < -0.5 ? "text-gex-negative" : "text-gex-neutral";
  return (
    <span className={clsx("mono text-sm font-semibold", color)}>
      {value > 0 ? "+" : ""}
      {value.toFixed(2)}M
    </span>
  );
}

export default function InstrumentCard({ instrument, session }: InstrumentCardProps) {
  const prefix = instrument === "NQ" ? "nq" : "es";
  const gex = session[`${prefix}_gex` as keyof TradingSession] as number | null;
  const dex = session[`${prefix}_dex` as keyof TradingSession] as number | null;
  const hvlAll = session[`${prefix}_hvl_all` as keyof TradingSession] as number | null;
  const hvl0dte = session[`${prefix}_hvl_0dte` as keyof TradingSession] as number | null;
  const callResist = session[`${prefix}_call_resist` as keyof TradingSession] as number | null;
  const putSupport = session[`${prefix}_put_support` as keyof TradingSession] as number | null;

  const fmt = (v: number | null) =>
    v !== null
      ? instrument === "NQ"
        ? v.toLocaleString("en-US", { maximumFractionDigits: 0 })
        : v.toFixed(2)
      : null;

  const dexColor =
    dex === null ? undefined : dex > 0 ? "text-gex-positive" : "text-gex-negative";

  // HVL confluence
  const hvlDiff =
    hvlAll !== null && hvl0dte !== null ? Math.abs(hvlAll - hvl0dte) : null;
  const strongHvl = hvlDiff !== null && hvlDiff < (instrument === "NQ" ? 30 : 4);

  return (
    <div className="trading-card p-4">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <div
            className={clsx(
              "w-2 h-2 rounded-full",
              instrument === "NQ" ? "bg-accent-blue" : "bg-accent-purple"
            )}
          />
          <span className="font-semibold text-sm">
            {instrument}{" "}
            <span className="text-text-secondary font-normal">
              {instrument === "NQ" ? "/ MNQ" : "/ MES"}
            </span>
          </span>
        </div>
        {strongHvl && (
          <span className="text-xs bg-gex-neutral/10 text-gex-neutral border border-gex-neutral/20 px-2 py-0.5 rounded-full">
            ⚡ HVL Confluencia
          </span>
        )}
      </div>

      <div className="space-y-0.5">
        {/* GEX row */}
        <div className="flex items-center justify-between py-2 border-b border-bg-border">
          <span className="text-xs text-text-secondary">Net GEX</span>
          <GexBadge value={gex} />
        </div>

        {/* DEX row */}
        <div className="flex items-center justify-between py-2 border-b border-bg-border">
          <span className="text-xs text-text-secondary">Net DEX</span>
          {dex !== null ? (
            <span className={clsx("mono text-sm font-medium", dexColor)}>
              {dex > 0 ? "+" : ""}
              {dex.toFixed(2)}M
            </span>
          ) : (
            <span className="text-text-muted mono">—</span>
          )}
        </div>

        <Row label="Call Resistance" value={fmt(callResist)} color="text-gex-negative" />
        <Row
          label="HVL 0DTE"
          value={fmt(hvl0dte)}
          color={hvl0dte !== null ? "text-gex-neutral" : undefined}
        />
        <Row label="HVL All Exp" value={fmt(hvlAll)} color="text-text-primary" />
        <Row label="Put Support" value={fmt(putSupport)} color="text-gex-positive" />

        {hvlDiff !== null && (
          <div className="pt-2">
            <div className="flex items-center justify-between text-xs">
              <span className="text-text-muted">Confluencia HVL</span>
              <span
                className={clsx(
                  "mono font-medium",
                  strongHvl ? "text-gex-neutral" : "text-text-secondary"
                )}
              >
                {instrument === "NQ" ? hvlDiff.toFixed(0) : hvlDiff.toFixed(2)} pts{" "}
                {strongHvl ? "✓ Fuerte" : ""}
              </span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
