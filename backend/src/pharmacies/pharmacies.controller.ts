import { Controller, Get, NotFoundException, Param, Query } from '@nestjs/common';
import { FindPharmaciesDto } from './dto/find-pharmacies.dto';
import { PharmaciesService } from './pharmacies.service';

@Controller('pharmacies')
export class PharmaciesController {
  constructor(private readonly pharmacies: PharmaciesService) {}

  // GET /api/pharmacies?lat&lng&radiusKm&date&openNow&openAt&page&perPage
  @Get()
  findNearby(@Query() dto: FindPharmaciesDto) {
    return this.pharmacies.findNearby(dto);
  }

  // GET /api/pharmacies/slugs — dla sitemapy (musi być PRZED :slug).
  @Get('slugs')
  getSlugs() {
    return this.pharmacies.getAllSlugs();
  }

  // Katalog miast (strony SEO). Wszystkie PRZED :slug, by nie zostały złapane.
  @Get('cities')
  listCities() {
    return this.pharmacies.listCities();
  }

  // GET /api/pharmacies/cities/resolve?q=warszawa — dopasowanie wpisanej nazwy.
  @Get('cities/resolve')
  resolveCity(@Query('q') q?: string) {
    return q ? this.pharmacies.resolveCity(q) : null;
  }

  // GET /api/pharmacies/cities/:voivodeship/:city — pojedyncze miasto (centroid+liczność).
  @Get('cities/:voivodeship/:city')
  async findCity(@Param('voivodeship') woj: string, @Param('city') city: string) {
    const hit = await this.pharmacies.findCity(woj, city);
    if (!hit) throw new NotFoundException('Nie znaleziono miasta');
    return hit;
  }

  // GET /api/pharmacies/count — liczba aptek w bazie (statystyka). PRZED :slug.
  @Get('count')
  count() {
    return this.pharmacies.countActive();
  }

  // GET /api/pharmacies/:slug?date=YYYY-MM-DD
  @Get(':slug')
  findBySlug(@Param('slug') slug: string, @Query('date') date?: string) {
    return this.pharmacies.findBySlug(slug, date);
  }
}
