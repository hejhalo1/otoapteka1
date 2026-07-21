"use client";

import { useEffect, useState } from "react";
import { cn } from "@/lib/utils";

type Scale = "" | "lg" | "xl";
const KEY = "otoapteka:fs";

/**
 * Przełącznik rozmiaru tekstu (A A A) — cała strona skaluje się przez rem.
 * Wybór trzymany w localStorage; anti-FOUC robi inline skrypt w layoucie,
 * więc atrybut na <html> jest ustawiony zanim ten komponent się zamontuje.
 */
export function FontScale() {
  const [scale, setScale] = useState<Scale>("");

  useEffect(() => {
    // Synchronizacja stanu przycisków z atrybutem ustawionym przed hydratacją
    // (zewnętrzny system: DOM/localStorage) — false-positive reguły.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setScale((document.documentElement.getAttribute("data-fs") as Scale) ?? "");
  }, []);

  const apply = (s: Scale) => {
    setScale(s);
    if (s) document.documentElement.setAttribute("data-fs", s);
    else document.documentElement.removeAttribute("data-fs");
    try {
      window.localStorage.setItem(KEY, s);
    } catch {
      /* prywatny tryb — trudno */
    }
  };

  const options: { s: Scale; label: string; cls: string }[] = [
    { s: "", label: "Standardowy rozmiar tekstu", cls: "text-xs" },
    { s: "lg", label: "Większy tekst", cls: "text-sm" },
    { s: "xl", label: "Największy tekst", cls: "text-base" },
  ];

  return (
    <div
      className="hidden items-center gap-0.5 rounded-full border bg-surface p-1 md:flex"
      role="group"
      aria-label="Rozmiar tekstu"
    >
      {options.map((o) => (
        <button
          key={o.label}
          onClick={() => apply(o.s)}
          aria-label={o.label}
          aria-pressed={scale === o.s}
          className={cn(
            "pressable grid h-7 w-7 place-items-center rounded-full font-bold leading-none transition-colors",
            o.cls,
            scale === o.s ? "bg-ink text-white" : "text-ink-soft hover:bg-bg",
          )}
        >
          A
        </button>
      ))}
    </div>
  );
}
