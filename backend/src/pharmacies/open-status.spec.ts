import {
  computeOpenStatus,
  HoursSegment,
  selectEffectiveHours,
} from './open-status';

// Pomocnik: godziny na wskazane dni (0=pn..6=nd), stały przedział.
function seg(
  days: number[],
  opensAt: number,
  closesAt: number,
  is24h = false,
): HoursSegment[] {
  return days.map((dayOfWeek) => ({ dayOfWeek, opensAt, closesAt, is24h }));
}

const weekdays8to20 = seg([0, 1, 2, 3, 4], 480, 1200); // pn-pt 08:00-20:00

describe('computeOpenStatus', () => {
  it('OPEN w środku dnia (środa 12:00 CEST)', () => {
    const now = new Date('2026-07-08T10:00:00Z'); // 12:00 Warszawa
    const s = computeOpenStatus(weekdays8to20, [], now);
    expect(s.state).toBe('OPEN');
    expect(s.closesAt).toBe('2026-07-08T18:00:00.000Z'); // 20:00 CEST
  });

  it('CLOSING_SOON gdy < 60 min do zamknięcia (19:10)', () => {
    const now = new Date('2026-07-08T17:10:00Z'); // 19:10 Warszawa, 50 min do 20:00
    expect(computeOpenStatus(weekdays8to20, [], now).state).toBe(
      'CLOSING_SOON',
    );
  });

  it('OPEN (nie CLOSING_SOON) gdy > 60 min do zamknięcia (18:50)', () => {
    const now = new Date('2026-07-08T16:50:00Z'); // 18:50, 70 min do 20:00
    expect(computeOpenStatus(weekdays8to20, [], now).state).toBe('OPEN');
  });

  it('CLOSED po godzinach + opensNextAt następnego dnia', () => {
    const now = new Date('2026-07-08T19:00:00Z'); // 21:00 środa
    const s = computeOpenStatus(weekdays8to20, [], now);
    expect(s.state).toBe('CLOSED');
    expect(s.opensNextAt).toBe('2026-07-09T06:00:00.000Z'); // czwartek 08:00 CEST
  });

  it('zmiana nocna: pn 20:00 → wt 08:00, sprawdzane we wtorek 02:00', () => {
    const nightMon = seg([0], 1200, 480); // pn 20:00-08:00(+1)
    const now = new Date('2026-07-07T00:00:00Z'); // wtorek 02:00 CEST
    const s = computeOpenStatus(nightMon, [], now);
    expect(s.state).toBe('OPEN');
    expect(s.closesAt).toBe('2026-07-07T06:00:00.000Z'); // wt 08:00 CEST
  });

  it('24h: OPEN także tuż przed północą (bez fałszywego CLOSING_SOON)', () => {
    const all24 = seg([0, 1, 2, 3, 4, 5, 6], 0, 1440, true);
    const now = new Date('2026-07-08T21:30:00Z'); // 23:30 Warszawa
    expect(computeOpenStatus(all24, [], now).state).toBe('OPEN');
  });

  it('brak danych → UNKNOWN', () => {
    expect(computeOpenStatus([], [], new Date()).state).toBe('UNKNOWN');
  });

  it('dyżur poza godzinami → OPEN z flagą isDuty', () => {
    const now = new Date('2026-07-08T10:00:00Z');
    const duty = [
      {
        startsAt: new Date('2026-07-08T09:00:00Z'),
        endsAt: new Date('2026-07-08T12:00:00Z'),
      },
    ];
    const s = computeOpenStatus([], duty, now);
    expect(s.state).toBe('OPEN');
    expect(s.isDuty).toBe(true);
    expect(s.closesAt).toBe('2026-07-08T12:00:00.000Z');
  });

  it('dyżur nakładający się na godziny — otwarte, ale nie „tylko dyżur”', () => {
    const now = new Date('2026-07-08T10:00:00Z'); // 12:00, w godzinach 8-20
    const duty = [
      {
        startsAt: new Date('2026-07-08T06:00:00Z'),
        endsAt: new Date('2026-07-08T21:00:00Z'),
      },
    ];
    const s = computeOpenStatus(weekdays8to20, duty, now);
    expect(s.state).toBe('OPEN');
    expect(s.isDuty).toBe(false); // pokrywają też normalne godziny
  });

  it('DST wiosna (2026-03-29): closesAt liczone w CEST (+2)', () => {
    const sunday = seg([6], 480, 1200); // niedziela 08:00-20:00
    const now = new Date('2026-03-29T10:00:00Z'); // 12:00 CEST
    const s = computeOpenStatus(sunday, [], now);
    expect(s.state).toBe('OPEN');
    expect(s.closesAt).toBe('2026-03-29T18:00:00.000Z'); // 20:00 CEST
  });

  it('DST jesień (2026-10-25): closesAt liczone w CET (+1)', () => {
    const sunday = seg([6], 480, 1200);
    const now = new Date('2026-10-25T11:00:00Z'); // 12:00 CET
    const s = computeOpenStatus(sunday, [], now);
    expect(s.state).toBe('OPEN');
    expect(s.closesAt).toBe('2026-10-25T19:00:00.000Z'); // 20:00 CET
  });
});

describe('selectEffectiveHours', () => {
  it('rejestr ma pierwszeństwo nad godzinami apteki', () => {
    const rows = [
      { source: 'REGISTRY', v: 1 },
      { source: 'PHARMACY', v: 2 },
    ];
    expect(selectEffectiveHours(rows)).toEqual([{ source: 'REGISTRY', v: 1 }]);
  });

  it('godziny apteki gdy brak rejestrowych', () => {
    const rows = [{ source: 'PHARMACY', v: 2 }];
    expect(selectEffectiveHours(rows)).toEqual([{ source: 'PHARMACY', v: 2 }]);
  });
});
