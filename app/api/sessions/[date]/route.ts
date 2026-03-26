import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";

export async function GET(
  _req: NextRequest,
  { params }: { params: { date: string } }
) {
  const { data, error } = await supabase
    .from("trading_sessions")
    .select("*")
    .eq("date", params.date)
    .single();

  if (error) {
    return NextResponse.json({ error: "Sesión no encontrada" }, { status: 404 });
  }

  return NextResponse.json(data);
}
