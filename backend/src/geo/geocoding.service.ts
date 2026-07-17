import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../prisma/prisma.service';
import { NominatimService } from './nominatim.service';
import { GugikService } from './gugik.service';
import { GeoCoords } from './geo.types';
import { streetVariants } from './street-variants';

export interface GeocodeResult {
  attempted: number;
  geocoded: number;
  failed: number;
  byGugik: number;
  byNominatim: number;
}

interface PendingRow {
  id: string;
  street: string | null;
  city: string;
  postalCode: string;
}

@Injectable()
export class GeocodingService {
  private readonly logger = new Logger(GeocodingService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly gugik: GugikService,
    private readonly nominatim: NominatimService,
    private readonly config: ConfigService,
  ) {}

  // GUGiK/UUG oczekuje "Miasto, Ulica Numer" (albo "Miejscowość Numer" na wsi).
  // Świadomie NIE pytamy o samo miasto — UUG zwróciłby wtedy centroid miejscowości,
  // a punkt oddalony o kilka km jest dla "najbliższej apteki" gorszy niż brak punktu.
  private buildGugikQueries(row: PendingRow): string[] {
    return streetVariants(row.street)
      .map((street) => [row.city, street].filter(Boolean).join(', '))
      .filter((q) => q.trim());
  }

  // Nominatim woli pełny adres z krajem i kodem pocztowym.
  private buildNominatimQueries(row: PendingRow): string[] {
    // Nominatim gubi się na numerach lokali — dajemy mu wariant bez lokalu.
    const street = streetVariants(row.street)[1] ?? row.street ?? '';
    const cityPart = `${row.postalCode} ${row.city}`.trim();
    const primary = [street, cityPart, 'Polska']
      .filter((p) => p && p.trim())
      .join(', ');
    // Fallback bez kodu pocztowego (bywa, że kod psuje dopasowanie).
    const fallback = [street, row.city, 'Polska']
      .filter((p) => p && p.trim())
      .join(', ');
    return primary === fallback ? [primary] : [primary, fallback];
  }

  /**
   * Geokoduje jeden adres: najpierw GUGiK (oficjalny PRG, szybki), a gdy nie zna
   * adresu — Nominatim jako zapas. Zwraca też nazwę źródła do statystyk.
   */
  private async geocodeRow(
    row: PendingRow,
  ): Promise<{ coords: GeoCoords; source: 'GUGIK' | 'NOMINATIM' } | null> {
    for (const query of this.buildGugikQueries(row)) {
      const coords = await this.gugik.geocode(query);
      if (coords) return { coords, source: 'GUGIK' };
    }
    if (this.nominatimEnabled) {
      for (const query of this.buildNominatimQueries(row)) {
        const coords = await this.nominatim.geocode(query);
        if (coords) return { coords, source: 'NOMINATIM' };
      }
    }
    return null;
  }

  // Nominatim ma twardy limit 1 req/s — przy masowym imporcie potrafi wydłużyć
  // przebieg o godziny dla adresów, których i tak nie zna. Wyłączalny flagą.
  private get nominatimEnabled(): boolean {
    return (
      (this.config.get<string>('GEOCODE_NOMINATIM_FALLBACK') ?? 'true') !==
      'false'
    );
  }

  /**
   * Geokoduje apteki bez współrzędnych (location IS NULL), aktywne i nieusunięte.
   * Domyślnie pomija te, które już raz zawiodły (geocodeFailed) — z opcją retryFailed
   * bierze je ponownie, co jest potrzebne po zmianie geokodera lub reguł budowy zapytań.
   */
  async geocodePending(opts?: {
    limit?: number;
    city?: string;
    retryFailed?: boolean;
  }): Promise<GeocodeResult> {
    const limit =
      opts?.limit ??
      Number(this.config.get<string>('GEOCODE_MAX_PER_RUN') ?? 500);
    const city = opts?.city?.trim();
    const retry = opts?.retryFailed === true;

    // location to kolumna Unsupported (PostGIS) — Prisma nie filtruje po niej, więc raw select.
    const rows = city
      ? await this.prisma.$queryRaw<PendingRow[]>`
          SELECT id, street, city, "postalCode"
          FROM "Pharmacy"
          WHERE location IS NULL AND ("geocodeFailed" = false OR ${retry})
            AND "removedFromRegistryAt" IS NULL AND status = 'AKTYWNA'
            AND city ILIKE ${'%' + city + '%'}
          ORDER BY "updatedAt" DESC
          LIMIT ${limit}`
      : await this.prisma.$queryRaw<PendingRow[]>`
          SELECT id, street, city, "postalCode"
          FROM "Pharmacy"
          WHERE location IS NULL AND ("geocodeFailed" = false OR ${retry})
            AND "removedFromRegistryAt" IS NULL AND status = 'AKTYWNA'
          ORDER BY "updatedAt" DESC
          LIMIT ${limit}`;

    const result: GeocodeResult = {
      attempted: rows.length,
      geocoded: 0,
      failed: 0,
      byGugik: 0,
      byNominatim: 0,
    };
    if (rows.length === 0) return result;

    this.logger.log(
      `Geokodowanie ${rows.length} aptek (limit=${limit}${city ? `, miasto=${city}` : ''})...`,
    );

    // Pula robotników. Sekwencyjnie pełna baza to ~72 min; równolegle ~20 min.
    // Właściwy sufit przepustowości i tak narzuca odstęp w GugikService
    // (GUGIK_MIN_INTERVAL_MS) — współbieżność tylko wypełnia czas oczekiwania na sieć.
    const concurrency = Math.max(
      1,
      Number(this.config.get<string>('GEOCODE_CONCURRENCY') ?? 4),
    );

    let cursor = 0;
    let done = 0;
    const worker = async (): Promise<void> => {
      for (;;) {
        const index = cursor++;
        if (index >= rows.length) return;
        const row = rows[index];

        const hit = await this.geocodeRow(row);
        if (hit) {
          // location wypełniamy przez raw (typ PostGIS). ST_MakePoint(lng, lat)!
          await this.prisma.$executeRaw`
            UPDATE "Pharmacy"
            SET lat = ${hit.coords.lat}, lng = ${hit.coords.lng},
                location = ST_SetSRID(ST_MakePoint(${hit.coords.lng}, ${hit.coords.lat}), 4326)::geography,
                "geocodedAt" = now(), "geocodeFailed" = false
            WHERE id = ${row.id}`;
          result.geocoded += 1;
          if (hit.source === 'GUGIK') result.byGugik += 1;
          else result.byNominatim += 1;
        } else {
          await this.prisma.pharmacy.update({
            where: { id: row.id },
            data: { geocodeFailed: true, geocodedAt: new Date() },
          });
          result.failed += 1;
        }

        // Przebieg pełnej bazy trwa dziesiątki minut — dajemy znak życia.
        done += 1;
        if (done % 250 === 0 || done === rows.length) {
          this.logger.log(
            `  postęp: ${done}/${rows.length} (OK ${result.geocoded}, bez wyniku ${result.failed})`,
          );
        }
      }
    };

    await Promise.all(
      Array.from({ length: Math.min(concurrency, rows.length) }, () =>
        worker(),
      ),
    );

    this.logger.log(
      `Geokodowanie zakończone: ${result.geocoded} OK ` +
        `(GUGiK ${result.byGugik}, Nominatim ${result.byNominatim}), ` +
        `${result.failed} bez wyniku.`,
    );
    return result;
  }
}
