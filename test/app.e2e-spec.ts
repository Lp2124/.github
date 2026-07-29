import { ValidationPipe } from '@nestjs/common';
import type { INestApplication } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { JwtService } from '@nestjs/jwt';
import { UserRole, UserStatus } from '@prisma/client';
import * as request from 'supertest';
import { AppModule } from '../src/app.module';
import { PrismaService } from '../src/prisma/prisma.service';

describe('Admin and API security (e2e)', () => {
  let app: INestApplication;
  let jwt: JwtService;

  const now = new Date('2026-01-01T00:00:00.000Z');
  const normalUser = { id: 'u1', email: 'user@example.com', passwordHash: 'hidden', status: UserStatus.ACTIVE, role: UserRole.USER, emailVerified: true, lastLoginAt: null, createdAt: now, updatedAt: now, deletedAt: null };
  const adminUser = { ...normalUser, id: 'a1', email: 'admin@example.com', role: UserRole.ADMIN };
  const prismaMock = {
    $connect: jest.fn().mockResolvedValue(undefined),
    $disconnect: jest.fn().mockResolvedValue(undefined),
    $transaction: jest.fn(async (operations: unknown[]) => Promise.all(operations)),
    user: {
      findUnique: jest.fn(async ({ where }: { where: { id?: string } }) => (where.id === 'a1' ? adminUser : normalUser)),
      findMany: jest.fn().mockResolvedValue([normalUser, adminUser]),
      count: jest.fn().mockResolvedValue(2),
    },
  };

  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({ imports: [AppModule] })
      .overrideProvider(PrismaService)
      .useValue(prismaMock)
      .compile();
    app = moduleRef.createNestApplication();
    app.setGlobalPrefix('api');
    app.useGlobalPipes(new ValidationPipe({ whitelist: true, forbidNonWhitelisted: true, transform: true }));
    jwt = moduleRef.get(JwtService);
    await app.init();
  });

  afterAll(async () => {
    await app.close();
  });

  it('denies admin route for normal user', async () => {
    const token = await jwt.signAsync({ sub: 'u1', email: 'user@example.com', role: UserRole.USER });
    await request(app.getHttpServer()).get('/api/admin/health').set('Authorization', `Bearer ${token}`).expect(403);
  });

  it('allows admin route for admin user', async () => {
    const token = await jwt.signAsync({ sub: 'a1', email: 'admin@example.com', role: UserRole.ADMIN });
    await request(app.getHttpServer()).get('/api/admin/health').set('Authorization', `Bearer ${token}`).expect(200).expect(({ body }) => {
      expect(body.success).toBe(true);
      expect(body.data).toEqual({ status: 'ok', admin: true });
    });
  });

  it('returns paginated admin users without sensitive fields', async () => {
    const token = await jwt.signAsync({ sub: 'a1', email: 'admin@example.com', role: UserRole.ADMIN });
    await request(app.getHttpServer()).get('/api/admin/users?page=1&limit=10').set('Authorization', `Bearer ${token}`).expect(200).expect(({ body }) => {
      expect(body.data.items[0]).not.toHaveProperty('passwordHash');
    });
  });
});
