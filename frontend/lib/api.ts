import type {
  City,
  PharmacyDetail,
  PharmacyListResponse,
  SearchParams,
} from "./types";

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:3001";

/** Zasoby serwowane przez backend (np. /uploads/...) → pełny URL. */
export function assetUrl(path: string): string {
  return path.startsWith("http") ? path : `${API_URL}${path}`;
}

function buildQuery(params: SearchParams): string {
  const q = new URLSearchParams();
  q.set("lat", String(params.lat));
  q.set("lng", String(params.lng));
  if (params.radiusKm) q.set("radiusKm", String(params.radiusKm));
  if (params.date) q.set("date", params.date);
  if (params.openNow) q.set("openNow", "true");
  if (params.page) q.set("page", String(params.page));
  if (params.perPage) q.set("perPage", String(params.perPage));
  if (params.city) q.set("city", params.city);
  if (params.voivodeship) q.set("voivodeship", params.voivodeship);
  return q.toString();
}

export interface GeocodedPlace {
  lat: number;
  lng: number;
  label: string;
}

// Klient — geokodowanie miasta (+ opcjonalny kod pocztowy). null gdy nie znaleziono.
export async function geocodePlace(
  city: string,
  postal?: string,
  signal?: AbortSignal,
): Promise<GeocodedPlace | null> {
  const q = new URLSearchParams({ city });
  if (postal) q.set("postal", postal);
  const res = await fetch(`${API_URL}/api/geo/geocode?${q.toString()}`, { signal });
  if (res.status === 404) return null;
  if (!res.ok) throw new Error(`Błąd geokodowania: ${res.status}`);
  return res.json() as Promise<GeocodedPlace>;
}

// Klient — aktywne slajdy galerii promocyjnej.
export interface PromoSlide {
  id: string;
  imageUrl: string;
  title: string | null;
  subtitle: string | null;
  href: string | null;
}
export async function fetchPromoSlides(signal?: AbortSignal): Promise<PromoSlide[]> {
  const res = await fetch(`${API_URL}/api/promo-slides`, { signal });
  if (!res.ok) throw new Error(`Błąd API: ${res.status}`);
  return res.json() as Promise<PromoSlide[]>;
}

// Klient — liczba aptek w bazie (statystyka na stronie głównej).
export async function fetchPharmacyCount(signal?: AbortSignal): Promise<number> {
  const res = await fetch(`${API_URL}/api/pharmacies/count`, { signal });
  if (!res.ok) throw new Error(`Błąd API: ${res.status}`);
  const data = (await res.json()) as { total: number };
  return data.total;
}

// Klient (przeglądarka) — lista aptek.
export async function fetchPharmacies(
  params: SearchParams,
  signal?: AbortSignal,
): Promise<PharmacyListResponse> {
  const res = await fetch(`${API_URL}/api/pharmacies?${buildQuery(params)}`, {
    signal,
  });
  if (!res.ok) throw new Error(`Błąd API: ${res.status}`);
  return res.json() as Promise<PharmacyListResponse>;
}

// Server Component (ISR) — karta apteki. Tag do rewalidacji on-demand po publikacji/synchronizacji.
export async function fetchPharmacyBySlug(
  slug: string,
): Promise<PharmacyDetail | null> {
  const res = await fetch(`${API_URL}/api/pharmacies/${encodeURIComponent(slug)}`, {
    next: { revalidate: 3600, tags: [`pharmacy:${slug}`] },
  });
  if (res.status === 404) return null;
  if (!res.ok) throw new Error(`Błąd API: ${res.status}`);
  return res.json() as Promise<PharmacyDetail>;
}

// Klient (przeglądarka) — szczegóły apteki, np. lista ulubionych.
export async function fetchPharmacyBySlugClient(
  slug: string,
  signal?: AbortSignal,
): Promise<PharmacyDetail | null> {
  const res = await fetch(`${API_URL}/api/pharmacies/${encodeURIComponent(slug)}`, { signal });
  if (res.status === 404) return null;
  if (!res.ok) throw new Error(`Błąd API: ${res.status}`);
  return res.json() as Promise<PharmacyDetail>;
}

// ── Katalog miast (strony SEO /apteki) ───────────────────────────────────────

// Server Component (ISR) — wszystkie miasta z aptekami (do indeksu + sitemapy).
export async function fetchCities(): Promise<City[]> {
  const res = await fetch(`${API_URL}/api/pharmacies/cities`, {
    next: { revalidate: 3600, tags: ["cities"] },
  });
  if (!res.ok) throw new Error(`Błąd API: ${res.status}`);
  return res.json() as Promise<City[]>;
}

// Server Component (ISR) — pojedyncze miasto po slugach; null gdy nie istnieje.
export async function fetchCity(
  voivodeshipSlug: string,
  citySlug: string,
): Promise<City | null> {
  const res = await fetch(
    `${API_URL}/api/pharmacies/cities/${encodeURIComponent(voivodeshipSlug)}/${encodeURIComponent(citySlug)}`,
    { next: { revalidate: 3600, tags: ["cities"] } },
  );
  if (res.status === 404) return null;
  if (!res.ok) throw new Error(`Błąd API: ${res.status}`);
  return res.json() as Promise<City>;
}

// Server Component (ISR) — lista aptek (dane początkowe strony miasta).
export async function fetchPharmaciesServer(
  params: SearchParams,
): Promise<PharmacyListResponse> {
  const res = await fetch(`${API_URL}/api/pharmacies?${buildQuery(params)}`, {
    next: { revalidate: 900 },
  });
  if (!res.ok) throw new Error(`Błąd API: ${res.status}`);
  return res.json() as Promise<PharmacyListResponse>;
}

// Klient — dopasowanie wpisanej nazwy do strony miasta (null gdy brak).
export async function resolveCityClient(
  q: string,
  signal?: AbortSignal,
): Promise<City | null> {
  const res = await fetch(
    `${API_URL}/api/pharmacies/cities/resolve?q=${encodeURIComponent(q)}`,
    { signal },
  );
  if (!res.ok) return null;
  return (await res.json()) as City | null;
}

// Slugi (sitemap).
export async function fetchAllSlugs(): Promise<
  Array<{ slug: string; voivodeship: string; city: string; updatedAt: string }>
> {
  const res = await fetch(`${API_URL}/api/pharmacies/slugs`, {
    next: { revalidate: 3600, tags: ["pharmacy-slugs"] },
  });
  if (!res.ok) throw new Error(`Błąd API: ${res.status}`);
  return res.json() as Promise<
    Array<{ slug: string; voivodeship: string; city: string; updatedAt: string }>
  >;
}
