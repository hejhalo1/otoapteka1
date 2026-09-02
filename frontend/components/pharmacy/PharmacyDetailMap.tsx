"use client";

import { useEffect, useState } from "react";
import { MapView } from "@/components/map/MapView";
import type { Coords } from "@/lib/geo";
import { readLastLocation } from "@/lib/last-location";
import { formatDistance } from "@/lib/format";

function haversineM(a: { lat: number; lng: number }, b: { lat: number; lng: number }): number {
  const R = 6371000;
  const dLat = ((b.lat - a.lat) * Math.PI) / 180;
  const dLng = ((b.lng - a.lng) * Math.PI) / 180;
  const h =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((a.lat * Math.PI) / 180) * Math.cos((b.lat * Math.PI) / 180) * Math.sin(dLng / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(h));
}

/**
 * Mapa apteki + (jeśli znamy ostatnią lokalizację użytkownika) dystans i czas
 * dojścia oraz kadr obejmujący oba punkty. „Pokaż trasę" otwiera nawigację.
 */
export function PharmacyDetailMap({
  lat,
  lng,
  name,
}: {
  lat: number;
  lng: number;
  name: string;
}) {
  const [user, setUser] = useState<Coords | null>(null);

  useEffect(() => {
    // localStorage tylko po stronie klienta (unikamy niezgodności SSR).
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setUser(readLastLocation());
  }, []);

  const distM = user ? haversineM({ lat, lng }, user) : null;
  const walkMin = distM != null ? Math.max(1, Math.round(distM / 80)) : null;
  const fitPair: [{ lat: number; lng: number }, { lat: number; lng: number }] | null = user
    ? [
        { lat, lng },
        { lat: user.lat, lng: user.lng },
      ]
    : null;

  return (
    <div className="relative h-64 overflow-hidden rounded-lg border border-line shadow-[var(--shadow-card)] lg:h-full lg:min-h-[300px]">
      <MapView
        center={{ lat, lng }}
        zoom={15}
        markers={[{ lat, lng, name, highlight: true }]}
        pickMarker={user}
        fitPair={fitPair}
      />
      {distM != null && (
        <div className="pointer-events-none absolute bottom-3 right-3 z-[500] rounded-md bg-surface/95 px-3.5 py-2 text-center shadow-[var(--shadow-card)] backdrop-blur">
          <div className="text-base font-black tabular-nums text-pharma-dark">
            {formatDistance(distM)}
          </div>
          <div className="text-xs font-semibold text-muted">{walkMin} min pieszo</div>
        </div>
      )}
    </div>
  );
}
