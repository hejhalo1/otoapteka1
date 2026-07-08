import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../prisma/prisma.service';
import { NominatimService } from './nominatim.service';

export interface GeocodeResult {
  attempted: number;
  geocoded: number;
  failed: number;
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
    private readonly nominatim: NominatimService,
    private readonly config: ConfigService,
  ) {}

  // Numer lokalu (część po "/") rozbija dopasowanie w Nominatim — do geokodowania
  // zostawiamy sam numer budynku. "199A/C4-U" -> "199A", "1/1.280" -> "1".
  private stripUnit(street: string | null): string {
    return (street ?? '').replace(/\/\S+/, '').trim();
  }

  private buildQueries(row: PendingRow): string[] {
    const street = this.stripUnit(row.street);
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
   * Geokoduje apteki bez współrzędnych (location IS NULL), aktywne, nieusunięte,
   * które wcześniej nie zawiodły. Rate limit 1 req/s → to jest proces wielogodzinny
   * dla pełnej bazy; dlatego limitowany per uruchomienie (GEOCODE_MAX_PER_RUN) i wznawialny.
   */
  async geocodePending(opts?: {
    limit?: number;
    city?: string;
  }): Promise<GeocodeResult> {
    const limit =
      opts?.limit ??
      Number(this.config.get<string>('GEOCODE_MAX_PER_RUN') ?? 500);
    const city = opts?.city?.trim();

    // location to kolumna Unsupported (PostGIS) — Prisma nie filtruje po niej, więc raw select.
    const rows = city
      ? await this.prisma.$queryRaw<PendingRow[]>`
          SELECT id, street, city, "postalCode"
          FROM "Pharmacy"
          WHERE location IS NULL AND "geocodeFailed" = false
            AND "removedFromRegistryAt" IS NULL AND status = 'AKTYWNA'
            AND city ILIKE ${'%' + city + '%'}
          ORDER BY "updatedAt" DESC
          LIMIT ${limit}`
      : await this.prisma.$queryRaw<PendingRow[]>`
          SELECT id, street, city, "postalCode"
          FROM "Pharmacy"
          WHERE location IS NULL AND "geocodeFailed" = false
            AND "removedFromRegistryAt" IS NULL AND status = 'AKTYWNA'
          ORDER BY "updatedAt" DESC
          LIMIT ${limit}`;

    const result: GeocodeResult = {
      attempted: rows.length,
      geocoded: 0,
      failed: 0,
    };
    if (rows.length === 0) return result;

    this.logger.log(
      `Geokodowanie ${rows.length} aptek (limit=${limit}${city ? `, miasto=${city}` : ''})...`,
    );

    for (const row of rows) {
      let coords = null as Awaited<ReturnType<typeof this.nominatim.geocode>>;
      for (const query of this.buildQueries(row)) {
        coords = await this.nominatim.geocode(query);
        if (coords) break;
      }
      if (coords) {
        // location wypełniamy przez raw (typ PostGIS). ST_MakePoint(lng, lat)!
        await this.prisma.$executeRaw`
          UPDATE "Pharmacy"
          SET lat = ${coords.lat}, lng = ${coords.lng},
              location = ST_SetSRID(ST_MakePoint(${coords.lng}, ${coords.lat}), 4326)::geography,
              "geocodedAt" = now(), "geocodeFailed" = false
          WHERE id = ${row.id}`;
        result.geocoded += 1;
      } else {
        await this.prisma.pharmacy.update({
          where: { id: row.id },
          data: { geocodeFailed: true, geocodedAt: new Date() },
        });
        result.failed += 1;
      }
    }

    this.logger.log(
      `Geokodowanie zakończone: ${result.geocoded} OK, ${result.failed} nieudanych.`,
    );
    return result;
  }
}
