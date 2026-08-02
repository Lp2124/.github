import { Module } from '@nestjs/common';
import { APP_FILTER, APP_GUARD, APP_INTERCEPTOR } from '@nestjs/core';
import { ConfigService } from '@nestjs/config';
import { ThrottlerGuard, ThrottlerModule } from '@nestjs/throttler';
import { createHash } from 'crypto';
import type { AppConfig } from './config/env';
import { AdminModule } from './admin/admin.module';
import { AuditModule } from './audit/audit.module';
import { AuthModule } from './auth/auth.module';
import { ActiveUserGuard } from './common/guards/active-user.guard';
import { JwtAuthGuard } from './common/guards/jwt-auth.guard';
import { RolesGuard } from './common/guards/roles.guard';
import { HttpExceptionFilter } from './common/filters/http-exception.filter';
import { ApiResponseInterceptor } from './common/interceptors/api-response.interceptor';
import { AppConfigModule } from './config/configuration.module';
import { LocationsModule } from './locations/locations.module';
import { MembershipsModule } from './memberships/memberships.module';
import { PrismaModule } from './prisma/prisma.module';
import { ProfilesModule } from './profiles/profiles.module';
import { SecurityModule } from './security/security.module';
import { UsersModule } from './users/users.module';

@Module({
  imports: [
    AppConfigModule,
    ThrottlerModule.forRootAsync({
      inject: [ConfigService],
      useFactory: (configService: ConfigService<AppConfig, true>) => {
        const ttl = configService.get('rateLimitWindow', { infer: true }) * 1000;
        const limit = configService.get('rateLimitMax', { infer: true });
        return [
          {
            name: 'ip',
            ttl,
            limit,
            getTracker: (request: Record<string, unknown>) => `ip:${typeof request.ip === 'string' ? request.ip : ''}`,
          },
          {
            name: 'account',
            ttl,
            limit,
            getTracker: (request: Record<string, unknown>) => {
              const body = request.body;
              const email =
                typeof body === 'object' && body !== null && 'email' in body && typeof body.email === 'string' ? body.email.trim().toLowerCase() : undefined;
              return email
                ? `account:${createHash('sha256').update(email).digest('hex')}`
                : `ip:${typeof request.ip === 'string' ? request.ip : ''}`;
            },
          },
        ];
      },
    }),
    PrismaModule,
    AuditModule,
    SecurityModule,
    UsersModule,
    AuthModule,
    ProfilesModule,
    LocationsModule,
    MembershipsModule,
    AdminModule,
  ],
  providers: [
    { provide: APP_GUARD, useClass: ThrottlerGuard },
    { provide: APP_GUARD, useClass: JwtAuthGuard },
    { provide: APP_GUARD, useClass: ActiveUserGuard },
    { provide: APP_GUARD, useClass: RolesGuard },
    { provide: APP_FILTER, useClass: HttpExceptionFilter },
    { provide: APP_INTERCEPTOR, useClass: ApiResponseInterceptor },
  ],
})
export class AppModule {}
