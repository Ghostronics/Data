"use client";

import { useState, useRef, useCallback } from "react";
import { Upload, X, Loader, CheckCircle, AlertCircle, Image as ImageIcon, PenLine, Cpu } from "lucide-react";
import clsx from "clsx";

interface ImageItem { file: File; preview: string; base64: string; }

function fileToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve((reader.result as string).split(",")[1]);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

type Status = "idle" | "loading" | "success" | "error";
type Mode = "manual" | "auto";

const REGIMES = ["GEX-/DEX-", "GEX-/DEX+", "GEX+/DEX-", "GEX+/DEX+", "NEUTRO"];
const BIASES = ["ALCISTA", "BAJISTA", "NEUTRO", "SALTAR"];

function NumInput({ label, value, onChange, placeholder, step = "1" }: {
  label: string; value: string; onChange: (v: string) => void; placeholder?: string; step?: string;
}) {
  return (
    <div>
      <label className="block text-xs text-text-muted mb-1">{label}</label>
      <input
        type="number" step={step} value={value} onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="w-full bg-bg-secondary border border-bg-border rounded-lg px-3 py-2 text-sm text-text-primary focus:outline-none focus:border-accent-blue transition-colors mono"
      />
    </div>
  );
}

function SectionTitle({ children }: { children: React.ReactNode }) {
  return <div className="text-xs text-text-secondary uppercase tracking-widest mb-3 font-medium">{children}</div>;
}

