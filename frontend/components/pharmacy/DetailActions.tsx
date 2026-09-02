"use client";

import { useState } from "react";
import { Check, Printer, Share2 } from "lucide-react";

/**
 * Akcje wizytówki: „Udostępnij" (Web Share API, a gdy brak — kopiuje link) i „Drukuj".
 */
export function DetailActions({ title }: { title: string }) {
  const [copied, setCopied] = useState(false);

  const share = async () => {
    const url = typeof window !== "undefined" ? window.location.href : "";
    try {
      if (navigator.share) {
        await navigator.share({ title, url });
        return;
      }
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 1800);
    } catch {
      /* użytkownik anulował — nic nie robimy */
    }
  };

  return (
    <div className="flex items-center gap-1.5">
      <button
        type="button"
        onClick={share}
        className="pressable inline-flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-semibold text-ink-soft transition-colors hover:bg-bg hover:text-ink"
      >
        {copied ? (
          <Check className="h-4 w-4 text-open" aria-hidden />
        ) : (
          <Share2 className="h-4 w-4" aria-hidden />
        )}
        {copied ? "Skopiowano" : "Udostępnij"}
      </button>
      <button
        type="button"
        onClick={() => window.print()}
        className="pressable inline-flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-semibold text-ink-soft transition-colors hover:bg-bg hover:text-ink"
      >
        <Printer className="h-4 w-4" aria-hidden /> Drukuj
      </button>
    </div>
  );
}
