"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import {
  Coords,
  GEO_ERROR_MESSAGES,
  GeoError,
  getCurrentPosition,
} from "@/lib/geo";
import { CONSENT_EVENT } from "@/lib/consent";
import { clearLastLocation, readLastLocation, saveLastLocation } from "@/lib/last-location";
import { HomeHero } from "./HomeHero";
import { PharmacyResults } from "./PharmacyResults";

/**
 * Strona domowa: hero (lokalizacja / wpisanie miasta) + sekcja wyników (lista obok
 * mapy) pojawiająca się dopiero po ustaleniu punktu. Sam widok wyników to
 * współdzielony `PharmacyResults` (ten sam co na stronach miast). Lokalizacja może
 * być zapamiętana między wizytami (za zgodą funkcjonalną — patrz baner ciasteczek).
 */
export function HomeSearch() {
  const [coords, setCoords] = useState<Coords | null>(null);
  const [locating, setLocating] = useState(false);
  const [geoError, setGeoError] = useState<string | null>(null);

  const resultsRef = useRef<HTMLDivElement>(null);
  const scrollPendingRef = useRef(false);

  const applyCoords = useCallback((c: Coords) => {
    setCoords(c);
    window.dispatchEvent(new CustomEvent<Coords>("otoapteka:located", { detail: c }));
  }, []);

  // Punkt z „Zlokalizuj apteki” / wpisania miasta (NIE z kliknięcia mapy) → zjazd do wyników.
  const applyCoordsAndScroll = useCallback(
    (c: Coords) => {
      scrollPendingRef.current = true;
      applyCoords(c);
    },
    [applyCoords],
  );

  useEffect(() => {
    if (coords && scrollPendingRef.current) {
      scrollPendingRef.current = false;
      requestAnimationFrame(() =>
        resultsRef.current?.scrollIntoView({ behavior: "smooth", block: "start" }),
      );
    }
  }, [coords]);

  const resetLocation = () => {
    clearLastLocation(); // „zmień” = zapomnij zapisaną lokalizację
    setCoords(null);
    // Wyniki znikają (coords=null) — przewiń z powrotem do hero, żeby użytkownik
    // od razu widział przyciski lokalizacji (inaczej zostaje na pustym miejscu).
    if (typeof window !== "undefined") {
      requestAnimationFrame(() => window.scrollTo({ top: 0, behavior: "smooth" }));
    }
  };

  // Kliknięcie na mapie = wskazanie nowego punktu.
  const pickOnMap = useCallback(
    (c: { lat: number; lng: number }) => {
      applyCoords({ lat: c.lat, lng: c.lng, label: "Wskazany punkt" });
    },
    [applyCoords],
  );

  const locate = useCallback(async () => {
    setLocating(true);
    setGeoError(null);
    try {
      const c = await getCurrentPosition();
      scrollPendingRef.current = true;
      applyCoords({ ...c, label: "Twoja lokalizacja" });
    } catch (err) {
      setGeoError(GEO_ERROR_MESSAGES[err as GeoError] ?? GEO_ERROR_MESSAGES.unavailable);
    } finally {
      setLocating(false);
    }
  }, [applyCoords]);

  // Geolokalizacja z headera (event) + wejście z flagą ?lokalizuj=1.
  useEffect(() => {
    window.addEventListener("otoapteka:locate", locate);
    // eslint-disable-next-line react-hooks/set-state-in-effect
    if (new URLSearchParams(window.location.search).has("lokalizuj")) void locate();
    return () => window.removeEventListener("otoapteka:locate", locate);
  }, [locate]);

  // Odtwórz ostatnią lokalizację z pamięci (tylko przy zgodzie funkcjonalnej).
  useEffect(() => {
    const last = readLastLocation();
    // eslint-disable-next-line react-hooks/set-state-in-effect
    if (last) setCoords(last);
  }, []);

  // Zapisuj wybraną lokalizację (saveLastLocation respektuje zgodę) — także po jej
  // udzieleniu w banerze (event zgody).
  useEffect(() => {
    if (coords) saveLastLocation(coords);
    const onConsent = () => coords && saveLastLocation(coords);
    window.addEventListener(CONSENT_EVENT, onConsent);
    return () => window.removeEventListener(CONSENT_EVENT, onConsent);
  }, [coords]);

  return (
    <div>
      {/* ===== HERO (styl/animacje/layout „PulseFit”, treści i dane nasze) ===== */}
      <HomeHero
        locating={locating}
        geoError={geoError}
        onLocate={locate}
        onCity={applyCoordsAndScroll}
      />

      {/* ===== WYNIKI: lista + mapa (dopiero po ustaleniu punktu) ===== */}
      {coords && (
        <div ref={resultsRef} className="mx-auto max-w-[90rem] scroll-mt-24 px-4 pb-10 pt-6">
          <PharmacyResults
            center={coords}
            onPickPoint={pickOnMap}
            onLocate={locate}
            onReset={resetLocation}
          />
        </div>
      )}
    </div>
  );
}
