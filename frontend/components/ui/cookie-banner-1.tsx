"use client";

import { useEffect, useRef, useState } from "react";
import { Check, ChevronDown, ChevronUp, Cookie, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { readConsent, writeConsent } from "@/lib/consent";
import { clearLastLocation } from "@/lib/last-location";

/**
 * Baner zgody na ciasteczka (wygląd wg promptu, pod naszą stronę): kompaktowy panel
 * w prawym dolnym rogu z rozwijanymi preferencjami. Kategorie: niezbędne (zawsze) +
 * funkcjonalne (zapamiętanie lokalizacji). Zgoda funkcjonalna włącza zapisywanie
 * ostatniej lokalizacji między wizytami.
 */
export function CookieConsent() {
  const [render, setRender] = useState(false);
  const [visible, setVisible] = useState(false);
  const [showPrefs, setShowPrefs] = useState(false);
  const [functional, setFunctional] = useState(true);

  const prefsRef = useRef<HTMLDivElement | null>(null);
  const [prefsHeight, setPrefsHeight] = useState(0);

  useEffect(() => {
    if (!readConsent().decided) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setRender(true);
      requestAnimationFrame(() => setVisible(true));
    }
  }, []);

  useEffect(() => {
    setPrefsHeight(showPrefs && prefsRef.current ? prefsRef.current.scrollHeight : 0);
  }, [showPrefs, functional]);

  const close = () => {
    setVisible(false);
    setTimeout(() => setRender(false), 300);
  };

  const acceptAll = () => {
    writeConsent(true);
    close();
  };
  const rejectNonEssential = () => {
    writeConsent(false);
    clearLastLocation();
    close();
  };
  const savePrefs = () => {
    writeConsent(functional);
    if (!functional) clearLastLocation();
    close();
  };

  if (!render) return null;

  return (
    <div
      role="dialog"
      aria-live="polite"
      aria-label="Zgoda na ciasteczka"
      className="fixed bottom-4 right-4 z-[1000] w-90 max-w-[calc(100vw-2rem)] md:bottom-6 md:right-6"
    >
      <div
        className={cn(
          "relative flex flex-col gap-3 rounded-2xl border border-line bg-surface/95 p-4 text-ink shadow-[var(--shadow-lift)] backdrop-blur transition-all duration-300 ease-out",
          visible ? "translate-y-0 opacity-100" : "pointer-events-none translate-y-8 opacity-0",
        )}
      >
        <div className="flex items-center gap-3">
          <span className="inline-flex h-9 w-9 items-center justify-center rounded-lg bg-pharma-soft text-pharma ring-1 ring-primary/20">
            <Cookie className="h-5 w-5" aria-hidden />
          </span>
          <h2 className="text-sm font-bold leading-5 text-ink">Ciasteczka na otoapteka.pl</h2>
          <button
            type="button"
            onClick={rejectNonEssential}
            aria-label="Zamknij — tylko niezbędne"
            className="pressable ml-auto inline-flex h-8 w-8 items-center justify-center rounded-md text-muted transition-colors hover:bg-bg"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <p className="text-xs leading-5 text-muted">
          Używamy ciasteczek, aby zapamiętać Twoją lokalizację i ustawienia — dzięki temu nie
          musisz podawać ich przy każdej wizycie. Więcej w{" "}
          <a
            href="/polityka-prywatnosci"
            className="font-semibold text-pharma-dark underline underline-offset-2 hover:text-primary"
          >
            Polityce prywatności
          </a>
          .
        </p>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setShowPrefs((v) => !v)}
            aria-expanded={showPrefs}
            aria-controls="cookie-prefs"
            className="pressable inline-flex items-center gap-1 rounded-lg border border-line bg-bg px-3 py-1.5 text-xs font-bold text-ink-soft transition-colors hover:border-pharma"
          >
            Dostosuj
            {showPrefs ? <ChevronUp className="h-3.5 w-3.5" /> : <ChevronDown className="h-3.5 w-3.5" />}
          </button>
          <button
            type="button"
            onClick={rejectNonEssential}
            className="pressable rounded-lg border border-line bg-surface px-3 py-1.5 text-xs font-bold text-ink-soft transition-colors hover:border-pharma"
          >
            Tylko niezbędne
          </button>
          <button
            type="button"
            onClick={acceptAll}
            className="pressable ml-auto rounded-lg bg-pharma px-3.5 py-1.5 text-xs font-bold text-white transition-colors hover:bg-pharma-dark"
          >
            Akceptuję
          </button>
        </div>

        <div
          id="cookie-prefs"
          ref={prefsRef}
          style={{ height: prefsHeight ? `${prefsHeight}px` : 0 }}
          className="overflow-hidden transition-[height] duration-300 ease-out"
        >
          {showPrefs && (
            <div className="mt-1 flex flex-col gap-2">
              <PrefRow
                title="Niezbędne"
                desc="Wymagane do działania serwisu (bezpieczeństwo, podstawy). Zawsze aktywne."
                checked
                locked
              />
              <PrefRow
                title="Funkcjonalne"
                desc="Zapamiętują Twoją lokalizację i ustawienia wyszukiwarki między wizytami."
                checked={functional}
                onToggle={() => setFunctional((v) => !v)}
              />
              <div className="mt-1 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowPrefs(false)}
                  className="pressable rounded-lg border border-line bg-bg px-2.5 py-1 text-xs font-semibold text-ink-soft transition-colors hover:border-pharma"
                >
                  Anuluj
                </button>
                <button
                  type="button"
                  onClick={savePrefs}
                  className="pressable rounded-lg bg-pharma px-2.5 py-1 text-xs font-bold text-white transition-colors hover:bg-pharma-dark"
                >
                  Zapisz ustawienia
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function PrefRow({
  title,
  desc,
  checked,
  locked,
  onToggle,
}: {
  title: string;
  desc: string;
  checked: boolean;
  locked?: boolean;
  onToggle?: () => void;
}) {
  return (
    <div className="flex items-start gap-2 rounded-lg border border-line p-2">
      <button
        type="button"
        disabled={locked}
        onClick={onToggle}
        aria-pressed={checked}
        aria-label={`${title} — przełącz`}
        className={cn(
          "mt-0.5 inline-flex h-5 w-5 shrink-0 items-center justify-center rounded border transition-colors",
          locked
            ? "cursor-not-allowed border-line bg-bg text-muted"
            : checked
              ? "border-pharma bg-pharma text-white"
              : "border-line bg-surface hover:border-pharma",
        )}
      >
        {checked && <Check className="h-3.5 w-3.5" />}
      </button>
      <div className="flex-1">
        <div className="text-xs font-bold text-ink">
          {title}{" "}
          {locked && <span className="text-[10px] font-medium text-muted">(wymagane)</span>}
        </div>
        <p className="mt-0.5 text-[11px] text-muted">{desc}</p>
      </div>
    </div>
  );
}
