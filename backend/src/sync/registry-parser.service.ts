import { Injectable, Logger } from '@nestjs/common';
import { parse as parseCsvSync } from 'csv-parse/sync';
import * as XLSX from 'xlsx';
import {
  REGISTRY_COLUMNS,
  REQUIRED_HEADERS,
  RawPharmacyRow,
} from './registry-columns';

// Rodzaje aptek dostępnych publicznie — tylko te importujemy (patrz PharmacyKind).
const PUBLIC_KINDS = new Set(['APTEKA OGÓLNODOSTĘPNA', 'PUNKT APTECZNY']);

// Wartość komórki (SheetJS raw:false / csv-parse zwracają prymitywy, nigdy obiekty).
type Cell = string | number | boolean | null | undefined;

export interface ParseResult {
  detectedFormat: 'xls' | 'xlsx' | 'csv';
  totalDataRows: number; // wszystkie wiersze danych (przed filtrem rodzaju)
  rows: RawPharmacyRow[]; // tylko apteki publiczne
}

@Injectable()
export class RegistryParserService {
  private readonly logger = new Logger(RegistryParserService.name);

  private detectFormat(buffer: Buffer): 'xls' | 'xlsx' | 'csv' {
    if (buffer.length >= 8) {
      const sig = buffer.subarray(0, 8);
      // OLE2 (legacy .xls): D0 CF 11 E0 A1 B1 1A E1
      if (
        sig[0] === 0xd0 &&
        sig[1] === 0xcf &&
        sig[2] === 0x11 &&
        sig[3] === 0xe0
      )
        return 'xls';
      // ZIP (.xlsx): 50 4B (PK)
      if (sig[0] === 0x50 && sig[1] === 0x4b) return 'xlsx';
    }
    return 'csv';
  }

  /** Parsuje bufor rejestru → wiersze aptek publicznych. Format wykrywany po zawartości. */
  parseBuffer(buffer: Buffer): ParseResult {
    const detectedFormat = this.detectFormat(buffer);
    this.logger.log(
      `Wykryty format pliku: ${detectedFormat} (${buffer.length} B)`,
    );

    const grid =
      detectedFormat === 'csv'
        ? this.readCsv(buffer)
        : this.readSpreadsheet(buffer);

    if (grid.length === 0) throw new Error('Pusty plik rejestru.');

    const header = grid[0].map((h) => String(h ?? '').trim());
    this.validateHeader(header);
    const col = this.buildColumnIndex(header);

    const rows: RawPharmacyRow[] = [];
    let totalDataRows = 0;
    for (let r = 1; r < grid.length; r++) {
      const raw = grid[r];
      if (!raw || raw.length === 0) continue;
      totalDataRows += 1;

      const kindRaw = this.cell(raw, col.kind);
      if (!PUBLIC_KINDS.has(kindRaw.toUpperCase())) continue; // pomijamy szpitalne/zakładowe

      const registryId = this.cell(raw, col.registryId);
      if (!registryId) continue; // bez identyfikatora nie da się zrobić upsertu

      rows.push({
        rowNumber: r + 1,
        registryId,
        name: this.cell(raw, col.name),
        statusRaw: this.cell(raw, col.status),
        kindRaw,
        permitNumber: this.cell(raw, col.permitNumber),
        voivodeship: this.cell(raw, col.voivodeship),
        county: this.cell(raw, col.county),
        commune: this.cell(raw, col.commune),
        streetType: this.cell(raw, col.streetType),
        streetName: this.cell(raw, col.streetName),
        buildingNo: this.cell(raw, col.buildingNo),
        unitNo: this.cell(raw, col.unitNo),
        city: this.cell(raw, col.city),
        postalCode: this.cell(raw, col.postalCode),
        phone: this.cell(raw, col.phone),
        website: this.cell(raw, col.website),
        ownerName: this.cell(raw, col.ownerName),
        hours: {
          mon: this.cell(raw, col.hoursMon),
          tue: this.cell(raw, col.hoursTue),
          wed: this.cell(raw, col.hoursWed),
          thu: this.cell(raw, col.hoursThu),
          fri: this.cell(raw, col.hoursFri),
          sat: this.cell(raw, col.hoursSat),
          sunTrade: this.cell(raw, col.hoursSunTrade),
          sunNoTrade: this.cell(raw, col.hoursSunNoTrade),
        },
      });
    }

    this.logger.log(
      `Sparsowano ${totalDataRows} wierszy, w tym ${rows.length} aptek publicznych.`,
    );
    return { detectedFormat, totalDataRows, rows };
  }

  private cell(row: Cell[], index: number): string {
    if (index < 0 || index >= row.length) return '';
    const v = row[index];
    return v == null ? '' : this.unescapeQuotes(String(v).trim());
  }

  // Rejestr generuje .xls z CSV i zostawia w komórkach escapowanie CSV: podwójny
  // cudzysłów oznacza jeden literalny (Apteka ""Vena"" → Apteka "Vena"). W całym
  // rejestrze nie ma ani jednego pojedynczego `"`, więc zamiana jest bezstratna.
  // Ścieżka CSV rozwija escapowanie sama (csv-parse), więc tam to no-op.
  //
  // Powtarzamy aż do stabilizacji, bo pojedyncze rekordy przeszły przez dwie rundy
  // eskejpowania (""""VITA"""" → ""VITA"" → "VITA") i jedno przejście ich nie czyści.
  private unescapeQuotes(value: string): string {
    let out = value;
    for (let prev = ''; out !== prev;) {
      prev = out;
      out = out.replace(/""/g, '"');
    }
    return out;
  }

  private readSpreadsheet(buffer: Buffer): Cell[][] {
    // SheetJS czyta zarówno legacy .xls (BIFF) jak i .xlsx. raw:false → sformatowane stringi.
    const wb = XLSX.read(buffer, {
      type: 'buffer',
      raw: false,
      cellText: true,
      cellDates: false,
      cellNF: false,
      cellStyles: false,
    });
    const ws = wb.Sheets[wb.SheetNames[0]];
    return XLSX.utils.sheet_to_json<Cell[]>(ws, {
      header: 1,
      raw: false,
      defval: '',
      blankrows: false,
    });
  }

  private readCsv(buffer: Buffer): Cell[][] {
    const text = buffer.toString('utf-8');
    const delimiter = text.slice(0, 5000).includes(';') ? ';' : ',';
    return parseCsvSync(text, {
      delimiter,
      relax_column_count: true,
      skip_empty_lines: true,
      bom: true,
    });
  }

  private validateHeader(header: string[]): void {
    const present = new Set(header);
    const missing = REQUIRED_HEADERS.filter((h) => !present.has(h));
    if (missing.length > 0) {
      throw new Error(
        `Rejestr zreorganizowany — brak wymaganych kolumn: ${missing.join(', ')}. Przerywam sync.`,
      );
    }
  }

  private buildColumnIndex(
    header: string[],
  ): Record<keyof typeof REGISTRY_COLUMNS, number> {
    const index = {} as Record<keyof typeof REGISTRY_COLUMNS, number>;
    for (const [field, headerName] of Object.entries(REGISTRY_COLUMNS)) {
      index[field as keyof typeof REGISTRY_COLUMNS] =
        header.indexOf(headerName);
    }
    return index;
  }
}
