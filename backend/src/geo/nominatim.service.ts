import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { GeoCoords, POLAND_BBOX } from './geo.types';

export type { GeoCoords };

@Injectable()
export class NominatimService {
  private readonly logger = new Logger(NominatimService.name);
  private readonly baseUrl: string;
  private readonly userAgent: string;
  private readonly allowedHost: string;
  private lastRequestAt = 0;
  private readonly minIntervalMs = 1000; // twardy rate limit 1 req/s (polityka Nominatim)

  constructor(private readonly config: ConfigService) {
    this.baseUrl = (
      this.config.get<string>('NOMINATIM_BASE_URL') ??
      'https://nominatim.openstreetmap.org'
    ).replace(/\/$/, '');
    this.userAgent =
      this.config.get<string>('NOMINATIM_USER_AGENT') ??
      'otoapteka.pl-sync/1.0 (kontakt@otoapteka.pl)';
    this.allowedHost = new URL(this.baseUrl).host;
  }

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

  /** Geokoduje adres. Zwraca współrzędne albo null (brak wyniku / poza Polską / błąd). */
  async geocode(query: string): Promise<GeoCoords | null> {
    await this.rateLimit();

    const url = new URL(`${this.baseUrl}/search`);
    url.searchParams.set('q', query);
    url.searchParams.set('format', 'jsonv2');
    url.searchParams.set('limit', '1');
    url.searchParams.set('countrycodes', 'pl');
    url.searchParams.set('addressdetails', '0');

    // SSRF-guard: tylko skonfigurowany host Nominatim.
    if (url.host !== this.allowedHost) {
      this.logger.error(
        `Zablokowano geokodowanie do niedozwolonego hosta: ${url.host}`,
      );
      return null;
    }

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 15_000);
    try {
      const res = await fetch(url, {
        headers: { 'User-Agent': this.userAgent, Accept: 'application/json' },
        redirect: 'error',
        signal: controller.signal,
      });
      if (!res.ok) {
        this.logger.warn(`Nominatim HTTP ${res.status} dla: ${query}`);
        return null;
      }
      const data = (await res.json()) as Array<{ lat: string; lon: string }>;
      if (!Array.isArray(data) || data.length === 0) return null;
      const lat = Number(data[0].lat);
      const lng = Number(data[0].lon);
      if (!Number.isFinite(lat) || !Number.isFinite(lng)) return null;
      if (!this.inPoland(lat, lng)) {
        this.logger.warn(`Wynik poza Polską (${lat},${lng}) dla: ${query}`);
        return null;
      }
      return { lat, lng };
    } catch (e) {
      this.logger.warn(`Błąd geokodowania "${query}": ${(e as Error).message}`);
      return null;
    } finally {
      clearTimeout(timeout);
    }
  }

  /** Reverse geocode: współrzędne → nazwa miejscowości. null gdy brak / poza Polską / błąd. */
  async reverseCity(lat: number, lng: number): Promise<string | null> {
    if (!this.inPoland(lat, lng)) return null;
    await this.rateLimit();

    const url = new URL(`${this.baseUrl}/reverse`);
    url.searchParams.set('lat', String(lat));
    url.searchParams.set('lon', String(lng));
    url.searchParams.set('format', 'jsonv2');
    url.searchParams.set('zoom', '13'); // poziom miasta/dzielnicy
    url.searchParams.set('addressdetails', '1');
    url.searchParams.set('accept-language', 'pl');

    // SSRF-guard: tylko skonfigurowany host Nominatim.
    if (url.host !== this.allowedHost) {
      this.logger.error(`Zablokowano reverse do niedozwolonego hosta: ${url.host}`);
      return null;
    }

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 15_000);
    try {
      const res = await fetch(url, {
        headers: { 'User-Agent': this.userAgent, Accept: 'application/json' },
        redirect: 'error',
        signal: controller.signal,
      });
      if (!res.ok) {
        this.logger.warn(`Nominatim reverse HTTP ${res.status} dla ${lat},${lng}`);
        return null;
      }
      const data = (await res.json()) as { address?: Record<string, string> };
      const a = data.address ?? {};
      return (
        a.city ||
        a.town ||
        a.village ||
        a.municipality ||
        a.city_district ||
        a.county ||
        null
      );
    } catch (e) {
      this.logger.warn(`Błąd reverse (${lat},${lng}): ${(e as Error).message}`);
      return null;
    } finally {
      clearTimeout(timeout);
    }
  }
}
