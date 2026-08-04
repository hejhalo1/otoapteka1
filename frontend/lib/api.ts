import type {
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

// Slugi (sitemap).
export async function fetchAllSlugs(): Promise<
  Array<{ slug: string; updatedAt: string }>
> {
  const res = await fetch(`${API_URL}/api/pharmacies/slugs`, {
    next: { revalidate: 3600, tags: ["pharmacy-slugs"] },
  });
  if (!res.ok) throw new Error(`Błąd API: ${res.status}`);
  return res.json() as Promise<Array<{ slug: string; updatedAt: string }>>;
}
