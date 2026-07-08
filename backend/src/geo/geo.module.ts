import { Module } from '@nestjs/common';
import { NominatimService } from './nominatim.service';
import { GeocodingService } from './geocoding.service';

// Warstwa geograficzna: geokodowanie (Nominatim). Wyszukiwanie po dystansie (PostGIS)
// i trasy (OSRM) dołączą w Fazie 2 jako osobne serwisy tego modułu.
@Module({
  providers: [NominatimService, GeocodingService],
  exports: [NominatimService, GeocodingService],
})
export class GeoModule {}
