"use client";

import Link from "next/link";
import { Map as MapIcon, Navigation } from "lucide-react";
import { InteractiveHoverButton } from "@/components/ui/interactive-hover-button";

/**
 * CTA hero — „Użyj mojej lokalizacji” odpala geolokalizację w liście poniżej
 * (wspólny event z headerem) i płynnie do niej scrolluje.
 */
export function HeroCta() {
  const locate = () => {
    window.dispatchEvent(new Event("otoapteka:locate"));
    document.getElementById("apteki")?.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  return (
    <div className="flex w-full max-w-sm flex-col gap-3">
      <InteractiveHoverButton
        onClick={locate}
        text="Użyj mojej lokalizacji"
        icon={<Navigation className="h-5 w-5" aria-hidden />}
        className="w-full"
      />
      <Link
        href="/mapa"
        className="pressable group flex w-full items-center justify-center gap-2.5 rounded-2xl border-2 border-line bg-surface p-3.5 text-center font-bold text-ink transition-colors hover:border-pharma hover:text-pharma"
      >
        <MapIcon
          className="h-5 w-5 transition-transform duration-300 [transition-timing-function:var(--ease-spring)] group-hover:-rotate-6 group-hover:scale-110"
          aria-hidden
        />
        Wybierz na mapie
      </Link>
    </div>
  );
}
