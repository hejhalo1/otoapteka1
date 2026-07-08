import { Controller, Get, Param, Query } from '@nestjs/common';
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

  // GET /api/pharmacies/:slug?date=YYYY-MM-DD
  @Get(':slug')
  findBySlug(@Param('slug') slug: string, @Query('date') date?: string) {
    return this.pharmacies.findBySlug(slug, date);
  }
}
