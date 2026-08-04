"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import {
  CalendarDays,
  ChevronDown,
  Footprints,
  Car,
  LocateFixed,
  MapPin,
  MapPinOff,
  Navigation,
  SearchX,
} from "lucide-react";
import { fetchPharmacies } from "@/lib/api";
import {
  CITIES,
  Coords,
  GEO_ERROR_MESSAGES,
  GeoError,
  getCurrentPosition,
} from "@/lib/geo";
import type { PharmacyCard } from "@/lib/types";
import { MapView } from "@/components/map/MapView";
import { InteractiveHoverButton } from "@/components/ui/interactive-hover-button";
import { SegmentedTabs } from "@/components/ui/SegmentedTabs";
import { PharmacyRow, type TravelMode } from "./PharmacyRow";
import { CityPostalSearch } from "./CityPostalSearch";
import { PromoGallery } from "./PromoGallery";
import { cn } from "@/lib/utils";

const PER_PAGE = 10;

function isoOffset(days: number): string {
  const d = new Date();
  d.setDate(d.getDate() + days);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

function RowSkeleton() {
  return (
    <div className="rounded-2xl border bg-surface p-4 shadow-[var(--shadow-card)]">
      <div className="flex items-center gap-5">
        <div className="skeleton h-24 w-28 shrink-0 rounded-xl" />
        <div className="flex-1">
          <div className="skeleton h-5 w-1/2 rounded" />
          <div className="skeleton mt-2 h-4 w-2/3 rounded" />
          <div className="skeleton mt-3 h-4 w-1/3 rounded" />
        </div>
        <div className="skeleton h-10 w-28 rounded" />
      </div>
    </div>
  );
}

/**
 * Główny ekran wyszukiwania. Przed podaniem lokalizacji: przyciski + input
 * miasto/kod + kafle miast + auto-przewijana galeria (znikają po wyszukaniu).
 * Po podaniu: numerowana lista aptek obok żywej mapy (numery ↔ piny).
 */
export function HomeSearch() {
  const [coords, setCoords] = useState<Coords | null>(null);
  const [locating, setLocating] = useState(false);
  const [geoError, setGeoError] = useState<string | null>(null);

  const [date, setDate] = useState<string>(isoOffset(0));
  const [openNow, setOpenNow] = useState(false);
  const [mode, setMode] = useState<TravelMode>("walk");
  const [hoveredId, setHoveredId] = useState<string | null>(null);

  const [items, setItems] = useState<PharmacyCard[]>([]);
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
        // Ignoruj odpowiedź, jeśli w międzyczasie wystartowało nowsze żądanie.
        if (abortRef.current !== ctrl) return;
        pageRef.current = pageToLoad;
        setTotal(res.pagination.total);
        setHasMore(res.pagination.hasMore);
        setItems((prev) => (replace ? res.data : [...prev, ...res.data]));
      } catch (e) {
        if ((e as Error).name !== "AbortError" && abortRef.current === ctrl) {
          setError("Nie udało się pobrać aptek. Spróbuj ponownie.");
        }
      } finally {
        // Tylko żądanie, które jest wciąż aktualne, gasi spinner (fix wyścigu z abort).
        if (abortRef.current === ctrl) setLoading(false);
      }
    },
    [date, openNow],
  );

  // Przeładuj od strony 1 gdy zmienia się lokalizacja/dzień/filtr.
  useEffect(() => {
    if (!coords) return;
    pageRef.current = 1;
    // eslint-disable-next-line react-hooks/set-state-in-effect
    void load(coords, 1, true);
  }, [coords, date, openNow, load]);

  const applyCoords = useCallback((c: Coords) => {
    setItems([]); // wyczyść stare wyniki, by mapa i lista nie mieszały dwóch zapytań
    setCoords(c);
    window.dispatchEvent(new CustomEvent<Coords>("otoapteka:located", { detail: c }));
  }, []);

  const resetLocation = () => {
    abortRef.current?.abort();
    setItems([]);
    setTotal(0);
    setHasMore(false);
    setCoords(null);
  };

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

  // Geolokalizacja z headera (event) + wejście z flagą ?lokalizuj=1 z innych stron.
  useEffect(() => {
    window.addEventListener("otoapteka:locate", locate);
    // eslint-disable-next-line react-hooks/set-state-in-effect
    if (new URLSearchParams(window.location.search).has("lokalizuj")) void locate();
    return () => window.removeEventListener("otoapteka:locate", locate);
  }, [locate]);

  const loadMore = () => {
    if (!coords || loading) return;
    void load(coords, pageRef.current + 1, false);
  };

  const markers = items
    .map((p, i) => ({ p, i }))
    .filter(({ p }) => p.lat != null && p.lng != null)
    .map(({ p, i }) => ({
      lat: p.lat as number,
      lng: p.lng as number,
      name: p.name,
      slug: p.slug,
      index: i + 1,
      active: hoveredId === p.id,
    }));

  return (
    <div>
      {/* ---- Pasek akcji ---- */}
      <div className="flex flex-col gap-3 py-5 sm:flex-row sm:flex-wrap sm:items-center">
        <InteractiveHoverButton
          onClick={locate}
          disabled={locating}
          text={locating ? "Ustalanie pozycji…" : "Znajdź najbliższą aptekę"}
          icon={<Navigation className="h-5 w-5" aria-hidden />}
          className="w-full p-3.5 text-base sm:w-auto sm:min-w-72"
        />
        <Link
          href="/mapa"
          className="pressable group flex w-full items-center justify-center gap-2 rounded-2xl border-2 border-line bg-surface p-3 text-base font-bold text-ink transition-colors hover:border-pharma hover:text-pharma sm:w-auto sm:px-6"
        >
          <MapPin
            className="h-5 w-5 transition-transform duration-300 [transition-timing-function:var(--ease-spring)] group-hover:-rotate-6 group-hover:scale-110"
            aria-hidden
          />
          Wybierz na mapie
        </Link>

        {coords && (
          <div className="sm:ms-auto">
            <DayPicker
              date={date}
              today={today}
              tomorrow={tomorrow}
              isCustom={isCustom}
              onChange={setDate}
            />
          </div>
        )}
      </div>

      {/* Input miasto + kod pocztowy — pod przyciskami */}
      <CityPostalSearch onResolved={applyCoords} />

      {geoError && (
        <p
          className="mt-4 rounded-xl bg-danger/10 px-4 py-3 text-sm font-medium text-danger"
          role="alert"
        >
          {geoError} <span className="font-bold">Możesz też wpisać miasto powyżej lub wybrać poniżej.</span>
        </p>
      )}

      {/* ============ STAN PRZED LOKALIZACJĄ: miasta + galeria ============ */}
      {!coords ? (
        <div className="mt-5">
          <div className="rounded-3xl border bg-surface p-6 shadow-[var(--shadow-card)]">
            <div className="flex flex-col items-center gap-2 text-center">
              <span className="grid h-14 w-14 place-items-center rounded-2xl bg-pharma-soft text-pharma">
                <LocateFixed className={cn("h-7 w-7", locating && "animate-spin")} aria-hidden />
              </span>
              <p className="max-w-md text-ink-soft">
                {locating
                  ? "Ustalanie Twojej lokalizacji…"
                  : "Udostępnij lokalizację, wpisz miasto lub wybierz je poniżej — pokażemy apteki od najbliższej."}
              </p>
            </div>
            <div className="mt-6 border-t pt-5">
              <p className="mb-2.5 text-sm font-semibold text-muted">Popularne miasta:</p>
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

          {/* Auto-przewijana galeria — urozmaica pusty stan, znika po wyszukaniu */}
          <PromoGallery />
        </div>
      ) : (
        /* ================= STAN WYNIKÓW: lista + mapa ================= */
        <div className="mt-5 grid items-start gap-5 lg:grid-cols-[minmax(0,1fr)_minmax(360px,42%)]">
          <div className="space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <p className="text-sm text-muted">
                Blisko:{" "}
                <span className="font-semibold text-ink-soft">{coords.label ?? "wybrany punkt"}</span>
                <button
                  onClick={resetLocation}
                  className="pressable ml-2 font-semibold text-pharma-dark hover:underline"
                >
                  zmień
                </button>
                {total > 0 && (
                  <span key={total} className="animate-num-in ml-2 inline-block">
                    · {total} {total === 1 ? "apteka" : total < 5 ? "apteki" : "aptek"}
                  </span>
                )}
              </p>
              <label className="inline-flex cursor-pointer select-none items-center gap-2 text-sm font-semibold text-ink">
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
                      "absolute top-0.5 h-5 w-5 rounded-full bg-white shadow transition-all duration-300 [transition-timing-function:var(--ease-spring)] peer-focus-visible:ring-2 peer-focus-visible:ring-primary",
                      openNow ? "left-[22px]" : "left-0.5",
                    )}
                  />
                </span>
                Tylko czynne
              </label>
            </div>

            {error ? (
              <div className="rounded-2xl border bg-surface p-8 text-center shadow-[var(--shadow-card)]">
                <p className="font-medium text-danger">{error}</p>
                <button
                  onClick={() => {
                    pageRef.current = 1;
                    void load(coords, 1, true);
                  }}
                  className="pressable mt-3 rounded-xl bg-pharma px-5 py-2.5 font-bold text-white hover:bg-pharma-dark"
                >
                  Spróbuj ponownie
                </button>
              </div>
            ) : loading && items.length === 0 ? (
              <div className="grid gap-4">
                {Array.from({ length: 4 }).map((_, i) => (
                  <RowSkeleton key={i} />
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
                <div className="grid gap-4 pl-2">
                  {items.map((p, i) => (
                    <PharmacyRow
                      key={p.id}
                      pharmacy={p}
                      index={i + 1}
                      mode={mode}
                      onHover={setHoveredId}
                    />
                  ))}
                </div>
                {hasMore && (
                  <button
                    onClick={loadMore}
                    disabled={loading}
                    className="pressable group mx-auto flex items-center gap-2 rounded-full px-6 py-3 font-bold text-ink transition-colors hover:text-pharma disabled:opacity-60"
                  >
                    {loading ? "Wczytywanie…" : "Pokaż więcej aptek"}
                    <ChevronDown
                      className="h-4 w-4 transition-transform duration-300 group-hover:translate-y-0.5"
                      aria-hidden
                    />
                  </button>
                )}
              </>
            )}
          </div>

          {/* Mapa — sticky obok listy, numerowane piny. Ukryta poniżej lg. */}
          <div className="relative isolate hidden h-[calc(100vh-11rem)] min-h-105 overflow-hidden rounded-3xl border shadow-[var(--shadow-card)] lg:sticky lg:top-20 lg:block">
            <MapView center={coords} zoom={14} pickMarker={coords} markers={markers} />

            <button
              onClick={locate}
              aria-label="Użyj mojej lokalizacji"
              title="Użyj mojej lokalizacji"
              className="pressable absolute right-3 top-3 z-[1001] grid h-10 w-10 place-items-center rounded-xl border bg-surface text-ink-soft shadow-[var(--shadow-card)] transition-colors hover:bg-pharma-soft hover:text-pharma-dark"
            >
              <Navigation className="h-4.5 w-4.5" aria-hidden />
            </button>

            {/* Tryb podróży — akcentuje metrykę na kartach */}
            <div className="absolute bottom-3 right-3 z-[1001] flex overflow-hidden rounded-xl border bg-surface shadow-[var(--shadow-card)]">
              {(
                [
                  { value: "walk", label: "Pieszo", Icon: Footprints },
                  { value: "drive", label: "Samochodem", Icon: Car },
                ] as const
              ).map(({ value, label, Icon }) => (
                <button
                  key={value}
                  onClick={() => setMode(value)}
                  aria-pressed={mode === value}
                  className={cn(
                    "flex items-center gap-1.5 px-3.5 py-2 text-sm font-bold transition-colors duration-200",
                    mode === value
                      ? "bg-pharma text-white"
                      : "text-ink-soft hover:bg-pharma-soft hover:text-pharma-dark",
                  )}
                >
                  <Icon className="h-4 w-4" aria-hidden />
                  {label}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

/**
 * Wybór dnia: Dzisiaj / Jutro + natywny input daty jako osobny chip (bez zależności
 * od showPicker, które nie działa na starszych przeglądarkach).
 */
function DayPicker({
  date,
  today,
  tomorrow,
  isCustom,
  onChange,
}: {
  date: string;
  today: string;
  tomorrow: string;
  isCustom: boolean;
  onChange: (v: string) => void;
}) {
  return (
    <div className="flex flex-wrap items-center gap-2">
      <SegmentedTabs
        value={isCustom ? "custom-hint" : date}
        onChange={(v) => v !== "custom-hint" && onChange(v)}
        options={[
          { value: today, label: "Dzisiaj" },
          { value: tomorrow, label: "Jutro" },
        ]}
      />
      <label
        className={cn(
          "pressable inline-flex cursor-pointer items-center gap-2 rounded-full border px-3.5 py-2 text-sm font-semibold transition-colors",
          isCustom ? "border-pharma bg-pharma-soft text-pharma-dark" : "bg-surface text-ink hover:border-pharma",
        )}
      >
        <CalendarDays className="h-4 w-4" aria-hidden />
        {isCustom
          ? new Intl.DateTimeFormat("pl-PL", { day: "numeric", month: "short" }).format(
              new Date(`${date}T12:00:00`),
            )
          : "Wybierz dzień"}
        <input
          type="date"
          aria-label="Wybierz dzień"
          min={today}
          max={isoOffset(30)}
          value={isCustom ? date : ""}
          onChange={(e) => e.target.value && onChange(e.target.value)}
          className="w-0 opacity-0 [color-scheme:light]"
        />
      </label>
    </div>
  );
}
