"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { fetchPharmacies } from "@/lib/api";
import {
  CITIES,
  Coords,
  GEO_ERROR_MESSAGES,
  GeoError,
  getCurrentPosition,
} from "@/lib/geo";
import type { PharmacyCard as Card } from "@/lib/types";
import { PharmacyCard } from "./PharmacyCard";

const PER_PAGE = 20;

function isoOffset(days: number): string {
  const d = new Date();
  d.setDate(d.getDate() + days);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

function CardSkeleton() {
  return (
    <div className="rounded-2xl border bg-surface p-5 shadow-[var(--shadow-card)]">
      <div className="skeleton h-6 w-2/3 rounded" />
      <div className="skeleton mt-2 h-4 w-1/2 rounded" />
      <div className="skeleton mt-4 h-7 w-40 rounded-full" />
      <div className="skeleton mt-4 h-6 w-1/3 rounded" />
    </div>
  );
}

export function PharmacyList({ initialCoords }: { initialCoords?: Coords }) {
  const [coords, setCoords] = useState<Coords | null>(initialCoords ?? null);
  const [locating, setLocating] = useState(false);
  const [geoError, setGeoError] = useState<string | null>(null);

  const [date, setDate] = useState<string>(isoOffset(0));
  const [openNow, setOpenNow] = useState(false);

  const [items, setItems] = useState<Card[]>([]);
  const pageRef = useRef(1);
  const [total, setTotal] = useState(0);
  const [hasMore, setHasMore] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const abortRef = useRef<AbortController | null>(null);

  const today = isoOffset(0);
  const tomorrow = isoOffset(1);
  const isCustom = date !== today && date !== tomorrow;

  const load = useCallback(
    async (c: Coords, pageToLoad: number, replace: boolean) => {
      abortRef.current?.abort();
      const ctrl = new AbortController();
      abortRef.current = ctrl;
      setLoading(true);
      setError(null);
      try {
        const res = await fetchPharmacies(
          { lat: c.lat, lng: c.lng, radiusKm: 15, perPage: PER_PAGE, page: pageToLoad, date, openNow },
          ctrl.signal,
        );
        setTotal(res.pagination.total);
        setHasMore(res.pagination.hasMore);
        setItems((prev) => (replace ? res.data : [...prev, ...res.data]));
      } catch (e) {
        if ((e as Error).name !== "AbortError") setError("Nie udało się pobrać aptek. Spróbuj ponownie.");
      } finally {
        setLoading(false);
      }
    },
    [date, openNow],
  );

  // Przeładuj od strony 1 gdy zmienia się lokalizacja/dzień/filtr.
  // To prawidłowa synchronizacja z zewnętrznym systemem (API) — reguła set-state-in-effect
  // daje tu fałszywy alarm (fetch zależny od stanu wyboru użytkownika).
  useEffect(() => {
    if (!coords) return;
    pageRef.current = 1;
    // eslint-disable-next-line react-hooks/set-state-in-effect
    void load(coords, 1, true);
  }, [coords, date, openNow, load]);

  const locate = async () => {
    setLocating(true);
    setGeoError(null);
    try {
      const c = await getCurrentPosition();
      setCoords({ ...c, label: "Twoja lokalizacja" });
    } catch (err) {
      setGeoError(GEO_ERROR_MESSAGES[err as GeoError] ?? GEO_ERROR_MESSAGES.unavailable);
    } finally {
      setLocating(false);
    }
  };

  const loadMore = () => {
    if (!coords || loading) return;
    pageRef.current += 1;
    void load(coords, pageRef.current, false);
  };

  // ---- Ekran startowy (bez lokalizacji) ----
  if (!coords) {
    return (
      <div className="mx-auto max-w-xl">
        <div className="rounded-3xl border bg-surface p-6 text-center shadow-[var(--shadow-card)] sm:p-8">
          <button
            onClick={locate}
            disabled={locating}
            className="pressable w-full rounded-2xl bg-teal px-6 py-4 text-lg font-bold text-surface shadow-[var(--shadow-card)] transition-colors hover:bg-teal-dark disabled:opacity-60"
          >
            {locating ? "Ustalanie lokalizacji…" : "📍 Znajdź najbliższą aptekę"}
          </button>
          <Link
            href="/mapa"
            className="pressable mt-3 block w-full rounded-2xl border-2 border-line px-6 py-3.5 font-semibold text-ink hover:border-teal hover:text-teal"
          >
            Wybierz na mapie
          </Link>

          {geoError && (
            <p className="mt-4 rounded-xl bg-danger/10 px-4 py-3 text-sm text-danger" role="alert">
              {geoError}
            </p>
          )}

          <div className="mt-6 border-t pt-5 text-left">
            <p className="mb-2 text-sm font-medium text-muted">Albo wybierz miasto:</p>
            <div className="flex flex-wrap gap-2">
              {CITIES.map((c) => (
                <button
                  key={c.label}
                  onClick={() => setCoords(c)}
                  className="pressable rounded-full border bg-bg px-3.5 py-1.5 text-sm font-medium text-ink hover:border-teal hover:text-teal"
                >
                  {c.label}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  // ---- Lista wyników ----
  return (
    <div className="space-y-4">
      {/* Pasek kontrolny */}
      <div className="flex flex-col gap-3 rounded-2xl border bg-surface p-3 shadow-[var(--shadow-card)] sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-2 text-sm">
          <span className="text-muted">Blisko:</span>
          <span className="font-semibold text-ink">{coords.label ?? "wybrany punkt"}</span>
          <button onClick={() => setCoords(null)} className="pressable text-teal hover:underline">
            zmień
          </button>
        </div>
        <label className="pressable flex cursor-pointer items-center gap-2 text-sm font-medium text-ink">
          <input
            type="checkbox"
            checked={openNow}
            onChange={(e) => setOpenNow(e.target.checked)}
            className="h-4 w-4 accent-teal"
          />
          Tylko otwarte teraz
        </label>
      </div>

      {/* Przełącznik dnia */}
      <div className="flex flex-wrap items-center gap-2">
        {[
          { label: "Dzisiaj", value: today },
          { label: "Jutro", value: tomorrow },
        ].map((opt) => (
          <button
            key={opt.value}
            onClick={() => setDate(opt.value)}
            className={`pressable rounded-full px-4 py-2 text-sm font-semibold transition-colors ${
              date === opt.value ? "bg-ink text-surface" : "border bg-surface text-ink hover:border-teal"
            }`}
          >
            {opt.label}
          </button>
        ))}
        <label
          className={`pressable flex items-center gap-2 rounded-full px-4 py-2 text-sm font-semibold ${
            isCustom ? "bg-ink text-surface" : "border bg-surface text-ink"
          }`}
        >
          Wybierz dzień
          <input
            type="date"
            min={today}
            max={isoOffset(30)}
            value={isCustom ? date : ""}
            onChange={(e) => e.target.value && setDate(e.target.value)}
            className="bg-transparent text-inherit [color-scheme:light]"
          />
        </label>
      </div>

      {/* Wyniki */}
      {error ? (
        <div className="rounded-2xl border bg-surface p-8 text-center">
          <p className="text-danger">{error}</p>
          <button onClick={() => coords && load(coords, 1, true)} className="pressable mt-3 rounded-lg bg-teal px-4 py-2 font-semibold text-surface">
            Spróbuj ponownie
          </button>
        </div>
      ) : loading && items.length === 0 ? (
        <div className="grid gap-3">
          {Array.from({ length: 4 }).map((_, i) => (
            <CardSkeleton key={i} />
          ))}
        </div>
      ) : items.length === 0 ? (
        <div className="rounded-2xl border bg-surface p-8 text-center">
          <p className="text-lg font-semibold text-ink">Brak aptek w promieniu 15 km</p>
          <p className="mt-1 text-muted">
            Spróbuj innego punktu{openNow ? " lub wyłącz filtr „tylko otwarte”" : ""}.
          </p>
        </div>
      ) : (
        <>
          <p className="text-sm text-muted">
            Znaleziono <span className="font-semibold text-ink">{total}</span> aptek
          </p>
          <div className="grid gap-3">
            {items.map((p, i) => (
              <PharmacyCard key={p.id} pharmacy={p} index={i} />
            ))}
          </div>
          {hasMore && (
            <button
              onClick={loadMore}
              disabled={loading}
              className="pressable mx-auto block rounded-xl border-2 border-line bg-surface px-6 py-3 font-semibold text-ink hover:border-teal hover:text-teal disabled:opacity-60"
            >
              {loading ? "Wczytywanie…" : "Pokaż więcej"}
            </button>
          )}
        </>
      )}
    </div>
  );
}
