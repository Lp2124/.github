import { LocationVisibilityLevel } from '@prisma/client';
import { IsEnum, IsOptional, IsString, Length, MaxLength } from 'class-validator';

export class LocationDto {
  @IsString()
  @Length(2, 2)
  countryCode!: string;

  @IsString()
  @MaxLength(100)
  countryName!: string;

  @IsOptional()
  @IsString()
  @MaxLength(120)
  stateName?: string;

  @IsOptional()
  @IsString()
  @MaxLength(120)
  cityName?: string;

  @IsEnum(LocationVisibilityLevel)
  visibilityLevel!: LocationVisibilityLevel;
}
