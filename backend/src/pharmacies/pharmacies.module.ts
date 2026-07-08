import { Module } from '@nestjs/common';
import { GeoModule } from '../geo/geo.module';
import { PharmaciesController } from './pharmacies.controller';
import { PharmaciesService } from './pharmacies.service';

// Publiczne API aptek (bez auth): wyszukiwanie po dystansie (PostGIS), karta apteki, slugi.
@Module({
  imports: [GeoModule],
  controllers: [PharmaciesController],
  providers: [PharmaciesService],
  exports: [PharmaciesService],
})
export class PharmaciesModule {}
