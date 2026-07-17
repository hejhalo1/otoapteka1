import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import proj4 from 'proj4';
import { GeoCoords, POLAND_BBOX } from './geo.types';

// PUWG 1992 (EPSG:2180) — układ, w którym GUGiK zwraca współrzędne. Definicja
// standardowa; zweryfikowana względem ST_Transform PostGIS (zgodność ~2 cm).
proj4.defs(
  'EPSG:2180',
  '+proj=tmerc +lat_0=0 +lon_0=19 +k=0.9993 +x_0=500000 +y_0=-5300000 +ellps=GRS80 +towgs84=0,0,0,0,0,0,0 +units=m +no_defs',
);

// Typ dopasowania zwracany przez UUG. 'city' to centroid miejscowości — dla apteki
// bezużyteczny (potrafi być kilka km od celu), więc go odrzucamy.
const ACCEPTED_TYPES = new Set(['address', 'street']);

interface UugResult {
  x?: string;
  y?: string;
  city?: string;
  street?: string;
  number?: string;
  code?: string;
}

interface UugResponse {
  type?: string;
  results?: Record<string, UugResult>;
}

/**
 * Uniwersalna Usługa Geokodowania GUGiK (services.gugik.gov.pl/uug) — oficjalny
 * geokoder krajowy oparty o PRG (Państwowy Rejestr Granic). W przeciwieństwie do
 * publicznego Nominatima (polityka: 1 req/s, a dla zadań cyklicznych 4 req/min)
 * nadaje się do masowego geokodowania pełnej bazy aptek.
 */
@Injectable()
export class GugikService {
  private readonly logger = new Logger(GugikService.name);
  private readonly baseUrl: string;
  private readonly allowedHost: string;
  private readonly minIntervalMs: number;
  private lastRequestAt = 0;

  constructor(private readonly config: ConfigService) {
    this.baseUrl = (
      this.config.get<string>('GUGIK_BASE_URL') ??
      'https://services.gugik.gov.pl/uug'
    ).replace(/\/$/, '');
    this.allowedHost = new URL(this.baseUrl).host;
    this.minIntervalMs = Number(
      this.config.get<string>('GUGIK_MIN_INTERVAL_MS') ?? 60,
    );
  }

  // Uprzejmy odstęp między zapytaniami do darmowej usługi publicznej.
  private async rateLimit(): Promise<void> {
    const wait = this.minIntervalMs - (Date.now() - this.lastRequestAt);
    if (wait > 0) await new Promise((r) => setTimeout(r, wait));
    this.lastRequestAt = Date.now();
  }

  private inPoland(lat: number, lng: number): boolean {
    return (
      lat >= POLAND_BBOX.minLat &&
      lat <= POLAND_BBOX.maxLat &&
      lng >= POLAND_BBOX.minLng &&
      lng <= POLAND_BBOX.maxLng
    );
  }

  /**
   * Geokoduje adres w formacie UUG ("Miasto, Ulica Numer" lub "Miejscowość Numer").
   * Zwraca współrzędne WGS84 albo null (brak dopasowania / poza Polską / błąd).
   */
  async geocode(query: string): Promise<GeoCoords | null> {
    await this.rateLimit();

    const url = `${this.baseUrl}/?request=GetAddress&address=${encodeURIComponent(query)}`;

    // SSRF-guard: tylko skonfigurowany host GUGiK.
    const parsed = new URL(url);
    if (parsed.host !== this.allowedHost) {
      this.logger.error(`Zablokowano geokodowanie do hosta: ${parsed.host}`);
      return null;
    }

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 15_000);
    try {
      const res = await fetch(parsed, {
        headers: { Accept: 'application/json' },
        redirect: 'error',
        signal: controller.signal,
      });
      if (!res.ok) {
        this.logger.warn(`GUGiK HTTP ${res.status} dla: ${query}`);
        return null;
      }

      // Przy odrzuceniu przez WAF usługa zwraca HTML ze statusem 200 — nie ufamy
      // samemu kodowi odpowiedzi, tylko sprawdzamy, czy to faktycznie JSON.
      // To normalny element kaskady wariantów (dziwny numer lokalu bywa odrzucany,
      // a kolejny wariant trafia), więc tylko debug — inaczej zalałoby log przy 12 tys.
      const text = await res.text();
      if (!text.trimStart().startsWith('{')) {
        this.logger.debug(`GUGiK zwrócił nie-JSON dla: ${query}`);
        return null;
      }

      const data = JSON.parse(text) as UugResponse;
      if (!data.type || !ACCEPTED_TYPES.has(data.type)) return null;

      const best = data.results?.['1'];
      if (!best?.x || !best?.y) return null;

      const x = Number(best.x);
      const y = Number(best.y);
      if (!Number.isFinite(x) || !Number.isFinite(y)) return null;

      const [lng, lat] = proj4('EPSG:2180', 'EPSG:4326', [x, y]);
      if (!Number.isFinite(lat) || !Number.isFinite(lng)) return null;
      if (!this.inPoland(lat, lng)) {
        this.logger.warn(`Wynik poza Polską (${lat},${lng}) dla: ${query}`);
        return null;
      }
      return { lat, lng };
    } catch (e) {
      this.logger.warn(`Błąd GUGiK "${query}": ${(e as Error).message}`);
      return null;
    } finally {
      clearTimeout(timeout);
    }
  }
}
