import { Module } from '@nestjs/common';
import { GugikService } from './gugik.service';
import { NominatimService } from './nominatim.service';
import { GeocodingService } from './geocoding.service';
import { RoutingService } from './routing.service';
import { GeoController } from './geo.controller';

// Warstwa geograficzna: geokodowanie (GUGiK/PRG, zapasowo Nominatim) + czasy tras.
// Wyszukiwanie po dystansie (PostGIS) jest w PharmaciesService (zapytanie do tabeli Pharmacy).
@Module({
  controllers: [GeoController],
  providers: [GugikService, NominatimService, GeocodingService, RoutingService],
  exports: [GugikService, NominatimService, GeocodingService, RoutingService],
})
export class GeoModule {}
