"use client";

import { useState, useRef, useCallback } from "react";
import { Upload, X, Loader, CheckCircle, AlertCircle, Image as ImageIcon } from "lucide-react";
import clsx from "clsx";

interface ImageItem {
  file: File;
  preview: string;
  base64: string;
}

function fileToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const result = reader.result as string;
      // Strip the data:image/...;base64, prefix
      resolve(result.split(",")[1]);
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

type Status = "idle" | "loading" | "success" | "error";

export default function AdminPage() {
  const [date, setDate] = useState(new Date().toISOString().slice(0, 10));
  const [vvix, setVvix] = useState("");
  const [skew, setSkew] = useState("");
  const [images, setImages] = useState<ImageItem[]>([]);
  const [status, setStatus] = useState<Status>("idle");
  const [message, setMessage] = useState("");
  const fileInputRef = useRef<HTMLInputElement>(null);
  const dropRef = useRef<HTMLDivElement>(null);

  const addFiles = useCallback(async (files: FileList | File[]) => {
    const arr = Array.from(files).filter((f) => f.type.startsWith("image/"));
    const newItems: ImageItem[] = await Promise.all(
      arr.map(async (file) => ({
        file,
        preview: URL.createObjectURL(file),
        base64: await fileToBase64(file),
      }))
    );
    setImages((prev) => [...prev, ...newItems].slice(0, 6));
  }, []);

  const onDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      addFiles(e.dataTransfer.files);
    },
    [addFiles]
  );

  const removeImage = (i: number) => {
    setImages((prev) => {
      URL.revokeObjectURL(prev[i].preview);
      return prev.filter((_, idx) => idx !== i);
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!vvix || !skew) {
      setMessage("Completa los campos de VVIX y SKEW.");
      setStatus("error");
      return;
    }
    if (images.length === 0) {
      setMessage("Añade al menos una captura de MenthorQ.");
      setStatus("error");
      return;
    }

    setStatus("loading");
    setMessage("");

    try {
      const res = await fetch("/api/upload", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          date,
          vvix: parseFloat(vvix),
          skew: parseFloat(skew),
          images: images.map((i) => i.base64),
        }),
      });

      const json = await res.json();

      if (!res.ok) {
        throw new Error(json.error ?? "Error desconocido");
      }

      setStatus("success");
      setMessage("✓ Análisis completado. El dashboard se ha actualizado.");
    } catch (err) {
      setStatus("error");
      setMessage(err instanceof Error ? err.message : "Error al procesar");
    }
  };

  return (
    <div className="max-w-2xl mx-auto">
      {/* Header */}
      <div className="flex items-center gap-3 mb-6">
        <div className="w-9 h-9 rounded-lg bg-accent-blue/10 border border-accent-blue/20 flex items-center justify-center">
          <Upload size={16} className="text-accent-blue" />
        </div>
        <div>
          <h1 className="text-base font-semibold text-text-primary">Panel de Admin</h1>
          <p className="text-xs text-text-muted">Sube las capturas de MenthorQ para generar el análisis del día</p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-5">
        {/* Date */}
        <div className="trading-card p-4">
          <div>
            <label className="block text-xs text-text-secondary mb-1.5">
              Fecha <span className="text-gex-negative">*</span>
            </label>
            <input
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className="w-full bg-bg-secondary border border-bg-border rounded-lg px-3 py-2 text-sm text-text-primary focus:outline-none focus:border-accent-blue transition-colors"
            />
          </div>
        </div>

        {/* VVIX + SKEW */}
        <div className="trading-card p-4">
          <div className="text-xs text-text-secondary mb-3">
            Valores de TradingView <span className="text-gex-negative">*</span>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs text-text-muted mb-1">VVIX</label>
              <input
                type="number"
                value={vvix}
                onChange={(e) => setVvix(e.target.value)}
                step="0.1"
                min="0"
                max="300"
                className="w-full bg-bg-secondary border border-bg-border rounded-lg px-3 py-2 text-sm mono text-text-primary focus:outline-none focus:border-accent-blue transition-colors"
                placeholder="115.0"
              />
            </div>
            <div>
              <label className="block text-xs text-text-muted mb-1">SKEW</label>
              <input
                type="number"
                value={skew}
                onChange={(e) => setSkew(e.target.value)}
                step="0.1"
                min="0"
                max="200"
                className="w-full bg-bg-secondary border border-bg-border rounded-lg px-3 py-2 text-sm mono text-text-primary focus:outline-none focus:border-accent-blue transition-colors"
                placeholder="138.5"
              />
            </div>
          </div>
        </div>

        {/* Image upload */}
        <div className="trading-card p-4">
          <div className="text-xs text-text-secondary mb-3">
            Capturas MenthorQ{" "}
            <span className="text-text-muted">(NQ GEX, ES GEX, VIX GEX — máx 6)</span>{" "}
            <span className="text-gex-negative">*</span>
          </div>

          {/* Drop zone */}
          <div
            ref={dropRef}
            onDrop={onDrop}
            onDragOver={(e) => e.preventDefault()}
            onClick={() => fileInputRef.current?.click()}
            className={clsx(
              "border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition-colors",
              images.length > 0
                ? "border-bg-border hover:border-text-muted"
                : "border-bg-border hover:border-accent-blue"
            )}
          >
            <ImageIcon size={24} className="text-text-muted mx-auto mb-2" />
            <p className="text-sm text-text-secondary">
              Arrastra las capturas aquí o{" "}
              <span className="text-accent-blue">haz clic para seleccionar</span>
            </p>
            <p className="text-xs text-text-muted mt-1">JPG, PNG, WebP</p>
          </div>

          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            multiple
            className="hidden"
            onChange={(e) => e.target.files && addFiles(e.target.files)}
          />

          {/* Preview grid */}
          {images.length > 0 && (
            <div className="grid grid-cols-3 gap-2 mt-3">
              {images.map((img, i) => (
                <div key={i} className="relative group">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={img.preview}
                    alt={`Preview ${i + 1}`}
                    className="w-full aspect-video object-cover rounded-lg border border-bg-border"
                  />
                  <button
                    type="button"
                    onClick={() => removeImage(i)}
                    className="absolute top-1 right-1 w-5 h-5 rounded-full bg-bg-primary/80 border border-bg-border flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                  >
                    <X size={10} className="text-text-secondary" />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Status message */}
        {message && (
          <div
            className={clsx(
              "flex items-start gap-2 p-3 rounded-lg text-sm border",
              status === "success"
                ? "bg-gex-positive/5 border-gex-positive/20 text-gex-positive"
                : "bg-gex-negative/5 border-gex-negative/20 text-gex-negative"
            )}
          >
            {status === "success" ? <CheckCircle size={16} /> : <AlertCircle size={16} />}
            {message}
          </div>
        )}

        {/* Submit */}
        <button
          type="submit"
          disabled={status === "loading"}
          className={clsx(
            "w-full flex items-center justify-center gap-2 py-3 rounded-xl font-medium text-sm transition-all",
            status === "loading"
              ? "bg-bg-card text-text-muted cursor-not-allowed"
              : "bg-gex-positive/10 hover:bg-gex-positive/20 text-gex-positive border border-gex-positive/30"
          )}
        >
          {status === "loading" ? (
            <>
              <Loader size={16} className="animate-spin" />
              Analizando con Claude...
            </>
          ) : (
            <>
              <Upload size={16} />
              Generar Análisis del Día
            </>
          )}
        </button>
      </form>
    </div>
  );
}
