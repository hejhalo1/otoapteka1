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

function pin(color: string) {
  return L.divIcon({
    className: "",
    html: `<div style="transform:translate(-50%,-100%)"><svg width="30" height="40" viewBox="0 0 30 40" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M15 0C6.7 0 0 6.7 0 15c0 10 15 25 15 25s15-15 15-25C30 6.7 23.3 0 15 0z" fill="${color}"/><circle cx="15" cy="15" r="6" fill="white"/></svg></div>`,
    iconSize: [30, 40],
    iconAnchor: [0, 0],
  });
}

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

      {pickMarker && <Marker position={[pickMarker.lat, pickMarker.lng]} icon={pin("#8b7cf6")} />}

      {markers.map((m, i) => (
        <Marker
          key={m.slug ?? `${m.lat}-${m.lng}-${i}`}
          position={[m.lat, m.lng]}
          icon={pin(m.highlight ? "#0f2a47" : "#0fa3a3")}
        >
          <Popup>
            <div className="min-w-40">
              <p className="font-semibold text-ink">{m.name}</p>
              {m.slug && (
                <Link href={`/apteka/${m.slug}`} className="text-teal underline">
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
