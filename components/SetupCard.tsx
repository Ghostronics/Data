import type { SetupPlan } from "@/lib/types";
import clsx from "clsx";
import { Target, TrendingUp, TrendingDown, CheckCircle, XCircle } from "lucide-react";

interface SetupCardProps {
  setup: SetupPlan | null;
  label: "Setup A" | "Setup B";
}

export default function SetupCard({ setup, label }: SetupCardProps) {
  if (!setup) {
    return (
      <div className="trading-card p-5 flex flex-col items-center justify-center gap-2 min-h-[180px]">
        <Target size={20} className="text-text-muted" />
        <span className="text-text-muted text-sm">{label} — Sin datos</span>
      </div>
    );
  }

  const isLong = setup.direction === "LONG";
  const dirColor = isLong ? "text-gex-positive" : "text-gex-negative";
  const dirBg = isLong ? "bg-gex-positive/10 border-gex-positive/20" : "bg-gex-negative/10 border-gex-negative/20";

  return (
    <div className="trading-card p-5">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <span className="text-xs text-text-secondary uppercase tracking-widest">{label}</span>
          <span className={clsx("text-xs px-2 py-0.5 rounded-full border font-medium flex items-center gap-1", dirBg, dirColor)}>
            {isLong ? <TrendingUp size={10} /> : <TrendingDown size={10} />}
            {setup.direction}
          </span>
        </div>
        <span className="text-xs bg-bg-secondary px-2 py-1 rounded font-medium text-accent-blue">
          {setup.instrument}
        </span>
      </div>

      {/* Key levels */}
      <div className="grid grid-cols-3 gap-2 mb-4">
        <div className="bg-bg-secondary rounded-lg p-2.5 text-center">
          <div className="text-xs text-text-muted mb-1">Entrada</div>
          <div className="mono text-xs font-semibold text-text-primary">{setup.entry_zone}</div>
        </div>
        <div className="bg-gex-negative/5 border border-gex-negative/10 rounded-lg p-2.5 text-center">
          <div className="text-xs text-text-muted mb-1">Stop</div>
          <div className="mono text-xs font-semibold text-gex-negative">{setup.stop}</div>
        </div>
        <div className="bg-gex-positive/5 border border-gex-positive/10 rounded-lg p-2.5 text-center">
          <div className="text-xs text-text-muted mb-1">Target</div>
          <div className="mono text-xs font-semibold text-gex-positive">{setup.target}</div>
        </div>
      </div>

      {/* R:R badge */}
      <div className="flex items-center justify-center mb-4">
        <span className="text-sm font-bold bg-accent-blue/10 border border-accent-blue/20 text-accent-blue px-4 py-1 rounded-full mono">
          R:R {setup.rr}
        </span>
      </div>

      {/* Conditions */}
      <div className="mb-3">
        <div className="text-xs text-text-muted mb-2 uppercase tracking-wider">Confirmaciones requeridas</div>
        <div className="space-y-1.5">
          {setup.conditions.map((c, i) => (
            <div key={i} className="flex items-start gap-2">
              <CheckCircle size={12} className="text-gex-positive mt-0.5 shrink-0" />
              <span className="text-xs text-text-secondary">{c}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Invalidation */}
      <div className="mt-3 p-2.5 bg-gex-negative/5 border border-gex-negative/10 rounded-lg">
        <div className="flex items-start gap-2">
          <XCircle size={12} className="text-gex-negative mt-0.5 shrink-0" />
          <div>
            <div className="text-xs text-gex-negative font-medium mb-0.5">Invalidación</div>
            <div className="text-xs text-text-secondary">{setup.invalidation}</div>
          </div>
        </div>
      </div>

      {/* Notes */}
      {setup.notes && (
        <p className="text-xs text-text-muted mt-3 italic border-t border-bg-border pt-2">
          {setup.notes}
        </p>
      )}
    </div>
  );
}
