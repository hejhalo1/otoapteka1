"use client";

import { useEffect, useRef } from "react";
import * as maplibregl from "maplibre-gl";
import "maplibre-gl/dist/maplibre-gl.css";
import { cn } from "@/lib/utils";

// Turbopack nie rozwiązuje wewnętrznego `import.meta.url` workera MapLibre (ładował się
// z „/" → text/html). Wskazujemy workera jawnie na plik hostowany z public/
// (maplibre-gl-worker.mjs importuje maplibre-gl-shared.mjs — oba leżą w public/).
maplibregl.setWorkerUrl("/maplibre-gl-worker.mjs");

export interface MapMarker {
  lat: number;
  lng: number;
  name: string;
  slug?: string;
  highlight?: boolean;
  /** Numer na pinie (1..N) — koresponduje z numeracją listy wyników. */
  index?: number;
  /** Pin aktywny (hover karty na liście) — większy i ciemniejszy. */
  active?: boolean;
}

export interface MapProps {
  center: { lat: number; lng: number };
  zoom?: number;
  markers?: MapMarker[];
  onPick?: (coords: { lat: number; lng: number }) => void;
  pickMarker?: { lat: number; lng: number } | null;
  /**
   * Gdy ustawione — mapa kadruje OBA punkty (np. Ty + najechana apteka) z marginesem,
   * sama dobierając środek i zoom (fitBounds). Ma pierwszeństwo przed center/zoom.
   * Wyzerowanie (null) → płynny powrót do center/zoom.
   */
  fitPair?: [{ lat: number; lng: number }, { lat: number; lng: number }] | null;
  className?: string;
}

// Styl wektorowy „Basic" (openmaptiles/maptiler-basic) podpięty pod OpenFreeMap
// (darmowe kafelki + fonty, bez klucza) — patrz public/map/basic.json.
// W public/map/ leżą też warianty: toner.json i fiord.json (łatwa podmiana).
const STYLE_URL = process.env.NEXT_PUBLIC_MAP_STYLE ?? "/map/basic.json";

