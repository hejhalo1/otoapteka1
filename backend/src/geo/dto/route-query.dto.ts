import { Type } from 'class-transformer';
import { IsIn, IsNumber, Max, Min } from 'class-validator';
import { POLAND_BBOX } from '../geo.types';

// Query trasy A→B. Oba punkty muszą leżeć w Polsce — endpoint nie jest
// ogólnym proxy do routera (dystans dodatkowo ogranicza RoutingService).
export class RouteQueryDto {
  @Type(() => Number)
  @IsNumber()
  @Min(POLAND_BBOX.minLat)
  @Max(POLAND_BBOX.maxLat)
  fromLat!: number;

  @Type(() => Number)
  @IsNumber()
  @Min(POLAND_BBOX.minLng)
  @Max(POLAND_BBOX.maxLng)
  fromLng!: number;

  @Type(() => Number)
  @IsNumber()
  @Min(POLAND_BBOX.minLat)
  @Max(POLAND_BBOX.maxLat)
  toLat!: number;

  @Type(() => Number)
  @IsNumber()
  @Min(POLAND_BBOX.minLng)
  @Max(POLAND_BBOX.maxLng)
  toLng!: number;

  @IsIn(['walk', 'drive'])
  mode!: 'walk' | 'drive';
}
