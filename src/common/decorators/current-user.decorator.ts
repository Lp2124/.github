import { createParamDecorator } from '@nestjs/common';
import type { ExecutionContext } from '@nestjs/common';
import type { Request } from 'express';
import { hasAuthenticatedUser } from '../utils/request-user';
import type { AuthenticatedUser } from '../types/authenticated-user';

export const CurrentUser = createParamDecorator((_data: unknown, ctx: ExecutionContext): AuthenticatedUser => {
  const request = ctx.switchToHttp().getRequest<Request>();
  if (!hasAuthenticatedUser(request)) {
    throw new Error('Authenticated user missing from request');
  }
  return request.user;
});
