import type {
  PharmacyDetail,
  PharmacyListResponse,
  SearchParams,
} from "./types";

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:3001";

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
