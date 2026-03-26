import { NextRequest, NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabase";
import { analyzeSessionImages } from "@/lib/claude";
import type { UploadPayload } from "@/lib/types";

export async function POST(req: NextRequest) {
  try {
    const body = (await req.json()) as UploadPayload;
    const { password, date, vvix, skew, images, overrides } = body;

    // Auth
    if (password !== process.env.ADMIN_PASSWORD) {
      return NextResponse.json({ error: "Contraseña incorrecta" }, { status: 401 });
    }

    // Validation
    if (!date || !vvix || !skew || !images?.length) {
      return NextResponse.json({ error: "Faltan campos requeridos" }, { status: 400 });
    }

    const supabase = getSupabaseAdmin();

    // Upload images to Supabase Storage
    const imageUrls: string[] = [];
    for (let i = 0; i < images.length; i++) {
      const imgBuffer = Buffer.from(images[i], "base64");
      const fileName = `${date}/${Date.now()}_${i}.jpg`;

      const { error } = await supabase.storage
        .from("session-images")
        .upload(fileName, imgBuffer, {
          contentType: "image/jpeg",
          upsert: true,
        });

      if (!error) {
        const { data: urlData } = supabase.storage
          .from("session-images")
          .getPublicUrl(fileName);
        imageUrls.push(urlData.publicUrl);
      }
    }

    // Analyze with Claude
    const extracted = await analyzeSessionImages(images, vvix, skew, date);

    // Merge overrides (manual corrections)
    const merged = { ...extracted, ...overrides };

    // Upsert session in DB
    const sessionData = {
      date,
      nq_gex: merged.nq_gex ?? null,
      nq_dex: merged.nq_dex ?? null,
      nq_hvl_all: merged.nq_hvl_all ?? null,
      nq_hvl_0dte: merged.nq_hvl_0dte ?? null,
      nq_call_resist: merged.nq_call_resist ?? null,
      nq_put_support: merged.nq_put_support ?? null,
      es_gex: merged.es_gex ?? null,
      es_dex: merged.es_dex ?? null,
      es_hvl_all: merged.es_hvl_all ?? null,
      es_hvl_0dte: merged.es_hvl_0dte ?? null,
      es_call_resist: merged.es_call_resist ?? null,
      es_put_support: merged.es_put_support ?? null,
      vix_gex_net: merged.vix_gex_net ?? null,
      vix_call_resist: merged.vix_call_resist ?? null,
      vix_hvl: merged.vix_hvl ?? null,
      vvix,
      skew,
      regime: merged.regime ?? null,
      day_bias: merged.day_bias ?? null,
      recommended_instrument: merged.recommended_instrument ?? null,
      analysis_text: merged.analysis_text ?? null,
      setup_a: merged.setup_a ?? null,
      setup_b: merged.setup_b ?? null,
      skip_day: merged.skip_day ?? false,
      image_urls: imageUrls,
      updated_at: new Date().toISOString(),
    };

    const { error: dbError } = await supabase
      .from("trading_sessions")
      .upsert(sessionData, { onConflict: "date" });

    if (dbError) {
      throw new Error(`DB error: ${dbError.message}`);
    }

    return NextResponse.json({ success: true, date });
  } catch (err) {
    console.error("[upload] error:", err);
    const msg = err instanceof Error ? err.message : "Error interno";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
