import { IsIn, IsOptional, IsString, MaxLength } from 'class-validator';

export class ModerateDto {
  @IsIn(['APPROVE', 'REJECT']) action!: 'APPROVE' | 'REJECT';
  @IsOptional() @IsString() @MaxLength(500) reason?: string;
}

export class ReviewClaimDto {
  @IsIn(['APPROVE', 'REJECT']) action!: 'APPROVE' | 'REJECT';
  @IsOptional() @IsString() @MaxLength(500) note?: string;
}

export class SetActiveDto {
  @IsIn(['true', 'false', true, false] as unknown[]) isActive!: boolean;
}
