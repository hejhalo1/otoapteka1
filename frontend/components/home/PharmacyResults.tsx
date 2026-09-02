"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import {
  CalendarDays,
  ChevronDown,
  Map as MapIcon,
  MapPinOff,
  MousePointerClick,
  Navigation,
  SearchX,
} from "lucide-react";
import { fetchPharmacies } from "@/lib/api";
import type { Coords } from "@/lib/geo";
import { warsawISO } from "@/lib/date";
import type { PharmacyCard, PharmacyListResponse } from "@/lib/types";
import { MapView } from "@/components/map/MapView";
import { SegmentedTabs } from "@/components/ui/SegmentedTabs";
import { Calendar } from "@/components/ui/calendar";
import { Slider } from "@/components/ui/slider-number-flow";
import { PharmacyRow } from "./PharmacyRow";
import { cn } from "@/lib/utils";

const PER_PAGE = 10;
/** Dozwolone wartości promienia (km). Slider skacze tylko po tych stopniach. */
const RADIUS_STOPS = [1, 5, 10, 15, 20, 30];
const DEFAULT_RADIUS_KM = 10;
// Widok mapy przed ustaleniem punktu — środek Polski.
const POLAND_CENTER = { lat: 52.0693, lng: 19.4803 };

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

export interface CityFilter {
  city: string;
  voivodeship: string;
}

/**
 * Lista aptek + żywa mapa (numery ↔ piny), z filtrami dnia i „tylko czynne”.
 * Używana i na stronie głównej (po ustaleniu punktu — z możliwością zmiany punktu
 * klikiem/lokalizacją), i na stronach miast (dane wstępne z SSR, filtr po mieście).
 *
 * - `center` — punkt odniesienia dystansu.
 * - `cityFilter` — ogranicza wyniki do miasta (strona SEO); wtedy większy promień.
 * - `initial` — dane z SSR (strona miasta) → lista jest w HTML od razu.
 * - `onPickPoint`/`onLocate`/`onReset` — obecne tylko na stronie głównej.
 */
