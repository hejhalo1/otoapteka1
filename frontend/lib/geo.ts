// Geolokalizacja HTML5 — wyłącznie po akcji użytkownika. Pozycji NIE zapisujemy.

export interface Coords {
  lat: number;
  lng: number;
  label?: string;
}

export type GeoError = "denied" | "unavailable" | "timeout" | "unsupported";

export function getCurrentPosition(): Promise<Coords> {
  return new Promise((resolve, reject) => {
    if (typeof navigator === "undefined" || !navigator.geolocation) {
      reject("unsupported" as GeoError);
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (pos) => resolve({ lat: pos.coords.latitude, lng: pos.coords.longitude }),
      (err) => {
        if (err.code === err.PERMISSION_DENIED) reject("denied" as GeoError);
        else if (err.code === err.TIMEOUT) reject("timeout" as GeoError);
        else reject("unavailable" as GeoError);
      },
      { enableHighAccuracy: true, timeout: 10_000, maximumAge: 60_000 },
    );
  });
}

// Fallback: wybór miasta (środki większych miast Polski).
export const CITIES: Coords[] = [
  { label: "Warszawa", lat: 52.2297, lng: 21.0122 },
  { label: "Kraków", lat: 50.0647, lng: 19.945 },
  { label: "Łódź", lat: 51.7592, lng: 19.4559 },
  { label: "Wrocław", lat: 51.1079, lng: 17.0385 },
  { label: "Poznań", lat: 52.4064, lng: 16.9252 },
  { label: "Gdańsk", lat: 54.352, lng: 18.6466 },
  { label: "Szczecin", lat: 53.4285, lng: 14.5528 },
  { label: "Bydgoszcz", lat: 53.1235, lng: 18.0084 },
  { label: "Lublin", lat: 51.2465, lng: 22.5684 },
  { label: "Białystok", lat: 53.1325, lng: 23.1688 },
  { label: "Katowice", lat: 50.2649, lng: 19.0238 },
  { label: "Rzeszów", lat: 50.0413, lng: 21.999 },
];

export const GEO_ERROR_MESSAGES: Record<GeoError, string> = {
  denied: "Nie udało się pobrać lokalizacji — dostęp odrzucony. Wybierz miasto lub wskaż punkt na mapie.",
  unavailable: "Lokalizacja jest chwilowo niedostępna. Wybierz miasto lub wskaż punkt na mapie.",
  timeout: "Pobieranie lokalizacji trwało zbyt długo. Wybierz miasto lub wskaż punkt na mapie.",
  unsupported: "Twoja przeglądarka nie wspiera geolokalizacji. Wybierz miasto lub wskaż punkt na mapie.",
};
