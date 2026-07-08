import { normalizeCityCase, toSlug, uniquePharmacySlug } from './slug.util';

describe('toSlug', () => {
  it('slugifikuje polskie znaki', () => {
    expect(toSlug('Apteka Świętokrzyska')).toBe('apteka-swietokrzyska');
  });
});

describe('uniquePharmacySlug', () => {
  it('buduje slug nazwa-miasto', () => {
    const used = new Set<string>();
    expect(uniquePharmacySlug('Orlik', 'Warszawa', used)).toBe(
      'orlik-warszawa',
    );
  });

  it('rozwiązuje kolizje sufiksem -2, -3', () => {
    const used = new Set<string>();
    expect(uniquePharmacySlug('Apteka', 'Kraków', used)).toBe('apteka-krakow');
    expect(uniquePharmacySlug('Apteka', 'Kraków', used)).toBe(
      'apteka-krakow-2',
    );
    expect(uniquePharmacySlug('Apteka', 'Kraków', used)).toBe(
      'apteka-krakow-3',
    );
  });

  it('fallback gdy brak nazwy i miasta', () => {
    const used = new Set<string>();
    expect(uniquePharmacySlug('', '', used)).toBe('apteka');
  });
});

describe('normalizeCityCase', () => {
  it('naprawia CAŁE WERSALIKI', () => {
    expect(normalizeCityCase('KRYNKI')).toBe('Krynki');
    expect(normalizeCityCase('NOWA SŁUPIA')).toBe('Nowa Słupia');
  });

  it('zostawia poprawnie sformatowane', () => {
    expect(normalizeCityCase('Nowa Słupia')).toBe('Nowa Słupia');
    expect(normalizeCityCase('Suchedniów')).toBe('Suchedniów');
  });
});
