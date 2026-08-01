import { BadRequestException, ConflictException, ForbiddenException, Injectable, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { SecurityEventType, SecuritySeverity, UserStatus } from '@prisma/client';
import type { User } from '@prisma/client';
import * as bcrypt from 'bcrypt';
import { createHmac, randomBytes } from 'crypto';
import type { AppConfig } from '../config/env';
import { PrismaService } from '../prisma/prisma.service';
import { AuditService } from '../audit/audit.service';
import { SecurityEventsService } from '../security/security-events.service';
import { toSafeUser, type SafeUser } from '../users/user.presenter';
import { ForgotPasswordDto } from './dto/forgot-password.dto';
import { LoginDto } from './dto/login.dto';
import { RefreshTokenDto } from './dto/refresh-token.dto';
import { RegisterDto } from './dto/register.dto';
import { ResetPasswordDto } from './dto/reset-password.dto';
import { PasswordResetDeliveryService } from './password-reset-delivery.service';

export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
}

export interface AuthResponse {
  user: SafeUser;
  tokens: AuthTokens;
}

function parseDurationMs(value: string): number {
  const match = /^(\d+)([smhd])$/.exec(value);
  if (!match) throw new Error(`Invalid duration: ${value}`);
  const amount = Number.parseInt(match[1] ?? '0', 10);
  const unit = match[2];
  const multipliers: Record<string, number> = {
    s: 1000,
    m: 60_000,
    h: 3_600_000,
    d: 86_400_000,
  };
  return amount * (multipliers[unit ?? 's'] ?? 1000);
}

@Injectable()
export class AuthService {
  private readonly refreshTokenTtlMs: number;
  private readonly refreshTokenSecret: string;

  constructor(
    private readonly prisma: PrismaService,
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService<AppConfig, true>,
    private readonly auditService: AuditService,
    private readonly securityEventsService: SecurityEventsService,
    private readonly passwordResetDelivery: PasswordResetDeliveryService,
  ) {
    this.refreshTokenTtlMs = parseDurationMs(this.configService.get('refreshTokenExpiresIn', { infer: true }));
    this.refreshTokenSecret = this.configService.get('refreshTokenSecret', {
      infer: true,
    });
  }

  async register(dto: RegisterDto, ipAddress?: string, userAgent?: string): Promise<AuthResponse> {
    if (!dto.ageConfirmed) throw new BadRequestException('Age confirmation is required');
    const email = dto.email.toLowerCase();
    const existing = await this.prisma.user.findUnique({ where: { email } });
    if (existing) throw new ConflictException('Email is already registered');

    const passwordHash = await bcrypt.hash(dto.password, 12);
    const user = await this.prisma.user.create({
      data: {
        email,
        passwordHash,
        status: UserStatus.ACTIVE,
        termsAcceptances: {
          create: {
            termsVersion: dto.termsVersion,
            privacyPolicyVersion: dto.privacyPolicyVersion,
            acceptableUsePolicyVersion: dto.acceptableUsePolicyVersion,
            ageConfirmed: dto.ageConfirmed,
            ipAddress,
            userAgent,
          },
        },
      },
    });
    await this.auditService.log({
      actorUserId: user.id,
      actionType: 'USER_REGISTERED',
      entityType: 'User',
      entityId: user.id,
    });
    return this.authResponse(user);
  }

  async login(dto: LoginDto, ipAddress?: string, userAgent?: string): Promise<AuthResponse> {
    const email = dto.email.toLowerCase();
    const user = await this.prisma.user.findUnique({ where: { email } });
    if (!user) {
      await this.securityEventsService.record({
        eventType: SecurityEventType.LOGIN_FAILURE,
        severity: SecuritySeverity.MEDIUM,
        ipAddress,
        userAgent,
      });
      throw new UnauthorizedException('Invalid email or password');
    }
    if (user.status === UserStatus.SUSPENDED || user.status === UserStatus.DELETED || user.deletedAt) {
      await this.securityEventsService.record({
        userId: user.id,
        eventType: SecurityEventType.ACCOUNT_SUSPENDED_LOGIN_ATTEMPT,
        severity: SecuritySeverity.HIGH,
        ipAddress,
        userAgent,
      });
      throw new ForbiddenException('Account is not allowed to sign in');
    }
    const validPassword = await bcrypt.compare(dto.password, user.passwordHash);
    if (!validPassword) {
      await this.securityEventsService.record({
        userId: user.id,
        eventType: SecurityEventType.LOGIN_FAILURE,
        severity: SecuritySeverity.MEDIUM,
        ipAddress,
        userAgent,
      });
      throw new UnauthorizedException('Invalid email or password');
    }
    const updated = await this.prisma.user.update({
      where: { id: user.id },
      data: { lastLoginAt: new Date() },
    });
    await this.securityEventsService.record({
      userId: user.id,
      eventType: SecurityEventType.LOGIN_SUCCESS,
      ipAddress,
      userAgent,
    });
    await this.auditService.log({
      actorUserId: user.id,
      actionType: 'USER_LOGIN',
      entityType: 'User',
      entityId: user.id,
    });
    return this.authResponse(updated);
  }

