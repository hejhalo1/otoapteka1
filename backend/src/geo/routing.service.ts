import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

export interface LatLng {
  lat: number;
  lng: number;
}

export interface RoutingTarget extends LatLng {
  distanceMeters: number; // z PostGIS (geodezyjny) — używany przez estymator
}

export interface TravelTime {
  walkMinutes: number;
  driveMinutes: number;
}

export type RouteMode = 'walk' | 'drive';

export interface Route {
  mode: RouteMode;
  distanceMeters: number;
  durationMinutes: number;
  /** Przebieg trasy jako [lng, lat] (kolejność GeoJSON). */
  coordinates: [number, number][];
}

// Prędkości/estymaty wg promptu.
const WALK_SPEED_KMH = 4.8;
const DRIVE_SPEED_KMH = 28; // miejskie
const ROUTE_FACTOR = 1.3; // trasa vs linia prosta
const OSRM_MAX_TARGETS = 24; // limit batcha /table

// Trasy na mapę: osobne instancje OSRM per profil (publiczny router.project-osrm.org
// ma tylko samochód). Domyślnie serwery FOSSGIS — TYLKO do developmentu / małego ruchu.
const ROUTE_DEFAULT_URLS: Record<RouteMode, string> = {
  walk: 'https://routing.openstreetmap.de/routed-foot',
  drive: 'https://routing.openstreetmap.de/routed-car',
};
const ROUTE_MAX_KM = 60; // trasa tylko „do apteki w okolicy", nie przez pół kraju
const ROUTE_CACHE_TTL_MS = 60 * 60_000;
const ROUTE_CACHE_MAX = 500;
const USER_AGENT = 'otoapteka.pl/1.0 (kontakt@otoapteka.pl)';

function hostOf(url: string): string {
  try {
    return new URL(url).host;
  } catch {
    return '';
  }
}

function haversineKm(a: LatLng, b: LatLng): number {
  const rad = Math.PI / 180;
  const dLat = (b.lat - a.lat) * rad;
  const dLng = (b.lng - a.lng) * rad;
  const h =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(a.lat * rad) * Math.cos(b.lat * rad) * Math.sin(dLng / 2) ** 2;
  return 2 * 6371 * Math.asin(Math.sqrt(h));
}

@Injectable()
export class RoutingService {
  private readonly logger = new Logger(RoutingService.name);
  private readonly osrmEnabled: boolean;
  private readonly osrmBaseUrl: string;
  private readonly osrmHost: string;
  private readonly routeBaseUrls: Record<RouteMode, string>;
  // Cache tras (klucz: tryb + współrzędne zaokrąglone do ~1 m). Map trzyma kolejność
  // wstawiania → najstarszy wpis wylatuje pierwszy po przekroczeniu limitu.
  private readonly routeCache = new Map<string, { at: number; route: Route }>();

  constructor(private readonly config: ConfigService) {
    this.osrmEnabled =
      (this.config.get<string>('OSRM_ENABLED') ?? 'false') === 'true';
    this.osrmBaseUrl = (
      this.config.get<string>('OSRM_BASE_URL') ??
      'https://router.project-osrm.org'
    ).replace(/\/$/, '');
    this.osrmHost = hostOf(this.osrmBaseUrl);
    this.routeBaseUrls = {
      walk: (
        this.config.get<string>('OSRM_ROUTE_WALK_URL') ??
        ROUTE_DEFAULT_URLS.walk
      ).replace(/\/$/, ''),
      drive: (
        this.config.get<string>('OSRM_ROUTE_DRIVE_URL') ??
        ROUTE_DEFAULT_URLS.drive
      ).replace(/\/$/, ''),
    };
  }

  private estimate(distanceMeters: number): TravelTime {
    const routeKm = (distanceMeters / 1000) * ROUTE_FACTOR;
    return {
      walkMinutes: Math.max(1, Math.round((routeKm / WALK_SPEED_KMH) * 60)),
      driveMinutes: Math.max(1, Math.round((routeKm / DRIVE_SPEED_KMH) * 60)),
    };
  }

