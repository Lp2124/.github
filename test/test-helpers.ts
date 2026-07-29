import { UserRole, UserStatus } from '@prisma/client';
import type { SafeUser } from '../src/users/user.presenter';

export function safeUser(overrides: Partial<SafeUser> = {}): SafeUser {
  const now = new Date('2026-01-01T00:00:00.000Z');
  return {
    id: '11111111-1111-4111-8111-111111111111',
    email: 'user@example.com',
    role: UserRole.USER,
    status: UserStatus.ACTIVE,
    emailVerified: false,
    lastLoginAt: null,
    createdAt: now,
    updatedAt: now,
    ...overrides,
  };
}