export default function AdminPage() {
  const [mode, setMode] = useState<Mode>("manual");
  const [date, setDate] = useState(new Date().toISOString().slice(0, 10));
  const [vvix, setVvix] = useState("");
  const [skew, setSkew] = useState("");
  const [images, setImages] = useState<ImageItem[]>([]);
  const [status, setStatus] = useState<Status>("idle");
  const [message, setMessage] = useState("");
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Manual fields
  const [nqGex, setNqGex] = useState("");
  const [nqDex, setNqDex] = useState("");
  const [nqHvlAll, setNqHvlAll] = useState("");
  const [nqHvl0dte, setNqHvl0dte] = useState("");
  const [nqCallResist, setNqCallResist] = useState("");
  const [nqPutSupport, setNqPutSupport] = useState("");
  const [esGex, setEsGex] = useState("");
  const [esDex, setEsDex] = useState("");
  const [esHvlAll, setEsHvlAll] = useState("");
  const [esHvl0dte, setEsHvl0dte] = useState("");
  const [esCallResist, setEsCallResist] = useState("");
  const [esPutSupport, setEsPutSupport] = useState("");
  const [vixGexNet, setVixGexNet] = useState("");
  const [vixCallResistVal, setVixCallResistVal] = useState("");
  const [vixHvl, setVixHvl] = useState("");
  const [regime, setRegime] = useState("");
  const [dayBias, setDayBias] = useState("");
  const [recInstrument, setRecInstrument] = useState("");
  const [analysisText, setAnalysisText] = useState("");
  const [skipDay, setSkipDay] = useState(false);
  // Setup A
  const [saDir, setSaDir] = useState("LONG");
  const [saInstr, setSaInstr] = useState("MNQ");
  const [saEntry, setSaEntry] = useState("");
  const [saStop, setSaStop] = useState("");
  const [saTarget, setSaTarget] = useState("");
  const [saRR, setSaRR] = useState("");
  const [saCond, setSaCond] = useState("");
  const [saInval, setSaInval] = useState("");
  // Setup B
  const [sbDir, setSbDir] = useState("SHORT");
  const [sbInstr, setSbInstr] = useState("MNQ");
  const [sbEntry, setSbEntry] = useState("");
  const [sbStop, setSbStop] = useState("");
  const [sbTarget, setSbTarget] = useState("");
  const [sbRR, setSbRR] = useState("");
  const [sbCond, setSbCond] = useState("");
  const [sbInval, setSbInval] = useState("");

  const addFiles = useCallback(async (files: FileList | File[]) => {
    const arr = Array.from(files).filter((f) => f.type.startsWith("image/"));
    const newItems: ImageItem[] = await Promise.all(
      arr.map(async (file) => ({ file, preview: URL.createObjectURL(file), base64: await fileToBase64(file) }))
    );
    setImages((prev) => [...prev, ...newItems].slice(0, 6));
  }, []);

  const removeImage = (i: number) => {
    setImages((prev) => { URL.revokeObjectURL(prev[i].preview); return prev.filter((_, idx) => idx !== i); });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!vvix || !skew) { setMessage("Completa los campos de VVIX y SKEW."); setStatus("error"); return; }
    if (mode === "auto" && images.length === 0) { setMessage("Añade al menos una captura."); setStatus("error"); return; }

    setStatus("loading");
    setMessage("");

    const n = (v: string) => v !== "" ? parseFloat(v) : undefined;

    const overrides: Record<string, unknown> = {};
    if (nqGex) overrides.nq_gex = n(nqGex);
    if (nqDex) overrides.nq_dex = n(nqDex);
    if (nqHvlAll) overrides.nq_hvl_all = n(nqHvlAll);
    if (nqHvl0dte) overrides.nq_hvl_0dte = n(nqHvl0dte);
    if (nqCallResist) overrides.nq_call_resist = n(nqCallResist);
    if (nqPutSupport) overrides.nq_put_support = n(nqPutSupport);
    if (esGex) overrides.es_gex = n(esGex);
    if (esDex) overrides.es_dex = n(esDex);
    if (esHvlAll) overrides.es_hvl_all = n(esHvlAll);
    if (esHvl0dte) overrides.es_hvl_0dte = n(esHvl0dte);
    if (esCallResist) overrides.es_call_resist = n(esCallResist);
    if (esPutSupport) overrides.es_put_support = n(esPutSupport);
    if (vixGexNet) overrides.vix_gex_net = n(vixGexNet);
    if (vixCallResistVal) overrides.vix_call_resist = n(vixCallResistVal);
    if (vixHvl) overrides.vix_hvl = n(vixHvl);
    if (regime) overrides.regime = regime;
    if (dayBias) overrides.day_bias = dayBias;
    if (recInstrument) overrides.recommended_instrument = recInstrument;
    if (analysisText) overrides.analysis_text = analysisText;
    overrides.skip_day = skipDay;

    if (saEntry) {
      overrides.setup_a = {
        direction: saDir, instrument: saInstr,
        entry_zone: saEntry, stop: saStop, target: saTarget, rr: saRR,
        conditions: saCond.split("\n").filter(Boolean),
        invalidation: saInval,
      };
    }
    if (sbEntry) {
      overrides.setup_b = {
        direction: sbDir, instrument: sbInstr,
        entry_zone: sbEntry, stop: sbStop, target: sbTarget, rr: sbRR,
        conditions: sbCond.split("\n").filter(Boolean),
        invalidation: sbInval,
      };
    }

    try {
      const res = await fetch("/api/upload", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          manual: mode === "manual",
          date,
          vvix: parseFloat(vvix),
          skew: parseFloat(skew),
          images: mode === "auto" ? images.map((i) => i.base64) : [],
          overrides,
        }),
      });

      const json = await res.json();
      if (!res.ok) throw new Error(json.error ?? "Error desconocido");
      setStatus("success");
      setMessage("✓ Sesión guardada. El dashboard se ha actualizado.");
    } catch (err) {
      setStatus("error");
      setMessage(err instanceof Error ? err.message : "Error al procesar");
    }
  };

  const inputCls = "w-full bg-bg-secondary border border-bg-border rounded-lg px-3 py-2 text-sm text-text-primary focus:outline-none focus:border-accent-blue transition-colors";
  const selectCls = inputCls + " cursor-pointer";

  return (
    <div className="max-w-2xl mx-auto">
      {/* Header */}
      <div className="flex items-center gap-3 mb-6">
        <div className="w-9 h-9 rounded-lg bg-accent-blue/10 border border-accent-blue/20 flex items-center justify-center">
          <Upload size={16} className="text-accent-blue" />
        </div>
        <div>
          <h1 className="text-base font-semibold text-text-primary">Panel de Admin</h1>
          <p className="text-xs text-text-muted">Introduce los datos del día para generar el análisis</p>
        </div>
      </div>

      {/* Mode toggle */}
      <div className="flex gap-2 mb-5">
        <button
          type="button"
          onClick={() => setMode("manual")}
          className={clsx(
            "flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all border",
            mode === "manual"
              ? "bg-accent-blue/15 border-accent-blue/40 text-accent-blue"
              : "bg-bg-card border-bg-border text-text-muted hover:text-text-secondary"
          )}
        >
          <PenLine size={14} /> Manual
        </button>
        <button
          type="button"
          onClick={() => setMode("auto")}
          className={clsx(
            "flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all border",
            mode === "auto"
              ? "bg-accent-blue/15 border-accent-blue/40 text-accent-blue"
              : "bg-bg-card border-bg-border text-text-muted hover:text-text-secondary"
          )}
        >
          <Cpu size={14} /> Auto (Claude AI)
        </button>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Date + VVIX + SKEW */}
        <div className="trading-card p-4">
          <SectionTitle>Fecha y Filtros</SectionTitle>
          <div className="grid grid-cols-3 gap-3">
            <div className="col-span-1">
              <label className="block text-xs text-text-muted mb-1">Fecha</label>
              <input type="date" value={date} onChange={(e) => setDate(e.target.value)} className={inputCls} />
            </div>
            <NumInput label="VVIX" value={vvix} onChange={setVvix} placeholder="145.0" step="0.1" />
            <NumInput label="SKEW" value={skew} onChange={setSkew} placeholder="134.0" step="0.1" />
          </div>
        </div>

        {/* MANUAL MODE FIELDS */}
        {mode === "manual" && (
          <>
            {/* NQ */}
            <div className="trading-card p-4">
              <SectionTitle>NQ — Nasdaq Futures</SectionTitle>
              <div className="grid grid-cols-2 gap-3">
                <NumInput label="GEX (M$)" value={nqGex} onChange={setNqGex} placeholder="-2.3" step="0.01" />
                <NumInput label="DEX" value={nqDex} onChange={setNqDex} placeholder="-1.1" step="0.01" />
                <NumInput label="HVL All Exp" value={nqHvlAll} onChange={setNqHvlAll} placeholder="24250" />
                <NumInput label="HVL 0DTE" value={nqHvl0dte} onChange={setNqHvl0dte} placeholder="24300" />
                <NumInput label="Call Resistance" value={nqCallResist} onChange={setNqCallResist} placeholder="24750" />
                <NumInput label="Put Support" value={nqPutSupport} onChange={setNqPutSupport} placeholder="24000" />
              </div>
            </div>

            {/* ES */}
            <div className="trading-card p-4">
              <SectionTitle>ES — S&P 500 Futures</SectionTitle>
              <div className="grid grid-cols-2 gap-3">
                <NumInput label="GEX (M$)" value={esGex} onChange={setEsGex} placeholder="-1.8" step="0.01" />
                <NumInput label="DEX" value={esDex} onChange={setEsDex} placeholder="-0.9" step="0.01" />
                <NumInput label="HVL All Exp" value={esHvlAll} onChange={setEsHvlAll} placeholder="5800" />
                <NumInput label="HVL 0DTE" value={esHvl0dte} onChange={setEsHvl0dte} placeholder="5825" />
                <NumInput label="Call Resistance" value={esCallResist} onChange={setEsCallResist} placeholder="5900" />
                <NumInput label="Put Support" value={esPutSupport} onChange={setEsPutSupport} placeholder="5700" />
              </div>
            </div>

            {/* VIX */}
            <div className="trading-card p-4">
              <SectionTitle>VIX GEX</SectionTitle>
              <div className="grid grid-cols-3 gap-3">
                <NumInput label="GEX Net" value={vixGexNet} onChange={setVixGexNet} placeholder="-0.5" step="0.01" />
                <NumInput label="Call Resist." value={vixCallResistVal} onChange={setVixCallResistVal} placeholder="20.0" step="0.1" />
                <NumInput label="HVL" value={vixHvl} onChange={setVixHvl} placeholder="17.5" step="0.1" />
              </div>
            </div>

            {/* Regime & Bias */}
            <div className="trading-card p-4">
              <SectionTitle>Régimen y Sesgo</SectionTitle>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs text-text-muted mb-1">Régimen GEX/DEX</label>
                  <select value={regime} onChange={(e) => setRegime(e.target.value)} className={selectCls}>
                    <option value="">— Seleccionar —</option>
                    {REGIMES.map((r) => <option key={r} value={r}>{r}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-xs text-text-muted mb-1">Sesgo del Día</label>
                  <select value={dayBias} onChange={(e) => setDayBias(e.target.value)} className={selectCls}>
                    <option value="">— Seleccionar —</option>
                    {BIASES.map((b) => <option key={b} value={b}>{b}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-xs text-text-muted mb-1">Instrumento</label>
                  <select value={recInstrument} onChange={(e) => setRecInstrument(e.target.value)} className={selectCls}>
                    <option value="">— Seleccionar —</option>
                    <option value="MNQ">MNQ</option>
                    <option value="MES">MES</option>
                  </select>
                </div>
                <div className="flex items-center gap-2 pt-5">
                  <input type="checkbox" id="skipDay" checked={skipDay} onChange={(e) => setSkipDay(e.target.checked)}
                    className="w-4 h-4 rounded border-bg-border bg-bg-secondary accent-accent-blue" />
                  <label htmlFor="skipDay" className="text-sm text-text-secondary cursor-pointer">Saltar día</label>
                </div>
              </div>
            </div>

            {/* Analysis */}
            <div className="trading-card p-4">
              <SectionTitle>Análisis del Día</SectionTitle>
              <textarea
                value={analysisText}
                onChange={(e) => setAnalysisText(e.target.value)}
                rows={5}
                placeholder="Escribe el análisis de la sesión..."
                className={inputCls + " resize-none"}
              />
            </div>

            {/* Setup A */}
            <div className="trading-card p-4">
              <SectionTitle>Setup A</SectionTitle>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs text-text-muted mb-1">Dirección</label>
                  <select value={saDir} onChange={(e) => setSaDir(e.target.value)} className={selectCls}>
                    <option value="LONG">LONG</option>
                    <option value="SHORT">SHORT</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs text-text-muted mb-1">Instrumento</label>
                  <select value={saInstr} onChange={(e) => setSaInstr(e.target.value)} className={selectCls}>
                    <option value="MNQ">MNQ</option>
                    <option value="MES">MES</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs text-text-muted mb-1">Zona de Entrada</label>
                  <input value={saEntry} onChange={(e) => setSaEntry(e.target.value)} placeholder="24250–24270" className={inputCls} />
                </div>
                <div>
                  <label className="block text-xs text-text-muted mb-1">Stop</label>
                  <input value={saStop} onChange={(e) => setSaStop(e.target.value)} placeholder="24200" className={inputCls} />
                </div>
                <div>
                  <label className="block text-xs text-text-muted mb-1">Target</label>
                  <input value={saTarget} onChange={(e) => setSaTarget(e.target.value)} placeholder="24450" className={inputCls} />
                </div>
                <div>
                  <label className="block text-xs text-text-muted mb-1">R:R</label>
                  <input value={saRR} onChange={(e) => setSaRR(e.target.value)} placeholder="1:3" className={inputCls} />
                </div>
              </div>
              <div className="mt-3">
                <label className="block text-xs text-text-muted mb-1">Condiciones (una por línea)</label>
                <textarea value={saCond} onChange={(e) => setSaCond(e.target.value)} rows={3}
                  placeholder="Precio rebota en HVL&#10;Vela alcista en M5..." className={inputCls + " resize-none"} />
              </div>
              <div className="mt-3">
                <label className="block text-xs text-text-muted mb-1">Invalidación</label>
                <input value={saInval} onChange={(e) => setSaInval(e.target.value)} placeholder="Cierre por debajo de 24150" className={inputCls} />
              </div>
            </div>

            {/* Setup B */}
            <div className="trading-card p-4">
              <SectionTitle>Setup B</SectionTitle>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs text-text-muted mb-1">Dirección</label>
                  <select value={sbDir} onChange={(e) => setSbDir(e.target.value)} className={selectCls}>
                    <option value="LONG">LONG</option>
                    <option value="SHORT">SHORT</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs text-text-muted mb-1">Instrumento</label>
                  <select value={sbInstr} onChange={(e) => setSbInstr(e.target.value)} className={selectCls}>
                    <option value="MNQ">MNQ</option>
                    <option value="MES">MES</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs text-text-muted mb-1">Zona de Entrada</label>
                  <input value={sbEntry} onChange={(e) => setSbEntry(e.target.value)} placeholder="24700–24720" className={inputCls} />
                </div>
                <div>
                  <label className="block text-xs text-text-muted mb-1">Stop</label>
                  <input value={sbStop} onChange={(e) => setSbStop(e.target.value)} placeholder="24770" className={inputCls} />
                </div>
                <div>
                  <label className="block text-xs text-text-muted mb-1">Target</label>
                  <input value={sbTarget} onChange={(e) => setSbTarget(e.target.value)} placeholder="24500" className={inputCls} />
                </div>
                <div>
                  <label className="block text-xs text-text-muted mb-1">R:R</label>
                  <input value={sbRR} onChange={(e) => setSbRR(e.target.value)} placeholder="1:3" className={inputCls} />
                </div>
              </div>
              <div className="mt-3">
                <label className="block text-xs text-text-muted mb-1">Condiciones (una por línea)</label>
                <textarea value={sbCond} onChange={(e) => setSbCond(e.target.value)} rows={3}
                  placeholder="Precio rechazado en Call Resistance&#10;Vela bajista en M5..." className={inputCls + " resize-none"} />
              </div>
              <div className="mt-3">
                <label className="block text-xs text-text-muted mb-1">Invalidación</label>
                <input value={sbInval} onChange={(e) => setSbInval(e.target.value)} placeholder="Cierre por encima de 24800" className={inputCls} />
              </div>
            </div>
          </>
        )}

        {/* AUTO MODE — image upload */}
        {mode === "auto" && (
          <div className="trading-card p-4">
            <SectionTitle>Capturas MenthorQ (NQ GEX, ES GEX, VIX GEX — máx 6)</SectionTitle>
            <div
              onDrop={(e) => { e.preventDefault(); addFiles(e.dataTransfer.files); }}
              onDragOver={(e) => e.preventDefault()}
              onClick={() => fileInputRef.current?.click()}
              className="border-2 border-dashed border-bg-border hover:border-accent-blue rounded-xl p-8 text-center cursor-pointer transition-colors"
            >
              <ImageIcon size={24} className="text-text-muted mx-auto mb-2" />
              <p className="text-sm text-text-secondary">
                Arrastra las capturas aquí o <span className="text-accent-blue">haz clic para seleccionar</span>
              </p>
              <p className="text-xs text-text-muted mt-1">JPG, PNG, WebP</p>
            </div>
            <input ref={fileInputRef} type="file" accept="image/*" multiple className="hidden"
              onChange={(e) => e.target.files && addFiles(e.target.files)} />
            {images.length > 0 && (
              <div className="grid grid-cols-3 gap-2 mt-3">
                {images.map((img, i) => (
                  <div key={i} className="relative group">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={img.preview} alt={`Preview ${i + 1}`}
                      className="w-full aspect-video object-cover rounded-lg border border-bg-border" />
                    <button type="button" onClick={() => removeImage(i)}
                      className="absolute top-1 right-1 w-5 h-5 rounded-full bg-bg-primary/80 border border-bg-border flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                      <X size={10} className="text-text-secondary" />
                    </button>
                  </div>
                ))}
              </div>
            )}
            <p className="text-xs text-text-muted mt-3">Requiere ANTHROPIC_API_KEY con créditos activos</p>
          </div>
        )}

        {/* Status */}
        {message && (
          <div className={clsx(
            "flex items-start gap-2 p-3 rounded-lg text-sm border",
            status === "success"
              ? "bg-gex-positive/5 border-gex-positive/20 text-gex-positive"
              : "bg-gex-negative/5 border-gex-negative/20 text-gex-negative"
          )}>
            {status === "success" ? <CheckCircle size={16} /> : <AlertCircle size={16} />}
            {message}
          </div>
        )}

        {/* Submit */}
        <button
          type="submit" disabled={status === "loading"}
          className={clsx(
            "w-full flex items-center justify-center gap-2 py-3 rounded-xl font-medium text-sm transition-all",
            status === "loading"
              ? "bg-bg-card text-text-muted cursor-not-allowed"
              : "bg-gex-positive/10 hover:bg-gex-positive/20 text-gex-positive border border-gex-positive/30"
          )}
        >
          {status === "loading" ? (
            <><Loader size={16} className="animate-spin" /> {mode === "auto" ? "Analizando con Claude..." : "Guardando..."}</>
          ) : (
            <><Upload size={16} /> {mode === "auto" ? "Generar Análisis con Claude" : "Guardar Sesión del Día"}</>
          )}
        </button>
      </form>
    </div>
  );
}
