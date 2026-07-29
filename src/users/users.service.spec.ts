import { UserRole, UserStatus } from '@prisma/client';
import { UsersService } from './users.service';
import type { PrismaService } from '../prisma/prisma.service';

describe('UsersService', () => {
  const now = new Date('2026-01-01T00:00:00.000Z');
  const dbUser = { id: 'u1', email: 'user@example.com', passwordHash: 'hidden', status: UserStatus.ACTIVE, role: UserRole.USER, emailVerified: false, lastLoginAt: null, createdAt: now, updatedAt: now, deletedAt: null };
  const prisma = {
    user: { findUnique: jest.fn(), update: jest.fn() },
    refreshToken: { updateMany: jest.fn() },
  } as unknown as PrismaService;
  const service = new UsersService(prisma);

  beforeEach(() => jest.clearAllMocks());

  it('gets current user without sensitive fields', async () => {
    jest.spyOn(prisma.user, 'findUnique').mockResolvedValue(dbUser);
    const result = await service.getCurrentUser('u1');
    expect(result).not.toHaveProperty('passwordHash');
    expect(result.email).toBe('user@example.com');
  });

  it('updates own email safely', async () => {
    jest.spyOn(prisma.user, 'findUnique').mockResolvedValueOnce(null);
    jest.spyOn(prisma.user, 'update').mockResolvedValue({ ...dbUser, email: 'new@example.com', emailVerified: false });
    await expect(service.updateCurrentUser('u1', { email: 'NEW@example.com' })).resolves.toMatchObject({ email: 'new@example.com', emailVerified: false });
  });

  it('soft deletes and revokes tokens', async () => {
    jest.spyOn(prisma.user, 'update').mockResolvedValue({ ...dbUser, status: UserStatus.DEACTIVATED, deletedAt: new Date() });
    jest.spyOn(prisma.refreshToken, 'updateMany').mockResolvedValue({ count: 1 });
    await expect(service.deactivateCurrentUser('u1')).resolves.toMatchObject({ status: UserStatus.DEACTIVATED });
    expect(prisma.refreshToken.updateMany).toHaveBeenCalled();
  });
});
