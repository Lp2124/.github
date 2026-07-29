import { CanActivate, ExecutionContext, ForbiddenException, Injectable } from '@nestjs/common';
import type { Request } from 'express';
import { MembershipsService } from '../../memberships/memberships.service';
import { hasAuthenticatedUser } from '../utils/request-user';

@Injectable()
export class ActiveMembershipGuard implements CanActivate {
  constructor(private readonly membershipsService: MembershipsService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest<Request>();
    if (!hasAuthenticatedUser(request)) throw new ForbiddenException('Authentication required');
    const hasActiveMembership = await this.membershipsService.hasActiveMembership(request.user.id);
    if (!hasActiveMembership) throw new ForbiddenException('Active membership required');
    return true;
  }
}
