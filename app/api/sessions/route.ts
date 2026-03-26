import { NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";

export async function GET() {
  const { data, error } = await supabase
    .from("trading_sessions")
    .select("id, date, regime, day_bias, recommended_instrument, skip_day, nq_gex, es_gex, vvix, skew")
    .order("date", { ascending: false })
    .limit(60);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json(data);
}
