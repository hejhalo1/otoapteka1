import type { Coords } from "./geo";
import { hasFunctionalConsent } from "./consent";

// Zapamiętana lokalizacja użytkownika — zapisywana TYLKO przy zgodzie funkcjonalnej,
// żeby przetrwała zmianę zakładek i powrót na stronę.
const KEY = "otoapteka:last-location";

export function saveLastLocation(c: Coords): void {
  if (typeof window === "undefined" || !hasFunctionalConsent()) return;
  try {
    localStorage.setItem(
      KEY,
      JSON.stringify({ lat: c.lat, lng: c.lng, label: c.label ?? null }),
    );
  } catch {
    /* pamięć niedostępna */
  }
}

export function readLastLocation(): Coords | null {
  if (typeof window === "undefined" || !hasFunctionalConsent()) return null;
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return null;
    const p = JSON.parse(raw);
    if (typeof p?.lat === "number" && typeof p?.lng === "number") {
      return { lat: p.lat, lng: p.lng, label: typeof p.label === "string" ? p.label : undefined };
    }
  } catch {
    /* uszkodzony wpis — ignoruj */
  }
  return null;
}

export function clearLastLocation(): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.removeItem(KEY);
  } catch {
    /* nic */
  }
}
