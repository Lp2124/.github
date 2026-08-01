import type { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { ForbiddenException, UnauthorizedException } from '@nestjs/common';
import { SecurityEventType, UserRole, UserStatus } from '@prisma/client';
import * as bcrypt from 'bcrypt';
import { AuthService } from './auth.service';
import type { PrismaService } from '../prisma/prisma.service';
import type { AuditService } from '../audit/audit.service';
import type { SecurityEventsService } from '../security/security-events.service';
import type { AppConfig } from '../config/env';
import type { PasswordResetDeliveryService } from './password-reset-delivery.service';

function user(overrides: Record<string, unknown> = {}) {
  const now = new Date('2026-01-01T00:00:00.000Z');
  return {
    id: '11111111-1111-4111-8111-111111111111',
    email: 'user@example.com',
    passwordHash: '$2b$12$not-real-not-used-here-000000000000000000',
    status: UserStatus.ACTIVE,
    role: UserRole.USER,
    emailVerified: false,
    lastLoginAt: null,
    createdAt: now,
    updatedAt: now,
    deletedAt: null,
    ...overrides,
  };
}

describe('AuthService', () => {
  const prisma = {
    user: { findUnique: jest.fn(), create: jest.fn(), update: jest.fn() },
    refreshToken: {
      create: jest.fn(),
      findUnique: jest.fn(),
      update: jest.fn(),
      updateMany: jest.fn(),
    },
    passwordReset: {
      create: jest.fn(),
      findUnique: jest.fn(),
      update: jest.fn(),
    },
    $transaction: jest.fn(),
  } as unknown as PrismaService;
  const jwt = new JwtService({
    secret: 'test-secret-at-least-32-characters-long',
    signOptions: { expiresIn: '15m' },
  });
  const config = {
    get: jest.fn((key: keyof AppConfig) => (key === 'refreshTokenExpiresIn' ? '30d' : 'test-secret-at-least-32-characters-long')),
  } as unknown as ConfigService<AppConfig, true>;
  const audit = {
    log: jest.fn().mockResolvedValue(undefined),
  } as unknown as AuditService;
  const security = {
    record: jest.fn().mockResolvedValue(undefined),
  } as unknown as SecurityEventsService;
  const delivery = {
    send: jest.fn().mockResolvedValue(undefined),
  } as unknown as PasswordResetDeliveryService;
  const service = new AuthService(prisma, jwt, config, audit, security, delivery);

  beforeEach(() => {
    jest.clearAllMocks();
    (prisma.$transaction as jest.Mock).mockImplementation(async (callback: (client: PrismaService) => Promise<unknown>) => callback(prisma));
  });

  it('registers a user successfully', async () => {
    const created = user();
    jest.spyOn(prisma.user, 'findUnique').mockResolvedValue(null);
    jest.spyOn(prisma.user, 'create').mockResolvedValue(created);
    jest.spyOn(prisma.refreshToken, 'create').mockResolvedValue({ id: 'rt1' } as never);

    const result = await service.register({
      email: 'USER@example.com',
      password: 'StrongPassword1!',
      ageConfirmed: true,
      termsVersion: '1',
      privacyPolicyVersion: '1',
      acceptableUsePolicyVersion: '1',
    });

    expect(result.user.email).toBe('user@example.com');
    expect(result.tokens.accessToken).toBeTruthy();
    expect(result.tokens.refreshToken).toBeTruthy();
  });

  it('rejects duplicate registration', async () => {
    jest.spyOn(prisma.user, 'findUnique').mockResolvedValue(user());
    await expect(
      service.register({
        email: 'user@example.com',
        password: 'StrongPassword1!',
        ageConfirmed: true,
        termsVersion: '1',
        privacyPolicyVersion: '1',
        acceptableUsePolicyVersion: '1',
      }),
    ).rejects.toThrow('Email is already registered');
  });

  it('logs in with a valid password', async () => {
    const hash = await bcrypt.hash('StrongPassword1!', 12);
    const existing = user({ passwordHash: hash });
    jest.spyOn(prisma.user, 'findUnique').mockResolvedValue(existing);
    jest.spyOn(prisma.user, 'update').mockResolvedValue({ ...existing, lastLoginAt: new Date() });
    jest.spyOn(prisma.refreshToken, 'create').mockResolvedValue({ id: 'rt1' } as never);

    await expect(
      service.login({
        email: 'user@example.com',
        password: 'StrongPassword1!',
      }),
    ).resolves.toMatchObject({ user: { id: existing.id } });
    expect(security.record).toHaveBeenCalledWith(expect.objectContaining({ eventType: SecurityEventType.LOGIN_SUCCESS }));
  });

  it('rejects invalid password and records failed login', async () => {
    const existing = user({
      passwordHash: await bcrypt.hash('StrongPassword1!', 12),
    });
    jest.spyOn(prisma.user, 'findUnique').mockResolvedValue(existing);
    await expect(service.login({ email: 'user@example.com', password: 'WrongPassword1!' })).rejects.toBeInstanceOf(UnauthorizedException);
    expect(security.record).toHaveBeenCalledWith(expect.objectContaining({ eventType: SecurityEventType.LOGIN_FAILURE }));
  });

  it('rejects suspended users', async () => {
    jest.spyOn(prisma.user, 'findUnique').mockResolvedValue(user({ status: UserStatus.SUSPENDED }));
    await expect(
      service.login({
        email: 'user@example.com',
        password: 'StrongPassword1!',
      }),
    ).rejects.toBeInstanceOf(ForbiddenException);
  });

  it('rotates a valid refresh token and rejects reuse', async () => {
    const rawRefresh = 'refresh-token';
    const token = {
      id: 'rt1',
      userId: '11111111-1111-4111-8111-111111111111',
      tokenHash: 'deterministic-hash',
      revokedAt: null,
      expiresAt: new Date(Date.now() + 60_000),
      createdAt: new Date(),
      updatedAt: new Date(),
      replacedBy: null,
    };
    jest.spyOn(prisma.refreshToken, 'findUnique').mockResolvedValue(token);
    jest.spyOn(prisma.user, 'findUnique').mockResolvedValue(user());
    jest.spyOn(prisma.refreshToken, 'create').mockResolvedValue({ id: 'rt2' } as never);
    jest.spyOn(prisma.refreshToken, 'updateMany').mockResolvedValue({ count: 1 });
    jest.spyOn(prisma.refreshToken, 'update').mockResolvedValue({ ...token, revokedAt: new Date() });
    await expect(service.refresh({ refreshToken: rawRefresh })).resolves.toHaveProperty('tokens.refreshToken');

    jest.spyOn(prisma.refreshToken, 'findUnique').mockResolvedValue({ ...token, revokedAt: new Date() });
    await expect(service.refresh({ refreshToken: rawRefresh })).rejects.toBeInstanceOf(UnauthorizedException);
  });

  it('delivers a password reset token out of band', async () => {
    jest.spyOn(prisma.user, 'findUnique').mockResolvedValue(user());
    jest.spyOn(prisma.passwordReset, 'create').mockResolvedValue({ id: 'reset-1' } as never);

    await expect(service.forgotPassword({ email: 'user@example.com' })).resolves.toEqual({ accepted: true });

    expect(delivery.send).toHaveBeenCalledWith('user@example.com', expect.any(String));
    expect(delivery.send).toHaveBeenCalledWith('user@example.com', expect.stringMatching(/^[a-f0-9]{64}$/));
  });

  it('logout revokes matching refresh token', async () => {
    const rawRefresh = 'refresh-token';
    const token = {
      id: 'rt1',
      userId: 'u1',
      tokenHash: 'deterministic-hash',
      revokedAt: null,
      expiresAt: new Date(),
      createdAt: new Date(),
      updatedAt: new Date(),
      replacedBy: null,
    };
    jest.spyOn(prisma.refreshToken, 'findUnique').mockResolvedValue(token);
    jest.spyOn(prisma.refreshToken, 'update').mockResolvedValue({ ...token, revokedAt: new Date() });
    await expect(service.logout('u1', { refreshToken: rawRefresh })).resolves.toEqual({ revoked: true });
  });
});
