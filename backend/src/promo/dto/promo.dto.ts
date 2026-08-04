import { Transform } from 'class-transformer';
import {
  IsBoolean,
  IsInt,
  IsOptional,
  IsString,
  Matches,
  MaxLength,
} from 'class-validator';

export class CreatePromoSlideDto {
  @IsOptional()
  @IsString()
  @MaxLength(120)
  title?: string;

  @IsOptional()
  @IsString()
  @MaxLength(200)
  subtitle?: string;

  // Tylko ścieżki wewnętrzne (np. /mapa) — zapobiega open-redirect/absolutnym URL.
  @IsOptional()
  @IsString()
  @Matches(/^\/[\w\-/]*$/, {
    message: 'href musi być ścieżką wewnętrzną (np. /mapa)',
  })
  href?: string;
}

export class UpdatePromoSlideDto {
  @IsOptional()
  @IsString()
  @MaxLength(120)
  title?: string;

  @IsOptional()
  @IsString()
  @MaxLength(200)
  subtitle?: string;

  @IsOptional()
  @IsString()
  @Matches(/^\/[\w\-/]*$/, {
    message: 'href musi być ścieżką wewnętrzną (np. /mapa)',
  })
  href?: string;

  @IsOptional()
  @Transform(({ value }) => value === true || value === 'true' || value === '1')
  @IsBoolean()
  active?: boolean;

  @IsOptional()
  @Transform(({ value }) => Number(value))
  @IsInt()
  sortOrder?: number;
}
