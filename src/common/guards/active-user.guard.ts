import { CanActivate, ExecutionContext, ForbiddenException, Injectable } from '@nestjs/common';
import { UserStatus } from '@prisma/client';
import type { Request } from 'express';
import { hasAuthenticatedUser } from '../utils/request-user';

@Injectable()
export class ActiveUserGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest<Request>();
    if (!hasAuthenticatedUser(request)) return true;
    if (request.user.status !== UserStatus.ACTIVE && request.user.status !== UserStatus.PENDING_VERIFICATION) {
      throw new ForbiddenException('Account is not active');
    }
    return true;
  }
}
