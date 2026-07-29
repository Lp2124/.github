import type { User, UserRole, UserStatus } from '@prisma/client';

export interface SafeUser {
  id: string;
  email: string;
  role: UserRole;
  status: UserStatus;
  emailVerified: boolean;
  lastLoginAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

export function toSafeUser(user: Pick<User, 'id' | 'email' | 'role' | 'status' | 'emailVerified' | 'lastLoginAt' | 'createdAt' | 'updatedAt'>): SafeUser {
  return {
    id: user.id,
    email: user.email,
    role: user.role,
    status: user.status,
    emailVerified: user.emailVerified,
    lastLoginAt: user.lastLoginAt,
    createdAt: user.createdAt,
    updatedAt: user.updatedAt,
  };
}
