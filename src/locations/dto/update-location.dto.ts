import { LocationVisibilityLevel } from '@prisma/client';
import { IsEnum, IsOptional, IsString, Length, MaxLength } from 'class-validator';

export class UpdateLocationDto {
  @IsOptional()
  @IsString()
  @Length(2, 2)
  countryCode?: string;

  @IsOptional()
  @IsString()
  @MaxLength(100)
  countryName?: string;

  @IsOptional()
  @IsString()
  @MaxLength(120)
  stateName?: string;

  @IsOptional()
  @IsString()
  @MaxLength(120)
  cityName?: string;

  @IsOptional()
  @IsEnum(LocationVisibilityLevel)
  visibilityLevel?: LocationVisibilityLevel;
}
