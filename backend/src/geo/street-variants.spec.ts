import { streetVariants } from './street-variants';

describe('streetVariants', () => {
  it('zawsze próbuje najpierw pełnego zapisu (zakres numerów budynku)', () => {
    // "Żelazna 51/53" GUGiK zna TYLKO w całości — samo "51" zwraca brak.
    expect(streetVariants('ul. Żelazna 51/53')[0]).toBe('ul. Żelazna 51/53');
  });

  it('jako kolejny wariant odcina numer lokalu po ukośniku', () => {
    expect(streetVariants('ul. Żmigrodzka 15/lokal 1A-1B')).toContain(
      'ul. Żmigrodzka 15',
    );
    expect(streetVariants('Plac Konesera 10A/H 0.11')).toContain(
      'Plac Konesera 10A',
    );
  });

  it('jako ostatni wariant sprowadza numer do samych cyfr', () => {
    // "Targowa 1C/8" trafia dopiero jako "Targowa 1".
    expect(streetVariants('ul. Targowa 1C/8')).toEqual([
      'ul. Targowa 1C/8',
      'ul. Targowa 1C',
      'ul. Targowa 1',
    ]);
  });

  it('nie duplikuje wariantów dla prostego adresu', () => {
    expect(streetVariants('ul. Bronowicka 78')).toEqual(['ul. Bronowicka 78']);
  });

  it('zwraca pustą listę dla braku ulicy', () => {
    expect(streetVariants(null)).toEqual([]);
    expect(streetVariants('   ')).toEqual([]);
  });
});
