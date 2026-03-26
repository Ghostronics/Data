"use client";

import { useState } from "react";
import { ChevronDown, ChevronUp, FileText } from "lucide-react";

export default function AnalysisCard({ text }: { text: string | null }) {
  const [expanded, setExpanded] = useState(false);

  if (!text) {
    return (
      <div className="trading-card p-5 flex items-center gap-3">
        <FileText size={16} className="text-text-muted" />
        <span className="text-text-muted text-sm">Sin análisis</span>
      </div>
    );
  }

  const lines = text.split("\n");
  const preview = lines.slice(0, 6).join("\n");
  const hasMore = lines.length > 6;

  return (
    <div className="trading-card p-5">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <FileText size={14} className="text-accent-blue" />
          <span className="text-xs uppercase tracking-widest text-text-secondary">
            Análisis del Día
          </span>
        </div>
        {hasMore && (
          <button
            onClick={() => setExpanded((v) => !v)}
            className="flex items-center gap-1 text-xs text-text-secondary hover:text-text-primary transition-colors"
          >
            {expanded ? (
              <>
                Colapsar <ChevronUp size={12} />
              </>
            ) : (
              <>
                Ver completo <ChevronDown size={12} />
              </>
            )}
          </button>
        )}
      </div>

      <div className="text-sm text-text-secondary leading-relaxed whitespace-pre-wrap">
        {expanded || !hasMore ? text : preview + (hasMore ? "\n..." : "")}
      </div>
    </div>
  );
}
