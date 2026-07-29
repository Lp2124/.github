import { ForbiddenException } from '@nestjs/common';
import type { ExecutionContext } from '@nestjs/common';
import { UserRole, UserStatus } from '@prisma/client';
import { ActiveMembershipGuard } from './active-membership.guard';
import type { MembershipsService } from '../../memberships/memberships.service';

function contextWithUser(id: string): ExecutionContext {
  return {
    switchToHttp: () => ({
      getRequest: () => ({ user: { id, email: 'user@example.com', role: UserRole.USER, status: UserStatus.ACTIVE, emailVerified: true } }),
    }),
  } as unknown as ExecutionContext;
}

describe('ActiveMembershipGuard', () => {
  it('rejects user without active membership', async () => {
    const memberships = { hasActiveMembership: jest.fn().mockResolvedValue(false) } as unknown as MembershipsService;
    const guard = new ActiveMembershipGuard(memberships);
    await expect(guard.canActivate(contextWithUser('u1'))).rejects.toBeInstanceOf(ForbiddenException);
  });

  it('allows user with active membership', async () => {
    const memberships = { hasActiveMembership: jest.fn().mockResolvedValue(true) } as unknown as MembershipsService;
    const guard = new ActiveMembershipGuard(memberships);
    await expect(guard.canActivate(contextWithUser('u1'))).resolves.toBe(true);
  });
});
