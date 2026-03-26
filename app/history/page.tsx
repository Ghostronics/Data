import { supabase } from "@/lib/supabase";
import type { TradingSession, DayBias } from "@/lib/types";
import Link from "next/link";
import { format, parseISO } from "date-fns";
import { es } from "date-fns/locale";
import clsx from "clsx";
import { TrendingUp, TrendingDown, Minus, Calendar, ChevronRight } from "lucide-react";

export const revalidate = 60;

const BIAS_META: Record<DayBias, { color: string; icon: React.ReactNode; label: string }> = {
  ALCISTA: {
    color: "text-gex-positive",
    icon: <TrendingUp size={12} />,
    label: "Alcista",
  },
  BAJISTA: {
    color: "text-gex-negative",
    icon: <TrendingDown size={12} />,
    label: "Bajista",
  },
  NEUTRO: {
    color: "text-gex-neutral",
    icon: <Minus size={12} />,
    label: "Neutro",
  },
  SALTAR: {
    color: "text-text-muted",
    icon: <Minus size={12} />,
    label: "No Operar",
  },
};

async function getSessions(): Promise<TradingSession[]> {
  const { data } = await supabase
    .from("trading_sessions")
    .select("id, date, regime, day_bias, recommended_instrument, skip_day, nq_gex, es_gex, vvix, skew, created_at, updated_at, nq_dex, nq_hvl_all, nq_hvl_0dte, nq_call_resist, nq_put_support, es_dex, es_hvl_all, es_hvl_0dte, es_call_resist, es_put_support, vix_gex_net, vix_call_resist, vix_hvl, analysis_text, setup_a, setup_b, image_urls")
    .order("date", { ascending: false })
    .limit(60);
  return (data as TradingSession[]) ?? [];
}

export default async function HistoryPage() {
  const sessions = await getSessions();

  return (
    <div>
      <div className="flex items-center gap-3 mb-6">
        <Calendar size={18} className="text-text-secondary" />
        <h1 className="text-lg font-semibold">Historial de Sesiones</h1>
        <span className="text-text-muted text-sm ml-auto">{sessions.length} días</span>
      </div>

      {sessions.length === 0 ? (
        <div className="trading-card p-10 text-center text-text-muted">
          No hay sesiones registradas aún.
        </div>
      ) : (
        <div className="space-y-2">
          {sessions.map((s) => {
            const biasMeta = s.day_bias ? BIAS_META[s.day_bias] : null;
            const dateLabel = format(parseISO(s.date), "EEE d MMM yyyy", { locale: es });
            const isToday = s.date === new Date().toISOString().slice(0, 10);

            return (
              <Link
                key={s.id}
                href={`/day/${s.date}`}
                className="trading-card p-4 flex items-center gap-4 hover:border-text-muted transition-colors group"
              >
                {/* Date */}
                <div className="w-32 shrink-0">
                  <div className="flex items-center gap-1.5">
                    {isToday && (
                      <span className="w-1.5 h-1.5 rounded-full bg-gex-positive pulse-dot" />
                    )}
                    <span className="text-sm font-medium capitalize text-text-primary">
                      {dateLabel}
                    </span>
                  </div>
                </div>

                {/* Regime */}
                <div className="hidden sm:block w-28 mono text-xs text-text-secondary shrink-0">
                  {s.regime ?? "—"}
                </div>

                {/* Bias */}
                {biasMeta && (
                  <div
                    className={clsx(
                      "hidden sm:flex items-center gap-1 text-xs font-medium shrink-0",
                      biasMeta.color
                    )}
                  >
                    {biasMeta.icon}
                    {biasMeta.label}
                  </div>
                )}

                {/* GEX badges */}
                <div className="hidden md:flex items-center gap-3 text-xs mono ml-auto">
                  {s.nq_gex !== null && (
                    <span
                      className={clsx(
                        s.nq_gex > 0.5
                          ? "text-gex-positive"
                          : s.nq_gex < -0.5
                          ? "text-gex-negative"
                          : "text-gex-neutral"
                      )}
                    >
                      NQ {s.nq_gex > 0 ? "+" : ""}{s.nq_gex?.toFixed(1)}M
                    </span>
                  )}
                  {s.es_gex !== null && (
                    <span
                      className={clsx(
                        s.es_gex > 0.5
                          ? "text-gex-positive"
                          : s.es_gex < -0.5
                          ? "text-gex-negative"
                          : "text-gex-neutral"
                      )}
                    >
                      ES {s.es_gex > 0 ? "+" : ""}{s.es_gex?.toFixed(1)}M
                    </span>
                  )}
                </div>

                {/* Instrument */}
                {s.recommended_instrument && !s.skip_day && (
                  <span className="text-xs text-accent-blue bg-accent-blue/5 border border-accent-blue/10 px-2 py-0.5 rounded shrink-0">
                    {s.recommended_instrument}
                  </span>
                )}
                {s.skip_day && (
                  <span className="text-xs text-text-muted bg-bg-secondary border border-bg-border px-2 py-0.5 rounded shrink-0">
                    Saltar
                  </span>
                )}

                <ChevronRight
                  size={14}
                  className="text-text-muted group-hover:text-text-secondary transition-colors ml-auto shrink-0"
                />
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
