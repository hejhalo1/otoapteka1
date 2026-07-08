// Jawny słownik mapowania kolumn Rejestru Aptek (dane.gov.pl, dataset 1925) → pola modelu.
// Nagłówki ZBADANE na żywym pliku (stan 2026-07-08, 76 kolumn). Przy każdym syncu
// walidujemy obecność kolumn wymaganych — rejestr bywa reorganizowany.

export const REGISTRY_COLUMNS = {
  registryId: 'identyfikator_apteki',
  name: 'nazwa_apteki',
  status: 'stan_apteki',
  kind: 'rodzaj_apteki',
  permitNumber: 'numer_zezwolenia',
  voivodeship: 'wojewodztwo',
  county: 'powiat',
  commune: 'gmina',
  streetType: 'typ_ulicy',
  streetName: 'nazwa_ulicy',
  buildingNo: 'numer_budynku',
  unitNo: 'numer_lokalu',
  city: 'miejscowosc',
  postalCode: 'kod_pocztowy',
  phone: 'telefon',
  website: 'adres_www',
  ownerName: 'wlasciciel_nazwa',
  hoursMon: 'godziny_otwarcia_poniedzialek',
  hoursTue: 'godziny_otwarcia_wtorek',
  hoursWed: 'godziny_otwarcia_sroda',
  hoursThu: 'godziny_otwarcia_czwartek',
  hoursFri: 'godziny_otwarcia_piatek',
  hoursSat: 'godziny_otwarcia_sobota',
  hoursSunTrade: 'godziny_otwarcia_niedziela_handlowa',
  hoursSunNoTrade: 'godziny_otwarcia_niedziela_niehandlowa',
} as const;

// Bez tych kolumn nie da się bezpiecznie zaimportować — przerywamy sync z czytelnym błędem.
export const REQUIRED_HEADERS: string[] = [
  REGISTRY_COLUMNS.registryId,
  REGISTRY_COLUMNS.status,
  REGISTRY_COLUMNS.kind,
  REGISTRY_COLUMNS.voivodeship,
  REGISTRY_COLUMNS.county,
  REGISTRY_COLUMNS.commune,
  REGISTRY_COLUMNS.city,
  REGISTRY_COLUMNS.postalCode,
];

export type RegistryField = keyof typeof REGISTRY_COLUMNS;

// Surowy, znormalizowany wiersz (wszystkie wartości jako string, przycięte).
export interface RawPharmacyRow {
  rowNumber: number;
  registryId: string;
  name: string;
  statusRaw: string;
  kindRaw: string;
  permitNumber: string;
  voivodeship: string;
  county: string;
  commune: string;
  streetType: string;
  streetName: string;
  buildingNo: string;
  unitNo: string;
  city: string;
  postalCode: string;
  phone: string;
  website: string;
  ownerName: string;
  hours: {
    mon: string;
    tue: string;
    wed: string;
    thu: string;
    fri: string;
    sat: string;
    sunTrade: string;
    sunNoTrade: string;
  };
}
