import { TZDate } from '@date-fns/tz';

// Silnik statusu otwarcia — JEDYNE źródło prawdy (frontend tylko renderuje).
// Liczy na absolutnych instantach (TZDate, Europe/Warsaw) → poprawnie mimo DST.

export const TIMEZONE = 'Europe/Warsaw';
const CLOSING_SOON_MINUTES = 60;

export type OpenState = 'OPEN' | 'CLOSED' | 'CLOSING_SOON' | 'UNKNOWN';

export interface HoursSegment {
  dayOfWeek: number; // 0=poniedziałek … 6=niedziela
  opensAt: number; // minuty od północy
  closesAt: number; // < opensAt → zamknięcie następnego dnia; 1440 = północ
  is24h: boolean;
}

export interface DutyInterval {
  startsAt: Date;
  endsAt: Date;
}

export interface OpenStatus {
  state: OpenState;
  closesAt: string | null; // ISO — kiedy się zamyka (gdy OPEN/CLOSING_SOON)
  opensNextAt: string | null; // ISO — najbliższe otwarcie (gdy CLOSED)
  isDuty: boolean; // otwarte wyłącznie z tytułu dyżuru
}

interface Interval {
  start: number; // ms epoch
  end: number;
  hasNormal: boolean;
  hasDuty: boolean;
}

function mondayZeroDow(d: TZDate): number {
  return (d.getDay() + 6) % 7; // JS: 0=niedziela → nasz: 0=poniedziałek
}

function buildIntervals(
  segments: HoursSegment[],
  duties: DutyInterval[],
  now: Date,
): Interval[] {
  const z = new TZDate(now.getTime(), TIMEZONE);
  const y = z.getFullYear();
  const m = z.getMonth();
  const d = z.getDate();

  const raw: Interval[] = [];
  // Okno: wczoraj (zmiany nocne) … +7 dni (najbliższe otwarcie).
  for (let off = -1; off <= 7; off++) {
    const dayMidnight = new TZDate(y, m, d + off, 0, 0, 0, TIMEZONE);
    const dow = mondayZeroDow(dayMidnight);
    for (const s of segments) {
      if (s.dayOfWeek !== dow) continue;
      const closeMin = s.closesAt > s.opensAt ? s.closesAt : s.closesAt + 1440;
      const start = new TZDate(
        y,
        m,
        d + off,
        0,
        s.opensAt,
        0,
        TIMEZONE,
      ).getTime();
      const end = new TZDate(y, m, d + off, 0, closeMin, 0, TIMEZONE).getTime();
      if (end > start)
        raw.push({ start, end, hasNormal: true, hasDuty: false });
    }
  }
  for (const duty of duties) {
    const start = duty.startsAt.getTime();
    const end = duty.endsAt.getTime();
    if (end > start) raw.push({ start, end, hasNormal: false, hasDuty: true });
  }

  raw.sort((a, b) => a.start - b.start);

  // Scal nakładające się / stykające się przedziały (24h przez kilka dni, dyżur na godzinach).
  const merged: Interval[] = [];
  for (const iv of raw) {
    const last = merged[merged.length - 1];
    if (last && iv.start <= last.end) {
      last.end = Math.max(last.end, iv.end);
      last.hasNormal = last.hasNormal || iv.hasNormal;
      last.hasDuty = last.hasDuty || iv.hasDuty;
    } else {
      merged.push({ ...iv });
    }
  }
  return merged;
}

export function computeOpenStatus(
  segments: HoursSegment[],
  duties: DutyInterval[],
  now: Date = new Date(),
): OpenStatus {
  if (segments.length === 0 && duties.length === 0) {
    return {
      state: 'UNKNOWN',
      closesAt: null,
      opensNextAt: null,
      isDuty: false,
    };
  }

  const intervals = buildIntervals(segments, duties, now);
  const t = now.getTime();

  const current = intervals.find((iv) => iv.start <= t && t < iv.end);
  if (current) {
    const minutesToClose = (current.end - t) / 60_000;
    const state: OpenState =
      minutesToClose <= CLOSING_SOON_MINUTES ? 'CLOSING_SOON' : 'OPEN';
    return {
      state,
      closesAt: new Date(current.end).toISOString(),
      opensNextAt: null,
      isDuty: current.hasDuty && !current.hasNormal,
    };
  }

  const next = intervals.find((iv) => iv.start > t);
  return {
    state: 'CLOSED',
    closesAt: null,
    opensNextAt: next ? new Date(next.start).toISOString() : null,
    isDuty: false,
  };
}

// Godziny obowiązujące: rejestr ma pierwszeństwo; godziny apteki tylko gdy rejestr ich nie ma.
export function selectEffectiveHours<T extends { source: string }>(
  rows: T[],
): T[] {
  const registry = rows.filter((r) => r.source === 'REGISTRY');
  return registry.length > 0
    ? registry
    : rows.filter((r) => r.source === 'PHARMACY');
}
