import { buildWeekHours, parseHours } from './hours-parser';

describe('parseHours', () => {
  it('parsuje standardowy przedział', () => {
    expect(parseHours('08:00 - 20:00')).toEqual([
      { opensAt: 480, closesAt: 1200, is24h: false },
    ]);
  });

  it('pusty / myślnik / null → brak godzin', () => {
    expect(parseHours('')).toEqual([]);
    expect(parseHours('-')).toEqual([]);
    expect(parseHours(null)).toEqual([]);
    expect(parseHours(undefined)).toEqual([]);
  });

  it('rozpoznaje całodobowo', () => {
    expect(parseHours('całodobowo')).toEqual([
      { opensAt: 0, closesAt: 1440, is24h: true },
    ]);
    expect(parseHours('00:00 - 24:00')).toEqual([
      { opensAt: 0, closesAt: 1440, is24h: true },
    ]);
  });

  it('rozpoznaje zamknięte', () => {
    expect(parseHours('nieczynne')).toEqual([]);
    expect(parseHours('zamknięte')).toEqual([]);
  });

  it('obsługuje wiele przedziałów (przerwa)', () => {
    expect(parseHours('08:00-12:00, 14:00-18:00')).toEqual([
      { opensAt: 480, closesAt: 720, is24h: false },
      { opensAt: 840, closesAt: 1080, is24h: false },
    ]);
  });

  it('zmiana nocna: closesAt < opensAt', () => {
    expect(parseHours('20:00 - 08:00')).toEqual([
      { opensAt: 1200, closesAt: 480, is24h: false },
    ]);
  });

  it('ignoruje śmieci', () => {
    expect(parseHours('brak danych')).toEqual([]);
    expect(parseHours('25:99 - 30:00')).toEqual([]);
  });
});

describe('buildWeekHours', () => {
  const empty = {
    mon: '',
    tue: '',
    wed: '',
    thu: '',
    fri: '',
    sat: '',
    sunTrade: '',
    sunNoTrade: '',
  };

  it('mapuje dni 0..6 i pomija puste', () => {
    const out = buildWeekHours({
      ...empty,
      mon: '08:00 - 16:00',
      fri: '09:00 - 17:00',
    });
    expect(out).toEqual([
      { dayOfWeek: 0, opensAt: 480, closesAt: 960, is24h: false },
      { dayOfWeek: 4, opensAt: 540, closesAt: 1020, is24h: false },
    ]);
  });

  it('niedziela: preferuje handlową nad niehandlową', () => {
    const out = buildWeekHours({
      ...empty,
      sunTrade: '10:00 - 14:00',
      sunNoTrade: '11:00 - 13:00',
    });
    expect(out).toEqual([
      { dayOfWeek: 6, opensAt: 600, closesAt: 840, is24h: false },
    ]);
  });

  it('niedziela: gdy brak handlowej, bierze niehandlową', () => {
    const out = buildWeekHours({ ...empty, sunNoTrade: '11:00 - 13:00' });
    expect(out).toEqual([
      { dayOfWeek: 6, opensAt: 660, closesAt: 780, is24h: false },
    ]);
  });
});
