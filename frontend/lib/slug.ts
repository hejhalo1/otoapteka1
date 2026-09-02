// Slug URL-owy z polskiej nazwy. MUSI być zgodny z backendem
// (backend/src/pharmacies/pharmacies.service.ts → slugify).
export function slugify(input: string): string {
  return input
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "") // diakrytyki: ą→a, ć→c, ó→o, ...
    .replace(/ł/g, "l") // ł (nie rozkłada się w NFD)
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

/**
 * Kanoniczna ścieżka wizytówki apteki: /apteki/<województwo>/<miasto>/<slug>.
 * Slug apteki jest globalnie unikalny (segment rozstrzygający), a woj./miasto
 * pełnią rolę czytelną/SEO. Spójne ze stronami miast /apteki/<woj>/<miasto>.
 */
export function pharmacyPath(voivodeship: string, city: string, slug: string): string {
  return `/apteki/${slugify(voivodeship)}/${slugify(city)}/${slug}`;
}
