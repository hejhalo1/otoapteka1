/**
 * Warianty zapisu ulicy do geokodowania, od najdokładniejszego do najluźniejszego.
 *
 * Nie da się tego załatwić jedną regułą, bo ukośnik w polskich adresach znaczy
 * dwie różne rzeczy (zweryfikowane na żywym UUG GUGiK):
 *   - zakres numerów budynku: "Żelazna 51/53" — działa TYLKO w całości ("51" → brak),
 *   - numer lokalu:           "Targowa 1C/8"  — działa dopiero jako "Targowa 1".
 * Dlatego zwracamy listę i próbujemy kolejno — pierwszy trafiony wariant wygrywa.
 */
export function streetVariants(street: string | null): string[] {
  const full = (street ?? '').trim();
  if (!full) return [];
  const out = [full];

  // Bez części po pierwszym ukośniku: "Żmigrodzka 15/lokal 1A-1B" → "Żmigrodzka 15".
  const noUnit = full.replace(/\/.*$/, '').trim();
  if (noUnit && !out.includes(noUnit)) out.push(noUnit);

  // Goły numer budynku bez sufiksu literowego: "Targowa 1C" → "Targowa 1".
  const bare = noUnit
    .replace(/(\d+)\s*[A-Za-zĄĆĘŁŃÓŚŹŻąćęłńóśźż]+$/, '$1')
    .trim();
  if (bare && !out.includes(bare)) out.push(bare);

  return out;
}
