"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Expand, Plus, Minus } from "lucide-react";
import { MapView } from "@/components/map/MapView";
import { fetchPharmacies } from "@/lib/api";
import { getCurrentPosition, type Coords } from "@/lib/geo";
import type { PharmacyCard } from "@/lib/types";

/* Uwaga: w atrybutach SVG nie działa var(--...) — kolory palety na sztywno. */
const PHARMA = "#279c53";
const PRIMARY = "#2b539e";

/** Zielony pin apteczny (jak logo) używany na dekoracyjnej mapie hero. */
function Pin({ x, y, delay, scale = 1 }: { x: number; y: number; delay: number; scale?: number }) {
  return (
    <g
      className="animate-pin-drop"
      style={{ animationDelay: `${delay}ms`, transformBox: "fill-box" }}
    >
      <g transform={`translate(${x} ${y}) scale(${scale})`}>
        <ellipse cx="0" cy="3" rx="7" ry="2.4" fill="#122c47" opacity="0.12" />
        <g transform="translate(-14 -34)">
          <path
            d="M14 0C6.3 0 0 6.2 0 13.9 0 23.2 14 34 14 34s14-10.8 14-20.1C28 6.2 21.7 0 14 0z"
            fill={PHARMA}
          />
          <rect x="11.4" y="6.6" width="5.2" height="14" rx="1.6" fill="white" />
          <rect x="7" y="11" width="14" height="5.2" rx="1.6" fill="white" />
        </g>
      </g>
    </g>
  );
}

/**
 * Dekoracyjna mapa (fallback, zanim znamy lokalizację) — czysty SVG.
 * Klik przenosi na pełną mapę /mapa, gdzie można poruszać się bez lokalizacji.
 */
function DecorativeMap() {
  return (
    <Link
      href="/mapa"
      aria-label="Otwórz pełną mapę aptek"
      className="card-hover group relative block h-full overflow-hidden rounded-3xl border bg-surface shadow-[var(--shadow-card)]"
    >
      <svg viewBox="0 0 560 420" className="h-full w-full" role="img" aria-hidden preserveAspectRatio="xMidYMid slice">
        {/* Tło mapy */}
        <rect width="560" height="420" fill="#eef1ee" />
        {/* Woda */}
        <path d="M420 0c-30 60-10 120 30 170s60 130 30 250h80V0z" fill="#d7e6f5" />
        {/* Parki */}
        <ellipse cx="120" cy="330" rx="110" ry="70" fill="#ddecd9" />
        <ellipse cx="360" cy="70" rx="80" ry="50" fill="#e2efdd" />
        {/* Bloki zabudowy */}
        {[
          [40, 60, 90, 56], [150, 40, 70, 76], [60, 150, 76, 60], [160, 140, 90, 70],
          [270, 130, 70, 56], [280, 230, 90, 60], [170, 250, 80, 50], [300, 30, 40, 60],
        ].map(([x, y, w, h], i) => (
          <rect key={i} x={x} y={y} width={w} height={h} rx="8" fill="#e5e9ee" />
        ))}
        {/* Ulice — fill="none" jest kluczowe: bez niego SVG wypełnia ścieżki na czarno */}
        <g stroke="#ffffff" fill="none" strokeLinecap="round">
          <path d="M0 120 H560" strokeWidth="14" />
          <path d="M0 226 H430 C470 226 480 260 480 300 V420" strokeWidth="18" />
          <path d="M132 0 V420" strokeWidth="14" />
          <path d="M262 0 V300 C262 330 290 340 320 340 H560" strokeWidth="12" />
          <path d="M0 330 H150" strokeWidth="10" />
        </g>
        <g stroke="#dfe5ea" fill="none" strokeWidth="4" strokeDasharray="1 14" strokeLinecap="round">
          <path d="M0 226 H430" />
          <path d="M132 0 V420" />
        </g>

        {/* Kropka lokalizacji użytkownika z pulsującą aureolą */}
        <g transform="translate(262 226)">
          <circle r="26" fill={PRIMARY} opacity="0.5" className="animate-halo" />
          <circle r="10" fill={PRIMARY} stroke="white" strokeWidth="3.5" />
        </g>

        {/* Piny aptek — staggerowany drop */}
        <Pin x={100} y={100} delay={150} />
        <Pin x={368} y={196} delay={320} scale={0.92} />
        <Pin x={198} y={320} delay={490} scale={0.88} />
        <Pin x={420} y={330} delay={640} scale={0.8} />
        <Pin x={330} y={72} delay={790} scale={0.75} />
      </svg>

      {/* Dekoracyjne kontrolki zoomu */}
      <div
        aria-hidden
        className="absolute right-4 top-1/2 flex -translate-y-1/2 flex-col overflow-hidden rounded-xl border bg-surface shadow-[var(--shadow-card)]"
      >
        <span className="grid h-9 w-9 place-items-center border-b text-ink-soft">
          <Plus className="h-4 w-4" />
        </span>
        <span className="grid h-9 w-9 place-items-center text-ink-soft">
          <Minus className="h-4 w-4" />
        </span>
      </div>

      {/* Overlay zachęty na hoverze */}
      <div className="pointer-events-none absolute inset-x-0 bottom-0 flex justify-center pb-4 opacity-0 transition-all duration-300 [transition-timing-function:var(--ease-out)] group-hover:opacity-100">
        <span className="translate-y-2 rounded-full bg-ink px-4 py-2 text-sm font-bold text-white shadow-[var(--shadow-pop)] transition-transform duration-300 group-hover:translate-y-0">
          Otwórz pełną mapę →
        </span>
      </div>
    </Link>
  );
}