export function PharmacyResults({
  center,
  cityFilter,
  initial,
  initialOpenNow = true,
  locating,
  onPickPoint,
  onLocate,
  onReset,
}: {
  /** Punkt odniesienia. Na stronie głównej przed lokalizacją: null → placeholder. */
  center: Coords | null;
  cityFilter?: CityFilter;
  initial?: PharmacyListResponse;
  /** Domyślny stan filtra „tylko czynne”. Home: true (blisko Ciebie), miasto: false (pełna baza). */
  initialOpenNow?: boolean;
  /** Trwa ustalanie lokalizacji (do etykiety przycisku w placeholderze). */
  locating?: boolean;
  onPickPoint?: (c: { lat: number; lng: number }) => void;
  onLocate?: () => void;
  onReset?: () => void;
}) {
  const [date, setDate] = useState<string>(warsawISO(0));
  const [openNow, setOpenNow] = useState(initialOpenNow);
  const [radiusKm, setRadiusKm] = useState(DEFAULT_RADIUS_KM);
  const [hoveredId, setHoveredId] = useState<string | null>(null);

  const [items, setItems] = useState<PharmacyCard[]>(initial?.data ?? []);
  const [total, setTotal] = useState(initial?.pagination.total ?? 0);
  const [hasMore, setHasMore] = useState(initial?.pagination.hasMore ?? false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const pageRef = useRef(1);
  const abortRef = useRef<AbortController | null>(null);
  // Gdy mamy dane z SSR, pomiń pierwsze automatyczne pobranie (dla stanu domyślnego).
  const skipFirst = useRef(Boolean(initial));

  const today = warsawISO(0);
  const tomorrow = warsawISO(1);
  const isCustom = date !== today && date !== tomorrow;
  const isToday = date === today;

  const cityKey = cityFilter ? `${cityFilter.voivodeship}|${cityFilter.city}` : "";

  const load = useCallback(
    async (page: number, replace: boolean) => {
      if (!center) return; // brak punktu (home przed lokalizacją) → nie pobieramy
      abortRef.current?.abort();
      const ctrl = new AbortController();
      abortRef.current = ctrl;
      setLoading(true);
      setError(null);
      try {
        const res = await fetchPharmacies(
          {
            lat: center.lat,
            lng: center.lng,
            radiusKm: cityFilter ? 50 : radiusKm,
            perPage: PER_PAGE,
            page,
            date,
            // „Tylko czynne" = otwarte TERAZ — ma sens jedynie dla DZIŚ. Dla jutra/innego
            // dnia NIE filtrujemy po „teraz" (inaczej backend liczy wg bieżącej godziny
            // na przyszły dzień → zero wyników).
            openNow: openNow && date === today,
            city: cityFilter?.city,
            voivodeship: cityFilter?.voivodeship,
          },
          ctrl.signal,
        );
        if (abortRef.current !== ctrl) return;
        pageRef.current = page;
        setTotal(res.pagination.total);
        setHasMore(res.pagination.hasMore);
        setItems((prev) => {
          if (replace) return res.data;
          // Dedup po id — chroni przed duplikatami, gdyby zbiór „czynnych” drgnął
          // między stronami (i przed zdublowanymi kluczami Reacta).
          const seen = new Set(prev.map((x) => x.id));
          return [...prev, ...res.data.filter((x) => !seen.has(x.id))];
        });
      } catch (e) {
        if ((e as Error).name !== "AbortError" && abortRef.current === ctrl) {
          setError("Nie udało się pobrać aptek. Spróbuj ponownie.");
        }
      } finally {
        if (abortRef.current === ctrl) setLoading(false);
      }
    },
    [center, date, openNow, radiusKm, cityFilter, today],
  );

  // Przeładuj od strony 1 przy zmianie punktu/dnia/filtra. Pierwsze uruchomienie
  // pomijamy, jeśli dane przyszły z SSR (uniknięcie zbędnego re-fetchu).
  useEffect(() => {
    if (skipFirst.current) {
      skipFirst.current = false;
      return;
    }
    pageRef.current = 1;
    void load(1, true);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [center?.lat, center?.lng, date, openNow, radiusKm, cityKey]);

  const loadMore = () => {
    if (loading) return;
    void load(pageRef.current + 1, false);
  };

  const markers = center
    ? items
        .map((p, i) => ({ p, i }))
        .filter(({ p }) => p.lat != null && p.lng != null)
        .map(({ p, i }) => ({
          lat: p.lat as number,
          lng: p.lng as number,
          name: p.name,
          slug: p.slug,
          index: i + 1,
          active: hoveredId === p.id,
        }))
    : [];

  const pickable = Boolean(onPickPoint);

  return (
    <div className="space-y-4">
      <h2 className="text-xl font-black uppercase tracking-wide text-ink sm:text-2xl">
        Dostępne apteki
      </h2>

      {/* Wspólny, „uziemiony" pasek wszystkich opcji (dzień, „tylko czynne", promień,
          punkt) — kwadratowe rogi, przyklejony przy scrollu, więc zawsze widoczny. */}
      <div className="sticky top-[5.25rem] z-20 rounded-md border border-line bg-surface/80 px-3 py-2.5 shadow-[var(--shadow-card)] backdrop-blur">
        <div className="flex flex-wrap items-center gap-x-4 gap-y-2">
          <DayPicker date={date} today={today} tomorrow={tomorrow} isCustom={isCustom} onChange={setDate} />
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

          {/* Promień — tylko dla wyszukiwania po punkcie. Slider skacze po stopniach (1…30 km). */}
          {!cityFilter && (
            <div className="flex items-center gap-2">
              <span className="text-sm font-semibold text-ink-soft">Promień</span>
              <Slider
                value={[Math.max(0, RADIUS_STOPS.indexOf(radiusKm))]}
                display={radiusKm}
                valueLabel="inline"
                min={0}
                max={RADIUS_STOPS.length - 1}
                step={1}
                onValueChange={(v) => setRadiusKm(RADIUS_STOPS[v[0] ?? 0] ?? DEFAULT_RADIUS_KM)}
                className="w-32"
                aria-label="Promień wyszukiwania w kilometrach"
              />
            </div>
          )}

        </div>

        {/* Kontekst punktu + licznik — osobna linia pod filtrami (nie „rozjeżdża" paska) */}
        <p className="mt-2 text-sm text-muted">
          {center ? (
            onReset ? (
              <>
                Blisko:{" "}
                <span className="font-semibold text-ink-soft">
                  {center.label ?? "wybrany punkt"}
                </span>
                <button
                  onClick={onReset}
                  className="pressable ml-2 font-semibold text-pharma-dark hover:underline"
                >
                  zmień
                </button>
              </>
            ) : (
              <span className="font-semibold text-ink-soft">Najbliżej centrum</span>
            )
          ) : (
            <span className="font-semibold text-ink-soft">
              Podaj lokalizację, aby zobaczyć najbliższe apteki
            </span>
          )}
          {total > 0 && (
            <span key={total} className="animate-num-in ml-2 inline-block">
              · {total} {total === 1 ? "apteka" : total < 5 ? "apteki" : "aptek"}
            </span>
          )}
        </p>
      </div>

      <div className="grid items-start gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(340px,38%)] lg:gap-8">
        {/* Lista aptek — bez tła i ramki; same karty na białym tle strony. */}
        <section className="min-w-0">
        {!center ? (
          <LocatePrompt onLocate={onLocate} locating={locating} />
        ) : error ? (
          <div className="rounded-2xl border bg-surface p-8 text-center shadow-[var(--shadow-card)]">
            <p className="font-medium text-danger">{error}</p>
            <button
              onClick={() => {
                pageRef.current = 1;
                void load(1, true);
              }}
              className="pressable mt-3 rounded-md bg-pharma px-5 py-2.5 font-bold text-white hover:bg-pharma-dark"
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
            <p className="mt-3 text-lg font-bold text-ink">
              {openNow ? "Brak czynnych aptek" : "Brak aptek w tym miejscu"}
            </p>
            <p className="mt-1 text-muted">
              {openNow ? "Wyłącz filtr „tylko czynne” lub zmień dzień." : "Spróbuj innego punktu."}
            </p>
          </div>
        ) : (
          <>
            <div className="grid grid-cols-1 gap-4">
              {items.map((p, i) => (
                <PharmacyRow
                  key={p.id}
                  pharmacy={p}
                  index={i + 1}
                  live={isToday}
                  onHover={setHoveredId}
                />
              ))}
            </div>
            {hasMore && (
              <button
                onClick={loadMore}
                disabled={loading}
                className="pressable group mx-auto flex items-center gap-2 rounded-md px-6 py-3 font-bold text-ink transition-colors hover:text-pharma disabled:opacity-60"
              >
                {loading ? "Wczytywanie…" : "Pokaż więcej aptek"}
                <ChevronDown
                  className="h-4 w-4 transition-transform duration-300 group-hover:translate-y-0.5"
                  aria-hidden
                />
              </button>
            )}
            {!hasMore && items.length > 0 && (
              <p className="pt-1 text-center text-sm text-muted">
                {openNow
                  ? "To wszystkie czynne apteki w tej okolicy. Wyłącz „tylko czynne”, aby zobaczyć również zamknięte."
                  : "To wszystkie apteki w tej okolicy."}
              </p>
            )}
          </>
        )}
        </section>

        {/* Mapa — bez napisu i bez niebieskiej ramki; przyklejona przy scrollu,
            tuż pod paskiem opcji. Kolumna rozciąga się na wysokość listy
            (lg:self-stretch), dzięki czemu sticky ma „drogę" i mapa śledzi w dół. */}
        <div className="hidden lg:block lg:self-stretch">
          <div
            className={cn(
              "lg:sticky lg:top-40",
              pickable && "map-pickable",
            )}
          >
            <div className="relative isolate h-[calc(100vh-13rem)] min-h-105 overflow-hidden rounded-2xl shadow-[var(--shadow-card)]">
        <MapView
          center={center ?? POLAND_CENTER}
          zoom={center ? 14 : 6}
          pickMarker={pickable && center ? center : null}
          markers={markers}
          onPick={onPickPoint}
        />

        {pickable && (
          <div className="pointer-events-none absolute left-16 top-3 z-[1001] flex items-center gap-1.5 rounded-xl border bg-surface/90 px-2.5 py-1.5 text-xs font-semibold text-ink-soft shadow-[var(--shadow-card)] backdrop-blur">
            <MousePointerClick className="h-3.5 w-3.5 text-pharma" aria-hidden />
            {center ? "Kliknij, aby zmienić punkt" : "Kliknij, aby wskazać punkt"}
          </div>
        )}

        {onLocate && (
          <button
            onClick={onLocate}
            aria-label="Użyj mojej lokalizacji"
            title="Użyj mojej lokalizacji"
            className="pressable absolute right-3 top-3 z-[1001] grid h-10 w-10 place-items-center rounded-xl border bg-surface text-ink-soft shadow-[var(--shadow-card)] transition-colors hover:bg-pharma-soft hover:text-pharma-dark"
          >
            <Navigation className="h-4.5 w-4.5" aria-hidden />
          </button>
        )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

/**
 * Placeholder w miejscu listy, gdy nie ma jeszcze lokalizacji: dwa kafle akcji
 * (podaj lokalizację LUB otwórz mapę) — zamiast aptek, bo bez punktu ich nie znamy.
 */
function LocatePrompt({
  onLocate,
  locating,
}: {
  onLocate?: () => void;
  locating?: boolean;
}) {
  return (
    <div className="flex flex-col items-center gap-5 pt-2 sm:flex-row sm:gap-8">
      <button
        onClick={onLocate}
        disabled={locating}
        className="pressable group flex w-48 flex-col items-center gap-3 rounded-xl border border-line bg-surface p-6 text-center shadow-[var(--shadow-card)] transition-colors hover:border-pharma hover:bg-pharma-soft disabled:opacity-60"
      >
        <span className="grid h-16 w-16 place-items-center rounded-full bg-pharma text-white transition-transform duration-300 group-hover:scale-105">
          <Navigation className="h-8 w-8" aria-hidden />
        </span>
        <span className="text-sm font-bold text-ink">
          {locating ? "Ustalanie…" : "Użyj mojej lokalizacji"}
        </span>
      </button>

      <span className="text-sm font-black uppercase tracking-widest text-muted">lub</span>

      <Link
        href="/mapa"
        className="pressable group flex w-48 flex-col items-center gap-3 rounded-xl border border-line bg-surface p-6 text-center shadow-[var(--shadow-card)] transition-colors hover:border-pharma hover:bg-pharma-soft"
      >
        <span className="grid h-16 w-16 place-items-center rounded-full bg-ink text-white transition-transform duration-300 group-hover:scale-105">
          <MapIcon className="h-8 w-8" aria-hidden />
        </span>
        <span className="text-sm font-bold text-ink">Otwórz mapę</span>
      </Link>
    </div>
  );
}

/**
 * Wybór dnia: Dzisiaj / Jutro + natywny input daty jako osobny chip.
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
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  // Zamykanie popovera kalendarza: klik poza + Escape.
  useEffect(() => {
    if (!open) return;
    const onDoc = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    document.addEventListener("mousedown", onDoc);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onDoc);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  const parse = (s: string) => {
    const [y, m, d] = s.split("-").map(Number);
    return new Date(y, m - 1, d);
  };
  const fmt = (d: Date) =>
    `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;

  return (
    <div className="flex items-center gap-2">
      <SegmentedTabs
        value={isCustom ? "custom-hint" : date}
        onChange={(v) => v !== "custom-hint" && onChange(v)}
        options={[
          { value: today, label: "Dzisiaj" },
          { value: tomorrow, label: "Jutro" },
        ]}
      />
      <div ref={ref} className="relative">
        <button
          type="button"
          onClick={() => setOpen((o) => !o)}
          aria-haspopup="dialog"
          aria-expanded={open}
          className={cn(
            "pressable inline-flex cursor-pointer items-center gap-2 rounded-md border px-3.5 py-2 text-sm font-semibold transition-colors",
            isCustom ? "border-pharma bg-pharma-soft text-pharma-dark" : "bg-surface text-ink hover:border-pharma",
          )}
        >
          <CalendarDays className="h-4 w-4" aria-hidden />
          {isCustom
            ? new Intl.DateTimeFormat("pl-PL", { day: "numeric", month: "short" }).format(parse(date))
            : "Wybierz dzień"}
        </button>
        {open && (
          <div className="absolute right-0 z-50 mt-2 max-sm:left-0 max-sm:right-auto">
            <Calendar
              selected={parse(date)}
              minDate={parse(today)}
              maxDate={parse(warsawISO(30))}
              onSelect={(d) => {
                onChange(fmt(d));
                setOpen(false);
              }}
            />
          </div>
        )}
      </div>
    </div>
  );
}
