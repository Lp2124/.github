import { LocationVisibilityLevel } from '@prisma/client';
import { LocationsService } from './locations.service';
import type { PrismaService } from '../prisma/prisma.service';
import type { AuditService } from '../audit/audit.service';

describe('LocationsService', () => {
  const prisma = {
    userLocation: { findUnique: jest.fn(), create: jest.fn(), update: jest.fn() },
  } as unknown as PrismaService;
  const audit = { log: jest.fn().mockResolvedValue(undefined) } as unknown as AuditService;
  const service = new LocationsService(prisma, audit);

  beforeEach(() => jest.clearAllMocks());

  it('creates normalized location', async () => {
    const location = { id: 'l1', userId: 'u1', deletedAt: null };
    jest.spyOn(prisma.userLocation, 'findUnique').mockResolvedValue(null);
    jest.spyOn(prisma.userLocation, 'create').mockResolvedValue(location as never);
    await expect(service.createMe('u1', { countryCode: 'us', countryName: ' United States ', stateName: ' New York ', cityName: ' New York ', visibilityLevel: LocationVisibilityLevel.STATE })).resolves.toBe(location);
    expect(prisma.userLocation.create).toHaveBeenCalledWith(expect.objectContaining({ data: expect.objectContaining({ countryCode: 'US', cityName: 'New York' }) }));
  });

  it('updates location', async () => {
    jest.spyOn(prisma.userLocation, 'findUnique').mockResolvedValue({ id: 'l1', userId: 'u1', deletedAt: null } as never);
    jest.spyOn(prisma.userLocation, 'update').mockResolvedValue({ id: 'l1', cityName: 'Boston' } as never);
    await expect(service.updateMe('u1', { cityName: ' Boston ' })).resolves.toMatchObject({ cityName: 'Boston' });
  });
});
