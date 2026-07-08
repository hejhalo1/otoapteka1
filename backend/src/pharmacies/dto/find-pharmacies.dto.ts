import { Transform, Type } from 'class-transformer';
import {
  IsBoolean,
  IsInt,
  IsLatitude,
  IsLongitude,
  IsOptional,
  IsString,
  Matches,
  Max,
  Min,
} from 'class-validator';

// Query dla listy aptek. Walidacja twarda (whitelist w globalnym ValidationPipe).
export class FindPharmaciesDto {
  @Type(() => Number)
  @IsLatitude()
  lat!: number;

  @Type(() => Number)
  @IsLongitude()
  lng!: number;

  // Promień w km (1..50). Limit chroni przed skanem całej bazy (DoS).
  @IsOptional()
  @Type(() => Number)
  @Min(1)
  @Max(50)
  radiusKm: number = 10;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page: number = 1;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(50)
  perPage: number = 20;

  // Filtr: tylko otwarte (o czasie referencyjnym — patrz date/openAt).
  @IsOptional()
  @Transform(({ value }) => value === true || value === 'true' || value === '1')
  @IsBoolean()
  openNow: boolean = false;

  // Dzień do wyświetlenia godzin/statusu (YYYY-MM-DD, dziś..+30). Domyślnie dziś.
  @IsOptional()
  @IsString()
  @Matches(/^\d{4}-\d{2}-\d{2}$/, {
    message: 'date musi być w formacie YYYY-MM-DD',
  })
  date?: string;

  // Godzina referencyjna dla statusu (HH:MM). Bez niej — bieżąca godzina.
  @IsOptional()
  @IsString()
  @Matches(/^\d{2}:\d{2}$/, { message: 'openAt musi być w formacie HH:MM' })
  openAt?: string;
}
