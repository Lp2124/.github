import type { Request } from 'express';
import type { AuthenticatedUser } from '../types/authenticated-user';

export interface RequestWithUser extends Request {
  user: AuthenticatedUser;
}

export function hasAuthenticatedUser(request: Request): request is RequestWithUser {
  const candidate = (request as { user?: unknown }).user;
  return typeof candidate === 'object' && candidate !== null && 'id' in candidate;
}
