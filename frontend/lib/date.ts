/**
 * YYYY-MM-DD dla „dziś + offset dni” liczone w strefie Europe/Warsaw. Zwraca ten sam
 * wynik na serwerze i na kliencie (niezależnie od strefy hosta) — dzięki temu strony
 * miast (SSR) nie mają rozjazdu hydracji na domyślnym dniu.
 */
export function warsawISO(offsetDays = 0): string {
  const ymd = new Intl.DateTimeFormat("en-CA", {
    timeZone: "Europe/Warsaw",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(new Date());
  const [y, m, d] = ymd.split("-").map(Number);
  const base = new Date(Date.UTC(y, m - 1, d));
  base.setUTCDate(base.getUTCDate() + offsetDays);
  return base.toISOString().slice(0, 10);
}
