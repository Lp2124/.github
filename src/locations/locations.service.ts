import { ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import type { UserLocation } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { AuditService } from '../audit/audit.service';
import { LocationDto } from './dto/location.dto';
import { UpdateLocationDto } from './dto/update-location.dto';

function normalizeName(value?: string): string | undefined {
  if (!value) return undefined;
  return value.trim().replace(/\s+/g, ' ');
}

@Injectable()
export class LocationsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly auditService: AuditService,
  ) {}

  async getMe(userId: string): Promise<UserLocation> {
    const location = await this.prisma.userLocation.findUnique({ where: { userId } });
    if (!location || location.deletedAt) throw new NotFoundException('Location not found');
    return location;
  }

  async createMe(userId: string, dto: LocationDto): Promise<UserLocation> {
    const existing = await this.prisma.userLocation.findUnique({ where: { userId } });
    if (existing && !existing.deletedAt) throw new ConflictException('Location already exists');
    const location = await this.prisma.userLocation.create({
      data: {
        userId,
        countryCode: dto.countryCode.toUpperCase(),
        countryName: normalizeName(dto.countryName) ?? dto.countryName,
        stateName: normalizeName(dto.stateName),
        cityName: normalizeName(dto.cityName),
        visibilityLevel: dto.visibilityLevel,
      },
    });
    await this.auditService.log({ actorUserId: userId, actionType: 'LOCATION_CREATED', entityType: 'UserLocation', entityId: location.id });
    return location;
  }

  async updateMe(userId: string, dto: UpdateLocationDto): Promise<UserLocation> {
    await this.getMe(userId);
    const location = await this.prisma.userLocation.update({
      where: { userId },
      data: {
        countryCode: dto.countryCode?.toUpperCase(),
        countryName: normalizeName(dto.countryName),
        stateName: normalizeName(dto.stateName),
        cityName: normalizeName(dto.cityName),
        visibilityLevel: dto.visibilityLevel,
      },
    });
    await this.auditService.log({ actorUserId: userId, actionType: 'LOCATION_UPDATED', entityType: 'UserLocation', entityId: location.id });
    return location;
  }
}
