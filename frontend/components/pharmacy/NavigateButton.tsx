"use client";

import { useEffect, useState } from "react";
import { Navigation } from "lucide-react";
import { Coords, GEO_ERROR_MESSAGES, GeoError, getCurrentPosition } from "@/lib/geo";
import { readLastLocation, saveLastLocation } from "@/lib/last-location";
import { cn } from "@/lib/utils";

function mapsUrl(lat: number, lng: number, origin: Coords | null): string {
  return origin
    ? `https://www.google.com/maps/dir/?api=1&origin=${origin.lat},${origin.lng}&destination=${lat},${lng}`
    : `https://www.google.com/maps/dir/?api=1&destination=${lat},${lng}`;
}

function open(url: string) {
  const w = window.open(url, "_blank", "noopener,noreferrer");
  if (!w) window.location.href = url; // gdy popup zablokowany — ta sama karta
}

/**
 * „Nawiguj" — wyznacza trasę Z Twojej lokalizacji DO apteki. Jeśli nie znamy jeszcze
 * lokalizacji, NIE przechodzimy do Google, dopóki użytkownik jej nie udostępni:
 * klik prosi o pozycję i dopiero po jej podaniu otwiera trasę.
 */
export function NavigateButton({
  lat,
  lng,
  className,
}: {
  lat: number;
  lng: number;
  className?: string;
}) {
  const [user, setUser] = useState<Coords | null>(null);
  const [locating, setLocating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setUser(readLastLocation());
  }, []);

  // Gdy znamy lokalizację — zwykły link (bezpośredni klik, nowa karta bez blokad).
  if (user) {
    return (
      <a
        href={mapsUrl(lat, lng, user)}
        target="_blank"
        rel="noopener noreferrer"
        className={className}
      >
        <Navigation className="h-4.5 w-4.5" aria-hidden /> Nawiguj
      </a>
    );
  }

  // Brak lokalizacji — najpierw poproś o nią, dopiero potem otwórz trasę.
  const requestAndGo = async () => {
    setLocating(true);
    setError(null);
    try {
      const c = await getCurrentPosition();
      const loc: Coords = { ...c, label: "Twoja lokalizacja" };
      setUser(loc);
      saveLastLocation(loc); // zapamiętanie respektuje zgodę użytkownika
      open(mapsUrl(lat, lng, loc));
    } catch (e) {
      setError(
        GEO_ERROR_MESSAGES[e as GeoError] ??
          "Udostępnij lokalizację, aby wyznaczyć trasę do apteki.",
      );
    } finally {
      setLocating(false);
    }
  };

  return (
    <span className="inline-flex flex-col items-start gap-1">
      <button
        type="button"
        onClick={requestAndGo}
        disabled={locating}
        className={cn(className, "disabled:opacity-70")}
        title="Udostępnij lokalizację, aby wyznaczyć trasę"
      >
        <Navigation className="h-4.5 w-4.5" aria-hidden />
        {locating ? "Ustalanie lokalizacji…" : "Nawiguj"}
      </button>
      {error && <span className="max-w-[220px] text-xs font-semibold text-danger">{error}</span>}
    </span>
  );
}
