import { Controller, Get, NotFoundException, Query } from '@nestjs/common';
import { Throttle } from '@nestjs/throttler';
import { GugikService } from './gugik.service';
import { NominatimService } from './nominatim.service';
import { GeocodePlaceDto } from './dto/geocode-place.dto';

@Controller('geo')
export class GeoController {
  constructor(
    private readonly gugik: GugikService,
    private readonly nominatim: NominatimService,
  ) {}

  /**
   * GET /api/geo/geocode?city=Kraków&postal=31-062
   * Publiczne wyszukiwanie miejsca po mieście (i opcjonalnym kodzie pocztowym).
   * Zaostrzony throttle — chroni darmową usługę GUGiK przed nadużyciem.
   */
  @Throttle({ default: { ttl: 60_000, limit: 20 } })
  @Get('geocode')
  async geocode(@Query() dto: GeocodePlaceDto) {
    const city = dto.city.trim();
    // Najpierw z kodem pocztowym (precyzyjniej), potem samo miasto (centroid).
    // preferCity rozstrzyga niejednoznaczne nazwy (np. 10 wsi "Warszawa" vs stolica).
    const queries = dto.postal ? [`${dto.postal} ${city}`, city] : [city];

    for (const q of queries) {
      const hit = await this.gugik.geocodePlace(q, city);
      if (hit) return { lat: hit.lat, lng: hit.lng, label: hit.label };
    }
    throw new NotFoundException('Nie znaleziono takiej miejscowości w Polsce');
  }

  /**
   * GET /api/geo/reverse?lat=52.23&lng=21.01
   * Reverse geocode: współrzędne → nazwa miejscowości (do wskaźnika lokalizacji).
   */
  @Throttle({ default: { ttl: 60_000, limit: 30 } })
  @Get('reverse')
  async reverse(@Query('lat') lat?: string, @Query('lng') lng?: string) {
    const la = Number(lat);
    const ln = Number(lng);
    if (!Number.isFinite(la) || !Number.isFinite(ln)) return { city: null };
    return { city: await this.nominatim.reverseCity(la, ln) };
  }
}
