import { BadRequestException } from '@nestjs/common';
import { Gender } from '@prisma/client';
import { ProfilesService } from './profiles.service';
import type { PrismaService } from '../prisma/prisma.service';
import type { AuditService } from '../audit/audit.service';

describe('ProfilesService', () => {
  const prisma = {
    userProfile: {
      findUnique: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
    },
  } as unknown as PrismaService;
  const audit = { log: jest.fn().mockResolvedValue(undefined) } as unknown as AuditService;
  const service = new ProfilesService(prisma, audit);

  beforeEach(() => jest.clearAllMocks());

  afterEach(() => jest.useRealTimers());

  it('creates a valid adult profile and sanitizes biography', async () => {
    const created = { id: 'p1', userId: 'u1', deletedAt: null };
    jest.spyOn(prisma.userProfile, 'findUnique').mockResolvedValue(null);
    jest.spyOn(prisma.userProfile, 'create').mockResolvedValue(created as never);

    await expect(
      service.createMe('u1', {
        displayName: 'Valid User',
        birthDate: '1990-01-01',
        gender: Gender.UNDISCLOSED,
        biography: '<hello>',
        language: 'EN',
        timezone: 'UTC',
      }),
    ).resolves.toBe(created);
    expect(prisma.userProfile.create).toHaveBeenCalledWith(expect.objectContaining({ data: expect.objectContaining({ biography: 'hello' }) }));
  });

  it('rejects minors', async () => {
    jest.useFakeTimers().setSystemTime(new Date('2026-08-01T23:59:59.999Z'));
    jest.spyOn(prisma.userProfile, 'findUnique').mockResolvedValue(null);
    await expect(
      service.createMe('u1', {
        displayName: 'Minor User',
        birthDate: new Date().toISOString().slice(0, 10),
        gender: Gender.UNDISCLOSED,
        language: 'en',
        timezone: 'UTC',
      }),
    ).rejects.toBeInstanceOf(BadRequestException);
  });

  it.each([
    ['2008-08-01', true],
    ['2008-08-02', false],
    ['2024-02-30', false],
    ['2008-08-01T00:00:00Z', false],
    ['08/01/2008', false],
    ['', false],
    ['2027-01-01', false],
    ['2008-02-29', true],
  ])('validates date-only birthday %s deterministically', async (birthDate, valid) => {
    jest.useFakeTimers().setSystemTime(new Date('2026-08-01T12:00:00.000Z'));
    jest.spyOn(prisma.userProfile, 'findUnique').mockResolvedValue(null);
    jest.spyOn(prisma.userProfile, 'create').mockResolvedValue({ id: 'p1' } as never);
    const operation = service.createMe('u1', {
      displayName: 'Birthday User',
      birthDate,
      gender: Gender.UNDISCLOSED,
      language: 'en',
      timezone: 'UTC',
    });
    if (valid) await expect(operation).resolves.toBeDefined();
    else await expect(operation).rejects.toBeInstanceOf(BadRequestException);
  });
});