  /**
   * Czasy dojścia/dojazdu dla aptek na bieżącej stronie (max ~20). Domyślnie estymator
   * haversine (zawsze dostępny). Gdy OSRM_ENABLED — czasy jazdy z OSRM /table (jeden batch),
   * pieszo z estymatora (publiczny OSRM nie ma profilu pieszego). Błąd OSRM → pełny fallback.
   */
  async getTravelTimes(
    origin: LatLng,
    targets: RoutingTarget[],
  ): Promise<TravelTime[]> {
    const fallback = targets.map((t) => this.estimate(t.distanceMeters));
    if (
      !this.osrmEnabled ||
      targets.length === 0 ||
      targets.length > OSRM_MAX_TARGETS
    ) {
      return fallback;
    }
    try {
      const coords = [origin, ...targets]
        .map((p) => `${p.lng},${p.lat}`)
        .join(';');
      const url = new URL(`${this.osrmBaseUrl}/table/v1/driving/${coords}`);
      url.searchParams.set('sources', '0');
      url.searchParams.set('annotations', 'duration');
      if (url.host !== this.osrmHost) return fallback; // SSRF-guard

      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 8_000);
      let durations: Array<number | null> | undefined;
      try {
        const res = await fetch(url, {
          redirect: 'error',
          signal: controller.signal,
        });
        if (!res.ok) return fallback;
        const data = (await res.json()) as {
          durations?: Array<Array<number | null>>;
        };
        durations = data.durations?.[0];
      } finally {
        clearTimeout(timeout);
      }
      if (!durations) return fallback;

      return targets.map((t, i) => {
        const seconds = durations[i + 1]; // [0] = źródło→źródło
        const walk = this.estimate(t.distanceMeters).walkMinutes;
        return {
          walkMinutes: walk,
          driveMinutes:
            seconds != null && Number.isFinite(seconds)
              ? Math.max(1, Math.round(seconds / 60))
              : this.estimate(t.distanceMeters).driveMinutes,
        };
      });
    } catch (e) {
      this.logger.warn(`OSRM niedostępny, estymator: ${(e as Error).message}`);
      return fallback;
    }
  }

  /**
   * Trasa A→B do narysowania na mapie (OSRM /route, pełna geometria GeoJSON).
   * Niezależna od OSRM_ENABLED — tu nie ma estymatora, który mógłby ją zastąpić.
   * null, gdy punkty są za daleko, router nie znalazł trasy albo jest niedostępny.
   */
  async getRoute(
    from: LatLng,
    to: LatLng,
    mode: RouteMode,
  ): Promise<Route | null> {
    if (haversineKm(from, to) > ROUTE_MAX_KM) return null;

    const key = [mode, from.lat, from.lng, to.lat, to.lng]
      .map((v) => (typeof v === 'number' ? v.toFixed(5) : v))
      .join(':');
    const cached = this.routeCache.get(key);
    if (cached && Date.now() - cached.at < ROUTE_CACHE_TTL_MS) {
      return cached.route;
    }

    const base = this.routeBaseUrls[mode];
    try {
      // Segment profilu w ścieżce osrm-routed ignoruje (profil wynika z instancji).
      const coords = `${from.lng},${from.lat};${to.lng},${to.lat}`;
      const profile = mode === 'walk' ? 'foot' : 'driving';
      const url = new URL(`${base}/route/v1/${profile}/${coords}`);
      url.searchParams.set('overview', 'full');
      url.searchParams.set('geometries', 'geojson');
      if (url.host !== hostOf(base)) return null; // SSRF-guard

      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 8_000);
      let data: {
        code?: string;
        routes?: Array<{
          distance: number;
          duration: number;
          geometry?: { coordinates?: [number, number][] };
        }>;
      };
      try {
        const res = await fetch(url, {
          redirect: 'error',
          signal: controller.signal,
          headers: { 'User-Agent': USER_AGENT, Accept: 'application/json' },
        });
        if (!res.ok) return null;
        data = (await res.json()) as typeof data;
      } finally {
        clearTimeout(timeout);
      }

      const r = data.routes?.[0];
      const coordinates = r?.geometry?.coordinates;
      if (data.code !== 'Ok' || !r || !coordinates || coordinates.length < 2) {
        return null;
      }
      const route: Route = {
        mode,
        distanceMeters: Math.round(r.distance),
        durationMinutes: Math.max(1, Math.round(r.duration / 60)),
        coordinates,
      };

      this.routeCache.delete(key);
      this.routeCache.set(key, { at: Date.now(), route });
      if (this.routeCache.size > ROUTE_CACHE_MAX) {
        const [oldest] = this.routeCache.keys();
        this.routeCache.delete(oldest);
      }
      return route;
    } catch (e) {
      this.logger.warn(`Trasa OSRM niedostępna: ${(e as Error).message}`);
      return null;
    }
  }
}
