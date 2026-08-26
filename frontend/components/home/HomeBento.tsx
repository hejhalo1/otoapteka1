"use client";

import { useEffect, useState } from "react";
import { Activity, Clock, Megaphone } from "lucide-react";
import { fetchPharmacyCount } from "@/lib/api";

// Bento „co robi serwis" — kolorowy układ pod stronę (granat/niebieski/teal).
// Karty z tłem ze zlanego obrazu (background_img.png / sledzenie.png) mieszają obraz
// z gradientem (mix-blend). Karta „śledzimy…" pokazuje realną liczbę aptek z bazy.

export function HomeBento() {
  const [count, setCount] = useState<number | null>(null);

  useEffect(() => {
    const ctrl = new AbortController();
    fetchPharmacyCount(ctrl.signal)
      .then(setCount)
      .catch(() => setCount(null));
    return () => ctrl.abort();
  }, []);

  const countLabel = count != null ? new Intl.NumberFormat("pl-PL").format(count) : "…";

  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 md:auto-rows-[minmax(150px,1fr)] md:grid-cols-3">
      {/* Karta główna (2×2) — tło ze zlanego obrazu + gradient */}
      <div
        className="card-hover group relative flex flex-col justify-end overflow-hidden rounded-3xl p-7 text-white sm:col-span-2 sm:row-span-2 md:col-span-2 md:row-span-2"
        style={{ backgroundImage: "linear-gradient(135deg,#2b6fd6 0%,#0b4f9e 52%,#0b3a72 100%)" }}
      >
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0 bg-cover bg-center opacity-40 mix-blend-overlay transition-transform duration-700 group-hover:scale-105"
          style={{ backgroundImage: "url('/background_img.png')" }}
        />
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0"
          style={{ background: "linear-gradient(to top, rgba(0,0,0,0.55) 0%, rgba(0,0,0,0) 60%)" }}
        />
        <div
          aria-hidden
          className="pointer-events-none absolute -right-12 -top-12 h-48 w-48 rounded-full bg-white/20 blur-3xl"
        />
        <div className="relative z-10 space-y-3">
          <span className="inline-flex items-center gap-2 rounded-full bg-white/20 px-3 py-1 text-xs font-semibold backdrop-blur-sm">
            <span className="h-2 w-2 animate-pulse rounded-full bg-emerald-300" />
            Dane z rejestru CeZ
          </span>
          <h3 className="text-2xl font-bold leading-tight tracking-tight sm:text-3xl">
            Najbliższa czynna apteka w kilka sekund
          </h3>
          <p className="max-w-md text-sm text-white/90 sm:text-base">
            Podaj lokalizację albo miasto — pokażemy dystans oraz czas dojścia i dojazdu do
            otwartych aptek.
          </p>
        </div>
      </div>

      {/* Dyżury — same słowa, wersaliki, każde słowo w nowej linii */}
      <div
        className="card-hover relative flex flex-col justify-start overflow-hidden rounded-3xl p-6 text-white"
        style={{ backgroundImage: "linear-gradient(135deg,#0ea5e9 0%,#0b4f9e 100%)" }}
      >
        <div
          aria-hidden
          className="pointer-events-none absolute -right-8 -top-8 h-28 w-28 rounded-full bg-white/25 blur-2xl"
        />
        <h4 className="relative z-10 text-2xl font-black uppercase leading-[1.05] tracking-tight sm:text-3xl">
          Informacje
          <br />o<br />
          dyżurach
        </h4>
      </div>

      {/* Godziny — większy font, większa ikona zegara w prawym górnym */}
      <div className="card-hover relative flex flex-col justify-end rounded-3xl border border-line bg-surface p-6">
        <span
          className="absolute right-5 top-5 grid h-14 w-14 place-items-center rounded-2xl text-white"
          style={{ backgroundImage: "linear-gradient(135deg,#0b4f9e,#22d3ee)" }}
        >
          <Clock className="h-7 w-7" aria-hidden />
        </span>
        <h4 className="max-w-[70%] text-xl font-bold leading-snug text-ink sm:text-2xl">
          Aktualne godziny otwarcia
        </h4>
      </div>

      {/* Statystyka — realna liczba aptek + tło ze zlanego obrazu (jak karta główna) */}
      <div
        className="card-hover group relative flex flex-col justify-center overflow-hidden rounded-3xl p-6 text-white"
        style={{ backgroundImage: "linear-gradient(135deg,#0891b2,#0b4f9e)" }}
      >
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0 bg-cover bg-center opacity-40 mix-blend-overlay transition-transform duration-700 group-hover:scale-105"
          style={{ backgroundImage: "url('/sledzenie.png')" }}
        />
        <div
          aria-hidden
          className="pointer-events-none absolute -bottom-10 -right-10 h-40 w-40 rounded-full bg-white/10 blur-3xl"
        />
        <span className="relative z-10 grid h-11 w-11 place-items-center rounded-2xl bg-white/20 backdrop-blur-sm">
          <Activity className="h-5 w-5" aria-hidden />
        </span>
        <div className="relative z-10 mt-4">
          <p className="text-sm text-white/85">Śledzimy</p>
          <span className="block text-4xl font-black leading-none tabular-nums">{countLabel}</span>
          <p className="mt-1 text-sm text-white/85">informacji z aptek</p>
        </div>
      </div>

      {/* Komunikaty i usługi — jeden szeroki, biały kafelek */}
      <div className="card-hover relative flex items-center gap-4 rounded-3xl border border-line bg-surface p-6 sm:col-span-2 md:col-span-2">
        <span aria-hidden className="absolute right-5 top-5 flex h-3 w-3">
          <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-sky-400 opacity-75" />
          <span className="relative inline-flex h-3 w-3 rounded-full bg-sky-500" />
        </span>
        <span className="grid h-12 w-12 shrink-0 place-items-center rounded-2xl bg-pharma-soft text-pharma-dark">
          <Megaphone className="h-6 w-6" aria-hidden />
        </span>
        <div>
          <h4 className="text-lg font-bold text-ink">Komunikaty i usługi</h4>
          <p className="mt-1 text-sm text-muted">
            Informacje o zmianach godzin, dostępności leków i dodatkowych usługach.
          </p>
        </div>
      </div>
    </div>
  );
}
