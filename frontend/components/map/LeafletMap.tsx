"use client";

import { useEffect, useRef } from "react";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import {
  MapContainer,
  Marker,
  Popup,
  TileLayer,
  useMap,
  useMapEvents,
} from "react-leaflet";
import Link from "next/link";

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

export interface LeafletMapProps {
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

// Jasny styl CartoDB Positron (rastrowy) — czysty wygląd jak wektorowy Positron,
// ale bez WebGL/workera (działa niezawodnie z Next/Turbopack). Nasze piny zostają.
const TILE_URL =
  process.env.NEXT_PUBLIC_TILE_URL ??
  "https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png";

// Pin apteczny — kropla z białym krzyżem, spójna z logo serwisu.
function pin(color: string) {
  return L.divIcon({
    className: "",
    html: `<div style="transform:translate(-50%,-100%);filter:drop-shadow(0 2px 3px rgba(18,44,71,.35))"><svg width="30" height="37" viewBox="0 0 28 34" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M14 0C6.3 0 0 6.2 0 13.9 0 23.2 14 34 14 34s14-10.8 14-20.1C28 6.2 21.7 0 14 0z" fill="${color}"/><rect x="11.4" y="6.6" width="5.2" height="14" rx="1.6" fill="white"/><rect x="7" y="11" width="14" height="5.2" rx="1.6" fill="white"/></svg></div>`,
    iconSize: [30, 37],
    iconAnchor: [0, 0],
  });
}

// Punkt odniesienia (klik/lokalizacja) — niebieska kropka z białą obwódką.
const pickIcon = L.divIcon({
  className: "",
  html: `<div style="transform:translate(-50%,-50%)"><div style="width:18px;height:18px;border-radius:50%;background:#2b539e;border:3.5px solid #fff;box-shadow:0 0 0 4px rgba(43,83,158,.25),0 2px 6px rgba(18,44,71,.35)"></div></div>`,
  iconSize: [18, 18],
  iconAnchor: [0, 0],
});

// Numerowany pin — numer koresponduje z pozycją apteki na liście wyników.
function numberedPin(index: number, active: boolean) {
  const fill = active ? "#122c47" : "#0b4f9e";
  const scale = active ? 1.18 : 1;
  return L.divIcon({
    className: "",
    html: `<div style="transform:translate(-50%,-100%) scale(${scale});transform-origin:50% 100%;filter:drop-shadow(0 2px 3px rgba(18,44,71,.35))"><svg width="34" height="42" viewBox="0 0 32 39" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M16 0C7.2 0 0 7.1 0 15.9 0 26.6 16 39 16 39s16-12.4 16-23.1C32 7.1 24.8 0 16 0z" fill="${fill}"/><text x="16" y="21.5" text-anchor="middle" font-family="Inter,system-ui,sans-serif" font-size="14" font-weight="800" fill="#fff">${index}</text></svg></div>`,
    iconSize: [34, 42],
    iconAnchor: [0, 0],
  });
}

// Gdy kontener zmienia rozmiar (np. mapa „dokuje się" i zmienia wysokość) — Leaflet
// musi przeliczyć swój rozmiar, inaczej kafle/piny lądują z przesunięciem.
function AutoResize() {
  const map = useMap();
  useEffect(() => {
    const el = map.getContainer();
    const ro = new ResizeObserver(() => map.invalidateSize({ animate: false }));
    ro.observe(el);
    return () => ro.disconnect();
  }, [map]);
  return null;
}

function ClickHandler({ onPick }: { onPick?: (c: { lat: number; lng: number }) => void }) {
  useMapEvents({
    click(e) {
      onPick?.({ lat: e.latlng.lat, lng: e.latlng.lng });
    },
  });
  return null;
}

function Recenter({
  center,
  zoom,
  fitPair,
}: {
  center: { lat: number; lng: number };
  zoom?: number;
  fitPair?: [{ lat: number; lng: number }, { lat: number; lng: number }] | null;
}) {
  const map = useMap();
  const prevZoom = useRef(zoom);
  const hadFit = useRef(false);
  const a = fitPair?.[0];
  const b = fitPair?.[1];
  useEffect(() => {
    // Hover na liście: pokaż OBA punkty (Ty + apteka). fitBounds sam liczy środek
    // i zoom tak, by zmieściły się z marginesem — koniec „losowego” punktu z heurystyki.
    if (a && b) {
      hadFit.current = true;
      map.flyToBounds(
        L.latLngBounds([
          [a.lat, a.lng],
          [b.lat, b.lng],
        ]),
        { paddingTopLeft: [40, 56], paddingBottomRight: [40, 40], maxZoom: 16, duration: 0.45 },
      );
      return;
    }
    // Powrót z hovera → płynnie wróć do widoku punktu odniesienia.
    if (hadFit.current) {
      hadFit.current = false;
      prevZoom.current = zoom;
      map.flyTo([center.lat, center.lng], zoom ?? map.getZoom(), { duration: 0.4 });
      return;
    }
    // Celowy SPADEK propa zoom (np. powrót do widoku Polski po „zmień”) stosujemy wprost;
    // w pozostałych wypadkach dociągamy zoom tylko w górę — nie cofamy przybliżenia usera.
    const reset = zoom != null && prevZoom.current != null && zoom < prevZoom.current;
    prevZoom.current = zoom;
    const target = zoom && (reset || map.getZoom() < zoom) ? zoom : map.getZoom();
    map.setView([center.lat, center.lng], target);
    // Zależymy od współrzędnych pary (a/b są nowymi obiektami co render — stąd prymitywy).
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [center.lat, center.lng, zoom, a?.lat, a?.lng, b?.lat, b?.lng, map]);
  return null;
}

export default function LeafletMap({
  center,
  zoom = 14,
  markers = [],
  onPick,
  pickMarker,
  fitPair,
  className,
}: LeafletMapProps) {
  return (
    <MapContainer
      center={[center.lat, center.lng]}
      zoom={zoom}
      scrollWheelZoom
      className={className ?? "h-full w-full"}
    >
      <TileLayer
        url={TILE_URL}
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> &copy; <a href="https://carto.com/attributions">CARTO</a>'
        subdomains="abcd"
        maxZoom={20}
        detectRetina
      />
      <Recenter center={center} zoom={zoom} fitPair={fitPair} />
      <AutoResize />
      {onPick && <ClickHandler onPick={onPick} />}

      {pickMarker && <Marker position={[pickMarker.lat, pickMarker.lng]} icon={pickIcon} />}

      {markers.map((m, i) => (
        <Marker
          key={m.slug ?? `${m.lat}-${m.lng}-${i}`}
          position={[m.lat, m.lng]}
          zIndexOffset={m.active ? 1000 : 0}
          icon={
            m.index != null
              ? numberedPin(m.index, m.active === true)
              : pin(m.highlight ? "#122c47" : "#0b4f9e")
          }
        >
          <Popup>
            <div className="min-w-40">
              <p className="font-semibold text-ink">{m.name}</p>
              {m.slug && (
                <Link href={`/apteka/${m.slug}`} className="font-semibold text-primary underline">
                  Zobacz aptekę
                </Link>
              )}
            </div>
          </Popup>
        </Marker>
      ))}
    </MapContainer>
  );
}
