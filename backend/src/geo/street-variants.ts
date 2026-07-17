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

  const out: string[] = [];
  const push = (value: string): void => {
    const trimmed = value.trim();
    if (trimmed && !out.includes(trimmed)) out.push(trimmed);
  };

  push(full);

  // Bez części po pierwszym ukośniku: "Żmigrodzka 15/lokal 1A-1B" → "Żmigrodzka 15".
  const noUnit = full.replace(/\/.*$/, '').trim();
  push(noUnit);

  // Wsiom rejestr wpisuje numer domu w pole ulicy ("ul. 140" w Chorągwicy) — prefiks
  // typu ulicy jest wtedy fikcją i blokuje dopasowanie. Zostawiamy sam numer.
  // Lookahead na cyfrę celowo chroni prawdziwe ulice ("ul. Bydgoska 2" zostaje bez zmian).
  push(noUnit.replace(/^[a-ząćęłńóśźż]+\.\s*(?=\d)/i, ''));

  // Goły numer budynku bez sufiksu literowego: "Targowa 1C" → "Targowa 1".
  push(noUnit.replace(/(\d+)\s*[A-Za-zĄĆĘŁŃÓŚŹŻąćęłńóśźż]+$/, '$1'));

  return out;
}
