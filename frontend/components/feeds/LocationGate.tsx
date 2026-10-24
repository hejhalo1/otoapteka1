"use client";

import { useEffect, useState, type ReactNode } from "react";
import { Navigation } from "lucide-react";
import { Coords, GEO_ERROR_MESSAGES, GeoError, getCurrentPosition } from "@/lib/geo";
import { readLastLocation, saveLastLocation } from "@/lib/last-location";

/**
 * Bramka lokalizacji: treść (render-prop z `coords`) pokazujemy tylko, gdy znamy
 * lokalizację. Bez niej — prośba o udostępnienie (nie przechodzimy dalej, dopóki
 * użytkownik jej nie poda). Ostatnia lokalizacja czytana jest z pamięci (za zgodą).
 */
export function LocationGate({
  prompt,
  children,
}: {
  prompt: string;
  children: (coords: Coords) => ReactNode;
}) {
  // Lokalizacji nie znamy podczas SSR/pierwszego renderu (localStorage jest tylko na
  // kliencie) — stąd odczyt w efekcie po montażu (świadomy setState, reguła to false-positive).
  const [state, setState] = useState<{ ready: boolean; coords: Coords | null }>({
    ready: false,
    coords: null,
  });
  const [locating, setLocating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { ready, coords } = state;

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setState({ ready: true, coords: readLastLocation() });
  }, []);

  const locate = async () => {
    setLocating(true);
    setError(null);
    try {
      const c = await getCurrentPosition();
      const loc: Coords = { ...c, label: "Twoja lokalizacja" };
      saveLastLocation(loc);
      setState((s) => ({ ...s, coords: loc }));
    } catch (e) {
      setError(GEO_ERROR_MESSAGES[e as GeoError] ?? GEO_ERROR_MESSAGES.unavailable);
    } finally {
      setLocating(false);
    }
  };

  if (!ready) {
    return <div className="skeleton h-56 w-full rounded-2xl" />;
  }
  if (coords) {
    return <>{children(coords)}</>;
  }
  return (
    <div className="rounded-2xl border border-line bg-surface p-8 text-center shadow-[var(--shadow-card)] sm:p-12">
      <span className="mx-auto grid h-16 w-16 place-items-center rounded-full bg-pharma text-white">
        <Navigation className="h-8 w-8" aria-hidden />
      </span>
      <h2 className="mt-4 text-xl font-black text-ink">Udostępnij lokalizację</h2>
      <p className="mx-auto mt-1.5 max-w-md text-ink-soft">{prompt}</p>
      <button
        onClick={locate}
        disabled={locating}
        className="pressable mt-5 inline-flex items-center gap-2 rounded-md bg-pharma px-5 py-3 font-bold text-white transition-colors hover:bg-pharma-dark disabled:opacity-70"
      >
        <Navigation className="h-4.5 w-4.5" aria-hidden />
        {locating ? "Ustalanie…" : "Użyj mojej lokalizacji"}
      </button>
      {error && <p className="mt-3 text-sm font-semibold text-danger">{error}</p>}
    </div>
  );
}
