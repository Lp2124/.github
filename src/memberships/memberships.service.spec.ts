import type { ConfigService } from '@nestjs/config';
import { MembershipStatus } from '@prisma/client';
import { MembershipsService } from './memberships.service';
import type { PrismaService } from '../prisma/prisma.service';
import type { AuditService } from '../audit/audit.service';
import type { AppConfig } from '../config/env';

describe('MembershipsService', () => {
  const prisma = {
    membership: {
      findFirst: jest.fn(),
      updateMany: jest.fn(),
      create: jest.fn(),
    },
    subscriptionPlan: {
      findMany: jest.fn(),
      findFirst: jest.fn(),
      findUnique: jest.fn(),
    },
  } as unknown as PrismaService;
  const config = { get: jest.fn(() => 'development') } as unknown as ConfigService<AppConfig, true>;
  const audit = { log: jest.fn().mockResolvedValue(undefined) } as unknown as AuditService;
  const service = new MembershipsService(prisma, config, audit);

  beforeEach(() => jest.clearAllMocks());

  it('returns false when user has no active membership', async () => {
    jest.spyOn(prisma.membership, 'findFirst').mockResolvedValue(null);
    await expect(service.hasActiveMembership('u1')).resolves.toBe(false);
  });

  it('returns true when user has active membership', async () => {
    jest.spyOn(prisma.membership, 'findFirst').mockResolvedValue({ id: 'm1' } as never);
    await expect(service.hasActiveMembership('u1')).resolves.toBe(true);
  });

  it('expires memberships for a user', async () => {
    jest.spyOn(prisma.membership, 'updateMany').mockResolvedValue({ count: 1 });
    await service.expireMembershipsForUser('u1');
    expect(prisma.membership.updateMany).toHaveBeenCalledWith(expect.objectContaining({ data: { status: MembershipStatus.EXPIRED } }));
  });
});