  async logout(userId: string, dto: RefreshTokenDto): Promise<{ revoked: boolean }> {
    await this.revokeMatchingRefreshToken(userId, dto.refreshToken);
    await this.auditService.log({
      actorUserId: userId,
      actionType: 'USER_LOGOUT',
      entityType: 'User',
      entityId: userId,
    });
    return { revoked: true };
  }

  async refresh(dto: RefreshTokenDto, ipAddress?: string, userAgent?: string): Promise<AuthResponse> {
    const token = await this.findRefreshToken(dto.refreshToken);
    if (!token || token.revokedAt || token.expiresAt <= new Date()) {
      if (token?.userId) {
        await this.securityEventsService.record({
          userId: token.userId,
          eventType: SecurityEventType.REFRESH_TOKEN_REUSE_DETECTED,
          severity: SecuritySeverity.CRITICAL,
          ipAddress,
          userAgent,
        });
        await this.prisma.refreshToken.updateMany({
          where: { userId: token.userId, revokedAt: null },
          data: { revokedAt: new Date() },
        });
      }
      throw new UnauthorizedException('Invalid refresh token');
    }
    const user = await this.prisma.user.findUnique({
      where: { id: token.userId },
    });
    if (!user || user.deletedAt || user.status === UserStatus.SUSPENDED || user.status === UserStatus.DELETED) {
      throw new UnauthorizedException('Invalid session');
    }
    const accessToken = await this.signAccessToken(user);
    const refreshToken = randomBytes(48).toString('base64url');
    const now = new Date();
    await this.prisma.$transaction(async (transaction) => {
      const consumed = await transaction.refreshToken.updateMany({
        where: { id: token.id, revokedAt: null, expiresAt: { gt: now } },
        data: { revokedAt: now },
      });
      if (consumed.count !== 1) throw new UnauthorizedException('Invalid refresh token');
      const replacement = await transaction.refreshToken.create({
        data: {
          userId: user.id,
          tokenHash: this.hashToken(refreshToken),
          expiresAt: new Date(now.getTime() + this.refreshTokenTtlMs),
        },
      });
      await transaction.refreshToken.update({
        where: { id: token.id },
        data: { replacedBy: replacement.id },
      });
    });
    await this.securityEventsService.record({
      userId: user.id,
      eventType: SecurityEventType.REFRESH_TOKEN_ROTATED,
      ipAddress,
      userAgent,
    });
    return { user: toSafeUser(user), tokens: { accessToken, refreshToken } };
  }

  async forgotPassword(dto: ForgotPasswordDto): Promise<{ accepted: boolean }> {
    const user = await this.prisma.user.findUnique({
      where: { email: dto.email.toLowerCase() },
    });
    if (user && !user.deletedAt) {
      const token = randomBytes(32).toString('hex');
      await this.prisma.passwordReset.create({
        data: {
          userId: user.id,
          tokenHash: this.hashToken(token),
          expiresAt: new Date(Date.now() + 15 * 60_000),
        },
      });
      await this.passwordResetDelivery.send(user.email, token);
      await this.securityEventsService.record({
        userId: user.id,
        eventType: SecurityEventType.PASSWORD_RESET_REQUESTED,
      });
    }
    return { accepted: true };
  }

  async resetPassword(dto: ResetPasswordDto): Promise<{ reset: boolean }> {
    const reset = await this.prisma.passwordReset.findUnique({
      where: { tokenHash: this.hashToken(dto.token) },
    });
    if (!reset || reset.usedAt || reset.expiresAt <= new Date()) {
      throw new BadRequestException('Invalid or expired password reset token');
    }
    await this.prisma.$transaction([
      this.prisma.user.update({
        where: { id: reset.userId },
        data: { passwordHash: await bcrypt.hash(dto.password, 12) },
      }),
      this.prisma.passwordReset.update({
        where: { id: reset.id },
        data: { usedAt: new Date() },
      }),
      this.prisma.refreshToken.updateMany({
        where: { userId: reset.userId, revokedAt: null },
        data: { revokedAt: new Date() },
      }),
    ]);
    await this.securityEventsService.record({
      userId: reset.userId,
      eventType: SecurityEventType.PASSWORD_RESET_COMPLETED,
    });
    return { reset: true };
  }

  private async authResponse(user: User): Promise<AuthResponse> {
    const accessToken = await this.signAccessToken(user);
    const refreshToken = randomBytes(48).toString('base64url');
    await this.prisma.refreshToken.create({
      data: {
        userId: user.id,
        tokenHash: this.hashToken(refreshToken),
        expiresAt: new Date(Date.now() + this.refreshTokenTtlMs),
      },
    });
    return { user: toSafeUser(user), tokens: { accessToken, refreshToken } };
  }

  private signAccessToken(user: User): Promise<string> {
    return this.jwtService.signAsync({
      sub: user.id,
      email: user.email,
      role: user.role,
    });
  }

  private hashToken(rawToken: string): string {
    return createHmac('sha256', this.refreshTokenSecret).update(rawToken).digest('hex');
  }

  private findRefreshToken(rawToken: string) {
    return this.prisma.refreshToken.findUnique({
      where: { tokenHash: this.hashToken(rawToken) },
    });
  }

  private async revokeMatchingRefreshToken(userId: string, rawToken: string): Promise<void> {
    await this.prisma.refreshToken.updateMany({
      where: { userId, tokenHash: this.hashToken(rawToken), revokedAt: null },
      data: { revokedAt: new Date() },
    });
  }
}
