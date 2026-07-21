"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { CalendarDays, ChevronDown, LocateFixed, MapPinOff, SearchX } from "lucide-react";
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
import { SegmentedTabs } from "./ui/SegmentedTabs";
import { cn } from "@/lib/utils";

const PER_PAGE = 20;

function isoOffset(days: number): string {
  const d = new Date();
  d.setDate(d.getDate() + days);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

function CardSkeleton() {
  return (
    <div className="flex items-center gap-5 rounded-2xl border bg-surface p-4 shadow-[var(--shadow-card)] sm:px-5">
      <div className="skeleton h-12 w-12 shrink-0 rounded-2xl" />
      <div className="flex-1">
        <div className="skeleton h-5 w-1/3 rounded" />
        <div className="skeleton mt-2 h-4 w-1/2 rounded" />
      </div>
      <div className="skeleton hidden h-7 w-20 rounded sm:block" />
      <div className="skeleton hidden h-8 w-28 rounded-lg md:block" />
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
  const dateInputRef = useRef<HTMLInputElement>(null);

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

  // Ustala pozycję i rozgłasza ją (mapa hero przełącza się na prawdziwą okolicę).
  const applyCoords = useCallback((c: Coords) => {
    setCoords(c);
    window.dispatchEvent(new CustomEvent<Coords>("otoapteka:located", { detail: c }));
  }, []);

  const locate = useCallback(async () => {
    setLocating(true);
    setGeoError(null);
    try {
      const c = await getCurrentPosition();
      applyCoords({ ...c, label: "Twoja lokalizacja" });
    } catch (err) {
      setGeoError(GEO_ERROR_MESSAGES[err as GeoError] ?? GEO_ERROR_MESSAGES.unavailable);
    } finally {
      setLocating(false);
    }
  }, [applyCoords]);

  // „Moja lokalizacja” z hero/headera + wejście z flagą ?lokalizuj=1 (inne strony).
  // locate() w efekcie to inicjalizacja z zewnętrznego systemu (URL) — false-positive.
  useEffect(() => {
    window.addEventListener("otoapteka:locate", locate);
    // eslint-disable-next-line react-hooks/set-state-in-effect
    if (new URLSearchParams(window.location.search).has("lokalizuj")) void locate();
    return () => window.removeEventListener("otoapteka:locate", locate);
  }, [locate]);

  const loadMore = () => {
    if (!coords || loading) return;
    pageRef.current += 1;
    void load(coords, pageRef.current, false);
  };

  const dayTabs = (
    <div className="flex flex-wrap items-center gap-2">
      <SegmentedTabs
        value={isCustom ? "custom" : date}
        onChange={(v) => {
          if (v === "custom") dateInputRef.current?.showPicker?.();
          else setDate(v);
        }}
        options={[
          { value: today, label: "Dziś" },
          { value: tomorrow, label: "Jutro" },
          {
            value: "custom",
            label: (
              <span className="inline-flex items-center gap-1.5">
                <CalendarDays className="h-4 w-4" aria-hidden />
                {isCustom
                  ? new Intl.DateTimeFormat("pl-PL", { day: "numeric", month: "short" }).format(
                      new Date(`${date}T12:00:00`),
                    )
                  : "Kolejny dzień"}
                <ChevronDown className="h-3.5 w-3.5" aria-hidden />
              </span>
            ),
          },
        ]}
      />
      {/* Ukryty natywny date picker otwierany z taba „Kolejny dzień”. */}
      <input
        ref={dateInputRef}
        type="date"
        aria-label="Wybierz dzień"
        min={today}
        max={isoOffset(30)}
        value={isCustom ? date : ""}
        onChange={(e) => e.target.value && setDate(e.target.value)}
        className="sr-only"
        tabIndex={-1}
      />
    </div>
  );

  // ---- Ekran startowy (bez lokalizacji) ----
  if (!coords) {
    return (
      <div>
        <h2 className="text-2xl font-extrabold tracking-tight text-ink">
          Najbliższe czynne apteki
        </h2>
        <div className="mt-4 rounded-3xl border bg-surface p-6 shadow-[var(--shadow-card)] sm:p-8">
          <div className="flex flex-col items-center gap-3 text-center">
            <span className="grid h-14 w-14 place-items-center rounded-2xl bg-pharma-soft text-pharma">
              <LocateFixed className={cn("h-7 w-7", locating && "animate-spin")} aria-hidden />
            </span>
            <p className="max-w-md text-ink-soft">
              {locating
                ? "Ustalanie Twojej lokalizacji…"
                : "Udostępnij lokalizację przyciskiem powyżej albo wybierz miasto — pokażemy apteki od najbliższej."}
            </p>
          </div>

          {geoError && (
            <p className="mt-4 rounded-xl bg-danger/10 px-4 py-3 text-center text-sm font-medium text-danger" role="alert">
              {geoError}
            </p>
          )}

          <div className="mt-6 border-t pt-5">
            <p className="mb-2.5 text-sm font-semibold text-muted">Wybierz miasto:</p>
            <div className="flex flex-wrap gap-2">
              {CITIES.map((c) => (
                <button
                  key={c.label}
                  onClick={() => applyCoords(c)}
                  className="pressable rounded-full border bg-bg px-3.5 py-1.5 text-sm font-semibold text-ink-soft transition-[color,background-color,border-color,box-shadow,transform] duration-200 hover:-translate-y-0.5 hover:border-pharma hover:bg-pharma-soft hover:text-pharma-dark hover:shadow-[0_4px_10px_rgba(39,156,83,0.18)]"
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
      {/* Nagłówek sekcji + przełącznik dnia (mockup) */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-2xl font-extrabold tracking-tight text-ink">
            Najbliższe czynne apteki
          </h2>
          <p className="mt-0.5 text-sm text-muted">
            Blisko: <span className="font-semibold text-ink-soft">{coords.label ?? "wybrany punkt"}</span>
            <button
              onClick={() => setCoords(null)}
              className="pressable ml-2 font-semibold text-primary hover:underline"
            >
              zmień
            </button>
            {total > 0 && (
              <span key={total} className="animate-num-in ml-2 inline-block">
                · {total} {total === 1 ? "apteka" : total < 5 ? "apteki" : "aptek"}
              </span>
            )}
          </p>
        </div>
        {dayTabs}
      </div>

      {/* Filtr „tylko czynne” — przełącznik */}
      <label className="inline-flex cursor-pointer select-none items-center gap-2.5 text-sm font-semibold text-ink">
        <span
          className={cn(
            "relative h-6 w-11 rounded-full transition-colors duration-300",
            openNow ? "bg-pharma" : "bg-line",
          )}
        >
          <input
            type="checkbox"
            checked={openNow}
            onChange={(e) => setOpenNow(e.target.checked)}
            className="peer sr-only"
          />
          <span
            aria-hidden
            className={cn(
              "absolute top-0.5 h-5 w-5 rounded-full bg-white shadow transition-all duration-300 [transition-timing-function:var(--ease-spring)]",
              openNow ? "left-[22px]" : "left-0.5",
            )}
          />
        </span>
        Tylko czynne apteki
      </label>

      {/* Wyniki */}
      {error ? (
        <div className="rounded-2xl border bg-surface p-8 text-center shadow-[var(--shadow-card)]">
          <p className="font-medium text-danger">{error}</p>
          <button
            onClick={() => coords && load(coords, 1, true)}
            className="pressable mt-3 rounded-xl bg-primary px-5 py-2.5 font-bold text-white hover:bg-primary-dark"
          >
            Spróbuj ponownie
          </button>
        </div>
      ) : loading && items.length === 0 ? (
        <div className="grid gap-3">
          {Array.from({ length: 5 }).map((_, i) => (
            <CardSkeleton key={i} />
          ))}
        </div>
      ) : items.length === 0 ? (
        <div className="rounded-2xl border bg-surface p-10 text-center shadow-[var(--shadow-card)]">
          <span className="mx-auto grid h-14 w-14 place-items-center rounded-2xl bg-bg text-muted">
            {openNow ? <SearchX className="h-7 w-7" /> : <MapPinOff className="h-7 w-7" />}
          </span>
          <p className="mt-3 text-lg font-bold text-ink">Brak aptek w promieniu 15 km</p>
          <p className="mt-1 text-muted">
            Spróbuj innego punktu{openNow ? " lub wyłącz filtr „tylko czynne”" : ""}.
          </p>
        </div>
      ) : (
        <>
          <div className="grid gap-3">
            {items.map((p, i) => (
              <PharmacyCard key={p.id} pharmacy={p} index={i} />
            ))}
          </div>
          {hasMore && (
            <button
              onClick={loadMore}
              disabled={loading}
              className="pressable group mx-auto flex items-center gap-2 rounded-full px-6 py-3 font-bold text-ink transition-colors hover:text-pharma disabled:opacity-60"
            >
              {loading ? "Wczytywanie…" : "Zobacz wszystkie apteki w okolicy"}
              <ChevronDown className="h-4 w-4 transition-transform duration-300 group-hover:translate-y-0.5" aria-hidden />
            </button>
          )}
        </>
      )}
    </div>
  );
}
