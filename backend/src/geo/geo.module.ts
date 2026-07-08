import { Module } from '@nestjs/common';
import { NominatimService } from './nominatim.service';
import { GeocodingService } from './geocoding.service';
import { RoutingService } from './routing.service';

// Warstwa geograficzna: geokodowanie (Nominatim) + czasy tras (RoutingProvider).
// Wyszukiwanie po dystansie (PostGIS) jest w PharmaciesService (zapytanie do tabeli Pharmacy).
@Module({
  providers: [NominatimService, GeocodingService, RoutingService],
  exports: [NominatimService, GeocodingService, RoutingService],
})
export class GeoModule {}
