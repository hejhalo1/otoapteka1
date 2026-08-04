import {
  IsOptional,
  IsString,
  Matches,
  MaxLength,
  MinLength,
} from 'class-validator';

// Wejście publicznego wyszukiwania miejsca: miasto (wymagane) + opcjonalny kod pocztowy.
export class GeocodePlaceDto {
  @IsString()
  @MinLength(2)
  @MaxLength(80)
  city!: string;

  @IsOptional()
  @IsString()
  @Matches(/^\d{2}-\d{3}$/, { message: 'Kod pocztowy w formacie NN-NNN' })
  postal?: string;
}
