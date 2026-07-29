import { Gender } from '@prisma/client';
import { IsEnum, IsISO8601, IsOptional, IsString, IsUrl, Length, MaxLength } from 'class-validator';

export class ProfileDto {
  @IsString()
  @Length(2, 80)
  displayName!: string;

  @IsISO8601({ strict: true })
  birthDate!: string;

  @IsEnum(Gender)
  gender!: Gender;

  @IsOptional()
  @IsString()
  @MaxLength(500)
  biography?: string;

  @IsOptional()
  @IsUrl({ require_protocol: true })
  @MaxLength(2048)
  avatarUrl?: string;

  @IsString()
  @Length(2, 16)
  language!: string;

  @IsString()
  @Length(2, 64)
  timezone!: string;
}
