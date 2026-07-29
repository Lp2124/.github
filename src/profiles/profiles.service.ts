import { BadRequestException, ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import type { UserProfile } from '@prisma/client';
import { AuditService } from '../audit/audit.service';
import { PrismaService } from '../prisma/prisma.service';
import { ProfileDto } from './dto/profile.dto';
import { UpdateProfileDto } from './dto/update-profile.dto';

function sanitizedText(value?: string): string | undefined {
  if (!value) return undefined;
  return value.replace(/[<>]/g, '').trim();
}

function parseAdultBirthDate(value: string): Date {
  const birthDate = new Date(value);
  if (Number.isNaN(birthDate.getTime())) throw new BadRequestException('Invalid birth date');
  const today = new Date();
  const adultDate = new Date(today.getUTCFullYear() - 18, today.getUTCMonth(), today.getUTCDate());
  if (birthDate > adultDate) throw new BadRequestException('User must be at least 18 years old');
  return birthDate;
}

@Injectable()
export class ProfilesService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly auditService: AuditService,
  ) {}

  async getMe(userId: string): Promise<UserProfile> {
    const profile = await this.prisma.userProfile.findUnique({ where: { userId } });
    if (!profile || profile.deletedAt) throw new NotFoundException('Profile not found');
    return profile;
  }

  async createMe(userId: string, dto: ProfileDto): Promise<UserProfile> {
    const existing = await this.prisma.userProfile.findUnique({ where: { userId } });
    if (existing && !existing.deletedAt) throw new ConflictException('Profile already exists');
    const profile = await this.prisma.userProfile.create({
      data: {
        userId,
        displayName: dto.displayName.trim(),
        birthDate: parseAdultBirthDate(dto.birthDate),
        gender: dto.gender,
        biography: sanitizedText(dto.biography),
        avatarUrl: dto.avatarUrl,
        language: dto.language.toLowerCase(),
        timezone: dto.timezone,
      },
    });
    await this.auditService.log({ actorUserId: userId, actionType: 'PROFILE_CREATED', entityType: 'UserProfile', entityId: profile.id });
    return profile;
  }

  async updateMe(userId: string, dto: UpdateProfileDto): Promise<UserProfile> {
    await this.getMe(userId);
    const profile = await this.prisma.userProfile.update({
      where: { userId },
      data: {
        displayName: dto.displayName?.trim(),
        birthDate: dto.birthDate ? parseAdultBirthDate(dto.birthDate) : undefined,
        gender: dto.gender,
        biography: sanitizedText(dto.biography),
        avatarUrl: dto.avatarUrl,
        language: dto.language?.toLowerCase(),
        timezone: dto.timezone,
      },
    });
    await this.auditService.log({ actorUserId: userId, actionType: 'PROFILE_UPDATED', entityType: 'UserProfile', entityId: profile.id });
    return profile;
  }
}
