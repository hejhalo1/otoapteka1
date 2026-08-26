"use client";

import { ArrowRight, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

interface AnimatedCtaButtonProps {
  label: string;
  onClick?: () => void;
  loading?: boolean;
  /** Klasy bazowe kontenera: tło + kolor tekstu + ewentualny border. */
  className?: string;
  /** Kolor rozlewającej się plamy (docelowe tło po najechaniu). */
  fillClassName?: string;
  /** Kolor etykiety wjeżdżającej (czytelny na docelowym tle). */
  hoverTextClassName?: string;
}

/**
 * CTA z animacją „ink-fill": mała kropka rozlewa się na cały przycisk (zmieniając
 * tło), a etykieta wyjeżdża w prawo i wjeżdża jej wersja ze strzałką. Kolory bazowe
 * i docelowe podajesz klasami — u nas: czerwony→biały (Zlokalizuj), biały→niebieski
 * (Wybierz na mapie). Podczas ładowania: statyczny stan ze spinnerem.
 */
export function AnimatedCtaButton({
  label,
  onClick,
  loading = false,
  className,
  fillClassName = "bg-ink",
  hoverTextClassName = "text-white",
}: AnimatedCtaButtonProps) {
  if (loading) {
    return (
      <button
        type="button"
        disabled
        className={cn(
          "relative flex items-center justify-center gap-2 rounded-full px-8 py-4 text-lg font-semibold opacity-80",
          className,
        )}
      >
        <Loader2 className="h-5 w-5 animate-spin" aria-hidden />
        {label}
      </button>
    );
  }

  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "group relative cursor-pointer overflow-hidden rounded-full px-8 py-4 text-center text-lg font-semibold",
        className,
      )}
    >
      {/* Etykieta bazowa — NAD plamą (z-10), więc plama jej nie zakrywa. */}
      <span className="relative z-10 inline-block translate-x-1 transition-all duration-300 group-hover:translate-x-12 group-hover:opacity-0">
        {label}
      </span>

      {/* Etykieta hover — wjeżdża z prawej ze strzałką (nad plamą). */}
      <span
        className={cn(
          "absolute inset-0 z-20 flex translate-x-12 items-center justify-center gap-2 opacity-0 transition-all duration-300 group-hover:-translate-x-1 group-hover:opacity-100",
          hoverTextClassName,
        )}
      >
        {label}
        <ArrowRight className="h-5 w-5" aria-hidden />
      </span>

      {/* Plama — startuje jako kropka przy lewej krawędzi (z-0, POD napisem) i
          rozlewa się na cały przycisk. */}
      <span
        aria-hidden
        className={cn(
          "absolute left-[7%] top-1/2 z-0 h-2.5 w-2.5 -translate-y-1/2 scale-100 rounded-full transition-all duration-300 group-hover:left-0 group-hover:top-0 group-hover:h-full group-hover:w-full group-hover:translate-y-0 group-hover:scale-[1.8] group-hover:rounded-lg",
          fillClassName,
        )}
      />
    </button>
  );
}
