"use client";

import { useEffect } from "react";
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
}

export interface LeafletMapProps {
  center: { lat: number; lng: number };
  zoom?: number;
  markers?: MapMarker[];
  onPick?: (coords: { lat: number; lng: number }) => void;
  pickMarker?: { lat: number; lng: number } | null;
  className?: string;
}

const TILE_URL =
  process.env.NEXT_PUBLIC_TILE_URL ?? "https://tile.openstreetmap.org/{z}/{x}/{y}.png";

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

function ClickHandler({ onPick }: { onPick?: (c: { lat: number; lng: number }) => void }) {
  useMapEvents({
    click(e) {
      onPick?.({ lat: e.latlng.lat, lng: e.latlng.lng });
    },
  });
  return null;
}

function Recenter({ center }: { center: { lat: number; lng: number } }) {
  const map = useMap();
  useEffect(() => {
    map.setView([center.lat, center.lng]);
  }, [center.lat, center.lng, map]);
  return null;
}

export default function LeafletMap({
  center,
  zoom = 14,
  markers = [],
  onPick,
  pickMarker,
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
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        maxZoom={19}
      />
      <Recenter center={center} />
      {onPick && <ClickHandler onPick={onPick} />}

      {pickMarker && <Marker position={[pickMarker.lat, pickMarker.lng]} icon={pickIcon} />}

      {markers.map((m, i) => (
        <Marker
          key={m.slug ?? `${m.lat}-${m.lng}-${i}`}
          position={[m.lat, m.lng]}
          icon={pin(m.highlight ? "#122c47" : "#279c53")}
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
