// Parsowanie godzin otwarcia z rejestru. Format dominujący: "HH:MM - HH:MM".
// Obsługuje: całodobowo, zamknięte, wiele przedziałów (przerwa), separatory różnego typu.

export interface HourSegment {
  opensAt: number; // minuty od północy
  closesAt: number; // gdy < opensAt → zamknięcie po północy (zmiana nocna). 24:00 → 1440.
  is24h: boolean;
}

const H24_KEYWORDS = [
  'całodobow',
  'calodobow',
  '24h',
  '24 h',
  'całą dobę',
  'cala dobe',
  'non-stop',
  'non stop',
  'nonstop',
];
const CLOSED_KEYWORDS = [
  'nieczynne',
  'zamknięt',
  'zamkniet',
  'nieczynna',
  'brak',
];

function toMinutes(h: number, m: number): number {
  return h * 60 + m;
}

/**
 * Zwraca listę przedziałów otwarcia dla jednej komórki (jednego dnia).
 * Pusta lista = brak danych / zamknięte.
 */
export function parseHours(raw: string | null | undefined): HourSegment[] {
  if (raw == null) return [];
  const value = String(raw).trim();
  if (value === '' || value === '-' || value === '—') return [];

  const lower = value.toLowerCase();
  if (CLOSED_KEYWORDS.some((k) => lower.includes(k))) return [];
  if (H24_KEYWORDS.some((k) => lower.includes(k))) {
    return [{ opensAt: 0, closesAt: 1440, is24h: true }];
  }

  const segments: HourSegment[] = [];
  // Wiele przedziałów rozdzielonych przecinkiem/średnikiem: "08:00-12:00, 14:00-18:00".
  for (const part of value.split(/[,;]/)) {
    const m = part.match(
      /(\d{1,2})[:.](\d{2})\s*[-–—do]+\s*(\d{1,2})[:.](\d{2})/i,
    );
    if (!m) continue;
    const oH = Number(m[1]);
    const oM = Number(m[2]);
    const cH = Number(m[3]);
    const cM = Number(m[4]);
    if (oH > 24 || cH > 24 || oM > 59 || cM > 59) continue;
    const opensAt = toMinutes(oH, oM);
    const closesAt = toMinutes(cH, cM); // 24:00 -> 1440
    if (opensAt === closesAt) continue; // pusty przedział
    const is24h = opensAt === 0 && closesAt === 1440;
    segments.push({ opensAt, closesAt, is24h });
  }
  return segments;
}

// Dzień tygodnia: 0=poniedziałek … 6=niedziela. Niedziela: preferuj handlową, potem niehandlową.
export function buildWeekHours(hours: {
  mon: string;
  tue: string;
  wed: string;
  thu: string;
  fri: string;
  sat: string;
  sunTrade: string;
  sunNoTrade: string;
}): Array<HourSegment & { dayOfWeek: number }> {
  const byDay: Array<{ day: number; cell: string }> = [
    { day: 0, cell: hours.mon },
    { day: 1, cell: hours.tue },
    { day: 2, cell: hours.wed },
    { day: 3, cell: hours.thu },
    { day: 4, cell: hours.fri },
    { day: 5, cell: hours.sat },
    {
      day: 6,
      cell: hours.sunTrade?.trim() ? hours.sunTrade : hours.sunNoTrade,
    },
  ];
  const out: Array<HourSegment & { dayOfWeek: number }> = [];
  for (const { day, cell } of byDay) {
    for (const seg of parseHours(cell)) {
      out.push({ ...seg, dayOfWeek: day });
    }
  }
  return out;
}