/**
 * Mapa hero zintegrowana z lokalizacją:
 * - zgoda już wydana (Permissions API) → od razu prawdziwa mapa okolicy z aptekami;
 * - użytkownik kliknie „Użyj mojej lokalizacji” lub wybierze miasto → lista wysyła
 *   zdarzenie `otoapteka:located` i mapa przełącza się na prawdziwą;
 * - brak zgody / odmowa → ilustracja, której klik prowadzi na /mapa (swobodne
 *   przeglądanie bez podawania lokalizacji).
 */
export function HeroMap() {
  const [coords, setCoords] = useState<Coords | null>(null);
  const [items, setItems] = useState<PharmacyCard[]>([]);

  useEffect(() => {
    let cancelled = false;

    // Zgoda wydana wcześniej? Pokaż od razu okolicę — bez wyskakującego pytania.
    (async () => {
      try {
        const perm = await navigator.permissions?.query({ name: "geolocation" });
        if (perm?.state === "granted") {
          const c = await getCurrentPosition();
          if (!cancelled) setCoords(c);
        }
      } catch {
        /* brak Permissions API — zostaje ilustracja do czasu zdarzenia located */
      }
    })();

    const onLocated = (e: Event) => {
      const detail = (e as CustomEvent<Coords>).detail;
      if (detail) setCoords(detail);
    };
    window.addEventListener("otoapteka:located", onLocated);
    return () => {
      cancelled = true;
      window.removeEventListener("otoapteka:located", onLocated);
    };
  }, []);

  // Apteki wokół znanej pozycji — jako piny na mapie hero.
  useEffect(() => {
    if (!coords) return;
    const ctrl = new AbortController();
    fetchPharmacies({ lat: coords.lat, lng: coords.lng, radiusKm: 5, perPage: 25 }, ctrl.signal)
      .then((res) => setItems(res.data.filter((p) => p.lat != null && p.lng != null)))
      .catch(() => {
        /* mapa bez pinów to wciąż mapa */
      });
    return () => ctrl.abort();
  }, [coords]);

  if (!coords) return <DecorativeMap />;

  return (
    // isolate: z-indexy mapy i przycisku nie wychodzą ponad sticky header.
    <div className="relative isolate h-full overflow-hidden rounded-3xl border shadow-[var(--shadow-card)]">
      <MapView
        center={coords}
        zoom={14}
        pickMarker={coords}
        markers={items.map((p) => ({
          lat: p.lat as number,
          lng: p.lng as number,
          name: p.name,
          slug: p.slug,
        }))}
      />
      <Link
        href="/mapa"
        className="pressable absolute bottom-3 left-1/2 z-[1001] flex -translate-x-1/2 items-center gap-2 rounded-full bg-ink px-4 py-2 text-sm font-bold text-white shadow-[var(--shadow-pop)] transition-colors hover:bg-primary"
      >
        <Expand className="h-4 w-4" aria-hidden />
        Otwórz pełną mapę
      </Link>
    </div>
  );
}
