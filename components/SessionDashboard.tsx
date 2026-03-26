import type { TradingSession } from "@/lib/types";
import { format, parseISO } from "date-fns";
import { es } from "date-fns/locale";
import { Calendar, Clock } from "lucide-react";
import RegimeCard from "./RegimeCard";
import InstrumentCard from "./InstrumentCard";
import GexGauge from "./GexGauge";
import LevelMap from "./LevelMap";
import SetupCard from "./SetupCard";
import VixSection from "./VixSection";
import FiltersBar from "./FiltersBar";
import AnalysisCard from "./AnalysisCard";

export default function SessionDashboard({ session }: { session: TradingSession }) {
  const dateLabel = format(parseISO(session.date), "EEEE d 'de' MMMM yyyy", { locale: es });
  const isToday = session.date === new Date().toISOString().slice(0, 10);

  return (
    <div className="space-y-5 animate-fade-in">
      {/* Date header */}
      <div className="flex items-center gap-3">
        <div className="flex items-center gap-2 text-text-secondary text-sm">
          <Calendar size={14} />
          <span className="capitalize">{dateLabel}</span>
        </div>
        {isToday && (
          <span className="flex items-center gap-1.5 text-xs bg-gex-positive/10 text-gex-positive border border-gex-positive/20 px-2.5 py-1 rounded-full">
            <span className="w-1.5 h-1.5 rounded-full bg-gex-positive pulse-dot" />
            Sesión Activa
          </span>
        )}
        <span className="ml-auto flex items-center gap-1 text-xs text-text-muted">
          <Clock size={11} />
          Ventana: 9:35–11:30 AM ET
        </span>
      </div>

      {/* Regime */}
      <RegimeCard
        regime={session.regime}
        dayBias={session.day_bias}
        recommendedInstrument={session.recommended_instrument}
        skipDay={session.skip_day}
      />

      {/* GEX Gauges */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <GexGauge value={session.nq_gex} label="NQ" />
        <GexGauge value={session.nq_dex} label="NQ DEX" />
        <GexGauge value={session.es_gex} label="ES" />
        <GexGauge value={session.es_dex} label="ES DEX" />
      </div>

      {/* Instrument cards + Level maps */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        {/* NQ */}
        <div className="space-y-3">
          <InstrumentCard instrument="NQ" session={session} />
          <LevelMap
            instrument="NQ"
            hvlAll={session.nq_hvl_all}
            hvl0dte={session.nq_hvl_0dte}
            callResist={session.nq_call_resist}
            putSupport={session.nq_put_support}
          />
        </div>

        {/* ES */}
        <div className="space-y-3">
          <InstrumentCard instrument="ES" session={session} />
          <LevelMap
            instrument="ES"
            hvlAll={session.es_hvl_all}
            hvl0dte={session.es_hvl_0dte}
            callResist={session.es_call_resist}
            putSupport={session.es_put_support}
          />
        </div>
      </div>

      {/* VIX + Filters */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        <VixSection
          vixGexNet={session.vix_gex_net}
          vixCallResist={session.vix_call_resist}
          vixHvl={session.vix_hvl}
        />
        <FiltersBar vvix={session.vvix} skew={session.skew} />
      </div>

      {/* Setups */}
      <div>
        <div className="text-xs text-text-secondary uppercase tracking-widest mb-3">
          Plan del Día
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <SetupCard setup={session.setup_a} label="Setup A" />
          <SetupCard setup={session.setup_b} label="Setup B" />
        </div>
      </div>

      {/* Analysis */}
      <AnalysisCard text={session.analysis_text} />

      {/* Source images */}
      {session.image_urls.length > 0 && (
        <div className="trading-card p-4">
          <div className="text-xs text-text-secondary uppercase tracking-widest mb-3">
            Capturas MenthorQ
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
            {session.image_urls.map((url, i) => (
              <a key={i} href={url} target="_blank" rel="noopener noreferrer">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={url}
                  alt={`Captura ${i + 1}`}
                  className="w-full rounded-lg border border-bg-border hover:border-text-muted transition-colors object-cover aspect-video"
                />
              </a>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
