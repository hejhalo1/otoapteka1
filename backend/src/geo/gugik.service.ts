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

// Typy dopasowania UUG. Przy geokodowaniu APTEKI 'city' to centroid miejscowości —
// bezużyteczny (potrafi być kilka km od celu). Przy wyszukiwaniu MIEJSCA (input
// miasto/kod) centroid jest dokładnie tym, czego chcemy.
const ADDRESS_TYPES = new Set(['address', 'street']);
const PLACE_TYPES = new Set(['address', 'street', 'city']);

interface UugResult {
  x?: string;
  y?: string;
  city?: string;
  street?: string;
  number?: string;
  code?: string;
  jednostka?: string; // "{Polska,województwo,powiat,gmina}" (tekst tablicy PostgreSQL)
}

interface UugResponse {
  type?: string;
  results?: Record<string, UugResult>;
}

// Ostatni element `jednostka` to gmina. Miasto ma gminę == swojej nazwie, wieś nie —
// pozwala odróżnić np. stolicę od 9 wsi o nazwie "Warszawa".
function gmina(r: UugResult): string {
  const parts = (r.jednostka ?? '').replace(/[{}]/g, '').split(',');
  return (parts[parts.length - 1] ?? '').trim().toLowerCase();
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
   * Geokoduje adres apteki w formacie UUG ("Miasto, Ulica Numer"). Odrzuca centroidy
   * miejscowości. Zwraca współrzędne WGS84 albo null.
   */
  async geocode(query: string): Promise<GeoCoords | null> {
    const hits = await this.lookup(query, ADDRESS_TYPES);
    if (!hits?.length) return null;
    const { lat, lng } = hits[0];
    return { lat, lng };
  }

  /**
   * Wyszukuje MIEJSCE (miasto lub kod pocztowy z inputu użytkownika) — akceptuje też
   * centroid miejscowości. Zwraca współrzędne + czytelną etykietę.
   *
   * `preferCity`: gdy kilka miejscowości ma tę samą nazwę (w PL jest np. 10 wsi
   * "Warszawa"), wybiera tę, której gmina == nazwie miasta (czyli właściwe miasto,
   * nie wieś). Bez dopasowania bierze pierwszy wynik z UUG.
   */
  async geocodePlace(
    query: string,
    preferCity?: string,
  ): Promise<{ lat: number; lng: number; label: string } | null> {
    const hits = await this.lookup(query, PLACE_TYPES);
    if (!hits?.length) return null;

    const target = (preferCity ?? '').trim().toLowerCase();
    const best =
      (target && hits.find((h) => gmina(h.r) === target)) ||
      hits.find(
        (h) => h.r.city && gmina(h.r) === h.r.city.trim().toLowerCase(),
      ) ||
      hits[0];

    const parts = [best.r.street, best.r.number, best.r.city].filter(
      (p): p is string => Boolean(p && p.trim()),
    );
    const label = parts.length ? parts.join(' ').trim() : query.trim();
    return { lat: best.lat, lng: best.lng, label };
  }

  /**
   * Wspólny rdzeń: zapytanie do UUG, walidacja JSON/typu/bbox, transformacja 2180→WGS84.
   * Zwraca WSZYSTKIE wyniki (do wyboru najlepszego przy niejednoznacznych nazwach).
   */
  private async lookup(
    query: string,
    acceptedTypes: Set<string>,
  ): Promise<Array<{ lat: number; lng: number; r: UugResult }> | null> {
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
      if (!data.type || !acceptedTypes.has(data.type)) return null;

      const out: Array<{ lat: number; lng: number; r: UugResult }> = [];
      for (const r of Object.values(data.results ?? {})) {
        if (!r?.x || !r?.y) continue;
        const x = Number(r.x);
        const y = Number(r.y);
        if (!Number.isFinite(x) || !Number.isFinite(y)) continue;
        const [lng, lat] = proj4('EPSG:2180', 'EPSG:4326', [x, y]);
        if (!Number.isFinite(lat) || !Number.isFinite(lng)) continue;
        if (!this.inPoland(lat, lng)) continue;
        out.push({ lat, lng, r });
      }
      return out.length ? out : null;
    } catch (e) {
      this.logger.warn(`Błąd GUGiK "${query}": ${(e as Error).message}`);
      return null;
    } finally {
      clearTimeout(timeout);
    }
  }
}
