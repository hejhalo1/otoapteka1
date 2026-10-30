"use client";

import { useEffect, useState } from "react";
import { MapView } from "@/components/map/MapView";
import { RouteBadge } from "@/components/map/RouteBadge";
import { type Coords, haversineM } from "@/lib/geo";
import { readLastLocation } from "@/lib/last-location";
import { useRoute } from "@/lib/use-route";

/**
 * Mapa apteki + (jeśli znamy ostatnią lokalizację użytkownika) trasa z OSRM narysowana
 * na mapie z jej długością i czasem. Zanim trasa przyjdzie (lub gdy się nie da jej
 * wyznaczyć) — dystans w linii prostej i kadr obejmujący oba punkty.
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

  const route = useRoute(user, { lat, lng });
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
        route={route?.coordinates}
      />
      {route ? (
        <RouteBadge
          distanceMeters={route.distanceMeters}
          minutes={route.durationMinutes}
          mode={route.mode}
          className="right-3 text-center"
        />
      ) : (
        distM != null &&
        walkMin != null && (
          <RouteBadge
            distanceMeters={distM}
            minutes={walkMin}
            mode="walk"
            className="right-3 text-center"
          />
        )
      )}
    </div>
  );
}
