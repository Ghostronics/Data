import { supabase } from "@/lib/supabase";
import type { TradingSession } from "@/lib/types";
import SessionDashboard from "@/components/SessionDashboard";
import { Activity, Upload } from "lucide-react";
import Link from "next/link";

export const revalidate = 60; // Revalidate every minute

async function getTodaySession(): Promise<TradingSession | null> {
  try {
    const today = new Date().toISOString().slice(0, 10);
    const { data } = await supabase
      .from("trading_sessions")
      .select("*")
      .eq("date", today)
      .single();
    return data as TradingSession | null;
  } catch {
    return null;
  }
}

export default async function HomePage() {
  const session = await getTodaySession();

  if (!session) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-6 text-center px-4">
        <div className="w-16 h-16 rounded-2xl bg-bg-card border border-bg-border flex items-center justify-center">
          <Activity size={28} className="text-text-muted" />
        </div>
        <div>
          <h1 className="text-xl font-semibold text-text-primary mb-2">
            Sin datos para hoy
          </h1>
          <p className="text-text-secondary text-sm max-w-md">
            Aún no se han subido los datos de MenthorQ para la sesión de hoy.
            <br />
            Sube las capturas desde el panel de admin para ver el análisis.
          </p>
        </div>
        <Link
          href="/admin"
          className="flex items-center gap-2 bg-gex-positive/10 hover:bg-gex-positive/15 text-gex-positive border border-gex-positive/30 px-5 py-2.5 rounded-lg text-sm font-medium transition-colors"
        >
          <Upload size={15} />
          Subir datos de hoy
        </Link>
      </div>
    );
  }

  return <SessionDashboard session={session} />;
}
