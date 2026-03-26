import { supabase } from "@/lib/supabase";
import type { TradingSession } from "@/lib/types";
import SessionDashboard from "@/components/SessionDashboard";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { notFound } from "next/navigation";

export const revalidate = 300;

async function getSession(date: string): Promise<TradingSession | null> {
  const { data } = await supabase
    .from("trading_sessions")
    .select("*")
    .eq("date", date)
    .single();
  return data as TradingSession | null;
}

export default async function DayPage({ params }: { params: { date: string } }) {
  const session = await getSession(params.date);
  if (!session) notFound();

  return (
    <div>
      <Link
        href="/history"
        className="flex items-center gap-2 text-text-secondary hover:text-text-primary text-sm mb-5 transition-colors w-fit"
      >
        <ArrowLeft size={14} />
        Historial
      </Link>
      <SessionDashboard session={session} />
    </div>
  );
}
