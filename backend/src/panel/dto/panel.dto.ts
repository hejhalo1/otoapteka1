import { Type } from 'class-transformer';
import {
  ArrayMaxSize,
  IsArray,
  IsBoolean,
  IsDateString,
  IsEmail,
  IsIn,
  IsInt,
  IsOptional,
  IsString,
  Matches,
  Max,
  MaxLength,
  Min,
  MinLength,
  ValidateNested,
} from 'class-validator';
import { AnnouncementType } from '../../generated/prisma/enums';

const ANNOUNCEMENT_TYPES = Object.values(AnnouncementType);

export class UpdateProfileDto {
  @IsOptional() @IsString() @MaxLength(2000) description?: string;
  @IsOptional() @IsEmail() @MaxLength(200) email?: string;
  @IsOptional() @IsString() @MaxLength(40) phoneExtra?: string;
  @IsOptional() @IsBoolean() prescriptionPickup?: boolean;
}

export class HourEntryDto {
  @IsInt() @Min(0) @Max(6) dayOfWeek!: number;
  @Matches(/^\d{2}:\d{2}$/) opens!: string; // HH:MM
  @Matches(/^\d{2}:\d{2}$/) closes!: string;
  @IsOptional() @IsBoolean() is24h?: boolean;
}

export class SetHoursDto {
  @IsArray()
  @ArrayMaxSize(50)
  @ValidateNested({ each: true })
  @Type(() => HourEntryDto)
  hours!: HourEntryDto[];
}

export class CreateAnnouncementDto {
  @IsString() @MinLength(3) @MaxLength(160) title!: string;
  @IsString() @MinLength(3) @MaxLength(4000) body!: string;
  @IsIn(ANNOUNCEMENT_TYPES) type!: string;
  @IsOptional() @IsDateString() expiresAt?: string;
}

export class CreateDutyDto {
  @IsDateString() startsAt!: string;
  @IsDateString() endsAt!: string;
  @IsOptional() @IsString() @MaxLength(200) note?: string;
}

export class ServiceEntryDto {
  @IsString() @MaxLength(64) serviceId!: string;
  @IsOptional() @IsString() @MaxLength(200) note?: string;
}

export class SetServicesDto {
  @IsArray()
  @ArrayMaxSize(50)
  @ValidateNested({ each: true })
  @Type(() => ServiceEntryDto)
  services!: ServiceEntryDto[];
}
