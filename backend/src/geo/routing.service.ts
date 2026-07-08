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

// Prędkości/estymaty wg promptu.
const WALK_SPEED_KMH = 4.8;
const DRIVE_SPEED_KMH = 28; // miejskie
const ROUTE_FACTOR = 1.3; // trasa vs linia prosta
const OSRM_MAX_TARGETS = 24; // limit batcha /table

@Injectable()
export class RoutingService {
  private readonly logger = new Logger(RoutingService.name);
  private readonly osrmEnabled: boolean;
  private readonly osrmBaseUrl: string;
  private readonly osrmHost: string;

  constructor(private readonly config: ConfigService) {
    this.osrmEnabled =
      (this.config.get<string>('OSRM_ENABLED') ?? 'false') === 'true';
    this.osrmBaseUrl = (
      this.config.get<string>('OSRM_BASE_URL') ??
      'https://router.project-osrm.org'
    ).replace(/\/$/, '');
    this.osrmHost = (() => {
      try {
        return new URL(this.osrmBaseUrl).host;
      } catch {
        return '';
      }
    })();
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
}
