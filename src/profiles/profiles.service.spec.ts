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
});
