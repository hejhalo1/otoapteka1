"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { ChevronRight, LocateFixed, MousePointerClick } from "lucide-react";
import { MapView } from "@/components/map/MapView";
import { fetchPharmacies } from "@/lib/api";
import { CITIES, Coords, getCurrentPosition } from "@/lib/geo";
import type { PharmacyCard } from "@/lib/types";
import { formatDistance } from "@/lib/format";
import { OpenBadge } from "@/components/OpenBadge";
import { FavoriteButton } from "@/components/FavoriteButton";

const DEFAULT_CENTER = { lat: 52.2297, lng: 21.0122 }; // Warszawa

export default function MapaPage() {
  const [center, setCenter] = useState<Coords>(DEFAULT_CENTER);
  const [point, setPoint] = useState<Coords | null>(null);
  const [items, setItems] = useState<PharmacyCard[]>([]);
  const [loading, setLoading] = useState(false);
  const abortRef = useRef<AbortController | null>(null);

  const load = useCallback(async (c: Coords) => {
    abortRef.current?.abort();
    const ctrl = new AbortController();
    abortRef.current = ctrl;
    setLoading(true);
    try {
      const res = await fetchPharmacies(
        { lat: c.lat, lng: c.lng, radiusKm: 10, perPage: 40 },
        ctrl.signal,
      );
      setItems(res.data);
    } catch {
      /* ignoruj anulowane */
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    // Prawidłowa synchronizacja z API na podstawie wskazanego punktu (false-positive reguły).
    // eslint-disable-next-line react-hooks/set-state-in-effect
    if (point) void load(point);
  }, [point, load]);

  const handlePick = (c: { lat: number; lng: number }) => {
    setPoint(c);
    setCenter(c);
  };

  const useMyLocation = async () => {
    try {
      const c = await getCurrentPosition();
      handlePick(c);
    } catch {
      /* zignoruj — użytkownik może kliknąć na mapie */
    }
  };

  const markers = items
    .filter((p) => p.lat != null && p.lng != null)
    .map((p) => ({ lat: p.lat as number, lng: p.lng as number, name: p.name, slug: p.slug }));

  return (
    <div className="mx-auto max-w-7xl px-4 py-6">
      <div className="mb-4 flex flex-wrap items-center gap-3">
        <h1 className="text-2xl font-extrabold tracking-tight text-ink">Mapa aptek</h1>
        <button
          onClick={useMyLocation}
          className="pressable inline-flex items-center gap-2 rounded-xl bg-primary px-4 py-2 text-sm font-bold text-white transition-colors hover:bg-primary-dark"
        >
          <LocateFixed className="h-4 w-4" aria-hidden /> Moja lokalizacja
        </button>
        <div className="flex flex-wrap gap-1.5">
          {CITIES.slice(0, 6).map((c) => (
            <button
              key={c.label}
              onClick={() => handlePick(c)}
              className="pressable rounded-full border bg-surface px-3 py-1.5 text-sm font-semibold text-ink-soft transition-colors hover:border-pharma hover:bg-pharma-soft hover:text-pharma-dark"
            >
              {c.label}
            </button>
          ))}
        </div>
      </div>

      <p className="mb-3 flex items-center gap-1.5 text-sm text-muted">
        <MousePointerClick className="h-4 w-4" aria-hidden />
        Kliknij na mapie, aby wskazać punkt odniesienia, albo użyj swojej lokalizacji.
      </p>

      <div className="grid gap-4 lg:grid-cols-[1fr_360px]">
        <div className="h-[60vh] overflow-hidden rounded-2xl border shadow-[var(--shadow-card)]">
          <MapView
            center={center}
            zoom={13}
            onPick={handlePick}
            pickMarker={point}
            markers={markers}
          />
        </div>

        <aside className="max-h-[60vh] space-y-2 overflow-y-auto pr-1">
          {!point ? (
            <p className="rounded-2xl border bg-surface p-6 text-center text-muted">
              Wskaż punkt na mapie, aby zobaczyć najbliższe apteki.
            </p>
          ) : loading ? (
            Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="rounded-xl border bg-surface p-3">
                <div className="skeleton h-5 w-2/3 rounded" />
                <div className="skeleton mt-2 h-4 w-1/2 rounded" />
              </div>
            ))
          ) : items.length === 0 ? (
            <p className="rounded-2xl border bg-surface p-6 text-center text-muted">
              Brak aptek w pobliżu wskazanego punktu.
            </p>
          ) : (
            items.map((p, i) => (
              <Link
                key={p.id}
                href={`/apteka/${p.slug}`}
                className="card-hover animate-card-in group block rounded-xl border bg-surface p-3 shadow-[var(--shadow-card)]"
                style={{ animationDelay: `${Math.min(i, 8) * 35}ms` }}
              >
                <div className="flex items-center justify-between gap-2">
                  <span className="truncate font-bold text-ink">{p.name}</span>
                  <span className="shrink-0 text-sm font-extrabold tabular-nums text-ink">
                    {formatDistance(p.distanceMeters)}
                  </span>
                </div>
                <p className="truncate text-sm text-muted">
                  {p.address.street}, {p.address.city}
                </p>
                <div className="mt-2 flex items-center justify-between gap-2">
                  <OpenBadge status={p.openStatus} size="sm" />
                  <span className="flex items-center gap-1">
                    <FavoriteButton slug={p.slug} className="h-8 w-8" />
                    <ChevronRight className="chev h-4 w-4 text-muted" aria-hidden />
                  </span>
                </div>
              </Link>
            ))
          )}
        </aside>
      </div>
    </div>
  );
}
