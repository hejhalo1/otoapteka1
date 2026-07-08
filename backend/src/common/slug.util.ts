import slugify from 'slugify';

const slugOpts = { lower: true, strict: true, locale: 'pl' } as const;

export function toSlug(value: string): string {
  return slugify(value ?? '', slugOpts);
}

/**
 * Buduje unikalny slug apteki: "nazwa-miasto", kolizje sufiksem -2, -3...
 * `used` to zbiór już zajętych slugów (istniejące + tworzone w tym samym imporcie) —
 * po wygenerowaniu slug jest do niego dopisywany.
 */
export function uniquePharmacySlug(
  name: string,
  city: string,
  used: Set<string>,
): string {
  const base =
    [toSlug(name), toSlug(city)].filter(Boolean).join('-') || 'apteka';
  let slug = base;
  let n = 2;
  while (used.has(slug)) {
    slug = `${base}-${n}`;
    n += 1;
  }
  used.add(slug);
  return slug;
}

// "KRYNKI" → "Krynki", ale "Nowa Słupia" zostaje. Poprawia tylko wpisy CAŁE WERSALIKAMI.
export function normalizeCityCase(value: string): string {
  const v = (value ?? '').trim();
  if (!v) return v;
  if (v === v.toUpperCase()) {
    return v
      .toLowerCase()
      .replace(
        /(^|[\s-])(\p{L})/gu,
        (_m: string, sep: string, ch: string) => sep + ch.toUpperCase(),
      );
  }
  return v;
}
