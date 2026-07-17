import * as XLSX from 'xlsx';
import { RegistryParserService } from './registry-parser.service';
import { REGISTRY_COLUMNS } from './registry-columns';

// Buduje .xlsx w pamięci z komórkami zawierającymi DOSŁOWNIE to, co podamy —
// odwzorowuje realny plik rejestru, który ma escapowanie CSV zapieczone w komórkach.
function buildWorkbook(rows: Record<string, string>[]): Buffer {
  const headers = Object.values(REGISTRY_COLUMNS);
  const grid = [headers, ...rows.map((r) => headers.map((h) => r[h] ?? ''))];
  const ws = XLSX.utils.aoa_to_sheet(grid);
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, 'Rejestr');
  return XLSX.write(wb, { type: 'buffer', bookType: 'xlsx' }) as Buffer;
}

function row(over: Record<string, string> = {}): Record<string, string> {
  return {
    [REGISTRY_COLUMNS.registryId]: '1',
    [REGISTRY_COLUMNS.status]: 'AKTYWNA',
    [REGISTRY_COLUMNS.kind]: 'APTEKA OGÓLNODOSTĘPNA',
    [REGISTRY_COLUMNS.voivodeship]: 'mazowieckie',
    [REGISTRY_COLUMNS.county]: 'Warszawa',
    [REGISTRY_COLUMNS.commune]: 'Warszawa',
    [REGISTRY_COLUMNS.city]: 'Warszawa',
    [REGISTRY_COLUMNS.postalCode]: '00-145',
    ...over,
  };
}

describe('RegistryParserService — escapowanie CSV w komórkach', () => {
  const parser = new RegistryParserService();

  it('rozdublowuje cudzysłowy w nazwie ulicy', () => {
    const buf = buildWorkbook([
      row({ [REGISTRY_COLUMNS.streetName]: 'Aleja ""Solidarności""' }),
    ]);
    expect(parser.parseBuffer(buf).rows[0].streetName).toBe(
      'Aleja "Solidarności"',
    );
  });

  it('rozdublowuje cudzysłowy w nazwie apteki i właściciela', () => {
    const buf = buildWorkbook([
      row({
        [REGISTRY_COLUMNS.name]: 'Apteka ""Mandragora""',
        [REGISTRY_COLUMNS.ownerName]: '""Apteka"" Karolina Ziębakowska',
      }),
    ]);
    const parsed = parser.parseBuffer(buf).rows[0];
    expect(parsed.name).toBe('Apteka "Mandragora"');
    expect(parsed.ownerName).toBe('"Apteka" Karolina Ziębakowska');
  });

  it('nie rusza wartości bez cudzysłowów', () => {
    const buf = buildWorkbook([
      row({ [REGISTRY_COLUMNS.name]: 'Apteka Pod Orłem' }),
    ]);
    expect(parser.parseBuffer(buf).rows[0].name).toBe('Apteka Pod Orłem');
  });

  it('czyści rekordy eskejpowane dwukrotnie', () => {
    // Realny rekord 1228963: 'Punkt apteczny ""Dla Ciebie""""' — dwie rundy CSV.
    const buf = buildWorkbook([
      row({ [REGISTRY_COLUMNS.name]: 'Punkt apteczny ""Dla Ciebie""""' }),
    ]);
    expect(parser.parseBuffer(buf).rows[0].name).toBe(
      'Punkt apteczny "Dla Ciebie"',
    );
  });

  it('radzi sobie z niesparowanym cudzysłowem z rejestru', () => {
    // Realny rekord: 'Aleja ""Solidarności 67/F' — brak domknięcia w źródle.
    const buf = buildWorkbook([
      row({ [REGISTRY_COLUMNS.streetName]: 'Aleja ""Solidarności 67/F' }),
    ]);
    expect(parser.parseBuffer(buf).rows[0].streetName).toBe(
      'Aleja "Solidarności 67/F',
    );
  });
});