function escapeHtml(s: string): string {
  return s.replace(/[&<>"']/g, (c) =>
    c === "&" ? "&amp;" : c === "<" ? "&lt;" : c === ">" ? "&gt;" : c === '"' ? "&quot;" : "&#39;",
  );
}

// Wnętrze pina (SVG) — numerowana kropla lub zwykła, w barwach serwisu.
function markerInnerHtml(m: MapMarker): string {
  if (m.index != null) {
    const fill = m.active ? "#122c47" : "#0b4f9e";
    const scale = m.active ? 1.18 : 1;
    return `<div style="transform:scale(${scale});transform-origin:50% 100%;filter:drop-shadow(0 2px 3px rgba(18,44,71,.35))"><svg width="34" height="42" viewBox="0 0 32 39" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M16 0C7.2 0 0 7.1 0 15.9 0 26.6 16 39 16 39s16-12.4 16-23.1C32 7.1 24.8 0 16 0z" fill="${fill}"/><text x="16" y="21.5" text-anchor="middle" font-family="Inter,system-ui,sans-serif" font-size="14" font-weight="800" fill="#fff">${m.index}</text></svg></div>`;
  }
  const color = m.highlight ? "#122c47" : "#0b4f9e";
  return `<div style="filter:drop-shadow(0 2px 3px rgba(18,44,71,.35))"><svg width="30" height="37" viewBox="0 0 28 34" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M14 0C6.3 0 0 6.2 0 13.9 0 23.2 14 34 14 34s14-10.8 14-20.1C28 6.2 21.7 0 14 0z" fill="${color}"/><rect x="11.4" y="6.6" width="5.2" height="14" rx="1.6" fill="white"/><rect x="7" y="11" width="14" height="5.2" rx="1.6" fill="white"/></svg></div>`;
}

function makeMarkerEl(m: MapMarker): HTMLDivElement {
  const el = document.createElement("div");
  el.style.cursor = "pointer";
  el.style.lineHeight = "0";
  el.innerHTML = markerInnerHtml(m);
  return el;
}

function makePickEl(): HTMLDivElement {
  const el = document.createElement("div");
  el.style.lineHeight = "0";
  el.innerHTML =
    '<div style="width:18px;height:18px;border-radius:50%;background:#2b539e;border:3.5px solid #fff;box-shadow:0 0 0 4px rgba(43,83,158,.25),0 2px 6px rgba(18,44,71,.35)"></div>';
  return el;
}

const markerKey = (m: MapMarker, i: number) => m.slug ?? `${m.lat},${m.lng},${i}`;

type MarkerEntry = {
  marker: maplibregl.Marker;
  el: HTMLDivElement;
  active?: boolean;
  index?: number;
  highlight?: boolean;
};

export default function MapLibreMap({
  center,
  zoom = 14,
  markers = [],
  onPick,
  pickMarker,
  fitPair,
  className,
}: MapProps) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const mapRef = useRef<maplibregl.Map | null>(null);
  const markersRef = useRef<Map<string, MarkerEntry>>(new Map());
  const pickRef = useRef<maplibregl.Marker | null>(null);

  // onPick trzymany w ref — żeby nie re-inicjalizować mapy przy zmianie handlera.
  const onPickRef = useRef(onPick);
  useEffect(() => {
    onPickRef.current = onPick;
  }, [onPick]);

  const prevZoom = useRef<number | undefined>(zoom);
  const hadFit = useRef(false);

  // ── Inicjalizacja mapy (raz) ──
  useEffect(() => {
    if (!containerRef.current) return;
    const map = new maplibregl.Map({
      container: containerRef.current,
      style: STYLE_URL,
      center: [center.lng, center.lat],
      zoom,
      attributionControl: false,
      dragRotate: false,
      pitchWithRotate: false,
    });
    map.touchZoomRotate.disableRotation();
    map.addControl(new maplibregl.NavigationControl({ showCompass: false }), "top-left");
    map.addControl(
      new maplibregl.AttributionControl({
        compact: true,
        customAttribution:
          '© <a href="https://www.openmaptiles.org/">OpenMapTiles</a> © <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
      }),
      "bottom-right",
    );
    map.on("click", (e: maplibregl.MapMouseEvent) =>
      onPickRef.current?.({ lat: e.lngLat.lat, lng: e.lngLat.lng }),
    );
    // Diagnostyka: wszelkie błędy stylu/źródła/kafelków wypisujemy jawnie w konsoli.
    map.on("error", (e) => {
      console.error("[maplibre]", e.error?.message ?? e);
    });
    mapRef.current = map;

    const markersMap = markersRef.current;
    return () => {
      markersMap.forEach((m) => m.marker.remove());
      markersMap.clear();
      pickRef.current?.remove();
      pickRef.current = null;
      map.remove();
      mapRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ── Markery aptek (diff po kluczu, bez migotania) ──
  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;
    const store = markersRef.current;
    const seen = new Set<string>();

    markers.forEach((m, i) => {
      const key = markerKey(m, i);
      seen.add(key);
      let entry = store.get(key);
      if (!entry) {
        const el = makeMarkerEl(m);
        const popup = new maplibregl.Popup({ offset: [0, -34], closeButton: true }).setHTML(
          `<div style="min-width:9rem"><p style="margin:0 0 2px;font-weight:600;color:#122c47">${escapeHtml(m.name)}</p>${m.slug ? `<a href="/apteka/${m.slug}" style="font-weight:600;color:#0b4f9e;text-decoration:underline">Zobacz aptekę</a>` : ""}</div>`,
        );
        const marker = new maplibregl.Marker({ element: el, anchor: "bottom" })
          .setLngLat([m.lng, m.lat])
          .setPopup(popup)
          .addTo(map);
        entry = { marker, el, active: m.active, index: m.index, highlight: m.highlight };
        store.set(key, entry);
      } else {
        entry.marker.setLngLat([m.lng, m.lat]);
      }
      // Odśwież wygląd tylko, gdy stan pina realnie się zmienił.
      if (entry.active !== m.active || entry.index !== m.index || entry.highlight !== m.highlight) {
        entry.el.innerHTML = markerInnerHtml(m);
        entry.active = m.active;
        entry.index = m.index;
        entry.highlight = m.highlight;
      }
      entry.el.style.zIndex = m.active ? "1000" : "";
    });

    for (const [key, entry] of store) {
      if (!seen.has(key)) {
        entry.marker.remove();
        store.delete(key);
      }
    }
  }, [markers]);

  // ── Punkt odniesienia (klik/lokalizacja) ──
  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;
    if (!pickMarker) {
      pickRef.current?.remove();
      pickRef.current = null;
      return;
    }
    if (!pickRef.current) {
      pickRef.current = new maplibregl.Marker({ element: makePickEl(), anchor: "center" })
        .setLngLat([pickMarker.lng, pickMarker.lat])
        .addTo(map);
    } else {
      pickRef.current.setLngLat([pickMarker.lng, pickMarker.lat]);
    }
  }, [pickMarker]);

  // ── Kadrowanie: fitPair (oba punkty) albo dociąganie do center/zoom ──
  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;
    const a = fitPair?.[0];
    const b = fitPair?.[1];

    if (a && b) {
      hadFit.current = true;
      const bounds = new maplibregl.LngLatBounds()
        .extend([a.lng, a.lat])
        .extend([b.lng, b.lat]);
      map.fitBounds(bounds, {
        padding: { top: 56, left: 40, right: 40, bottom: 40 },
        maxZoom: 16,
        duration: 450,
      });
      return;
    }
    if (hadFit.current) {
      hadFit.current = false;
      prevZoom.current = zoom;
      map.flyTo({ center: [center.lng, center.lat], zoom: zoom ?? map.getZoom(), duration: 400 });
      return;
    }
    // Celowy SPADEK zoomu stosujemy wprost; w innym wypadku dociągamy tylko w górę.
    const reset = zoom != null && prevZoom.current != null && zoom < prevZoom.current;
    prevZoom.current = zoom;
    const target = zoom != null && (reset || map.getZoom() < zoom) ? zoom : map.getZoom();
    map.easeTo({ center: [center.lng, center.lat], zoom: target, duration: 300 });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [center.lat, center.lng, zoom, fitPair?.[0]?.lat, fitPair?.[0]?.lng, fitPair?.[1]?.lat, fitPair?.[1]?.lng]);

  // ── Reakcja na zmianę rozmiaru kontenera (mapa „dokuje się") ──
  useEffect(() => {
    const map = mapRef.current;
    const el = containerRef.current;
    if (!map || !el) return;
    const ro = new ResizeObserver(() => map.resize());
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  return <div ref={containerRef} className={cn("h-full w-full", className)} />;
}
