import { useEffect, useState } from "react";
import { fetchRoute } from "./api";
import { haversineM } from "./geo";
import type { Route, RouteMode } from "./types";

/** Do tej odległości (w linii prostej) wyznaczamy trasę pieszą, dalej — samochodową. */
const WALK_MAX_M = 2000;
// Krótka zwłoka: przy szybkiej zmianie punktu/listy nie odpytujemy routera o trasy,
// które i tak za chwilę by zniknęły.
const DEBOUNCE_MS = 250;

type LatLng = { lat: number; lng: number };

/**
 * Trasa from→to do narysowania na mapie (OSRM przez backend). Tryb wg odległości:
 * blisko pieszo, dalej autem. null, dopóki trasy nie ma lub nie da się jej wyznaczyć —
 * po zmianie punktów stara trasa znika od razu, nie czeka na nową.
 */
export function useRoute(from: LatLng | null | undefined, to: LatLng | null | undefined): Route | null {
  const key =
    from && to
      ? `${from.lat.toFixed(5)},${from.lng.toFixed(5)};${to.lat.toFixed(5)},${to.lng.toFixed(5)}`
      : null;
  const [state, setState] = useState<{ key: string; route: Route } | null>(null);

  useEffect(() => {
    if (!key || !from || !to) return;
    const mode: RouteMode = haversineM(from, to) <= WALK_MAX_M ? "walk" : "drive";
    const ctrl = new AbortController();
    const timer = setTimeout(() => {
      fetchRoute(from, to, mode, ctrl.signal)
        .then((route) => {
          if (route) setState({ key, route });
        })
        .catch(() => {
          /* anulowane / sieć — po prostu bez trasy */
        });
    }, DEBOUNCE_MS);
    return () => {
      clearTimeout(timer);
      ctrl.abort();
    };
    // from/to zmieniają tożsamość co render — trasę wyznacza klucz współrzędnych.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key]);

  return state?.key === key ? state.route : null;
}
