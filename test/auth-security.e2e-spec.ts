import { ValidationPipe } from '@nestjs/common';
import type { INestApplication } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import type { PrismaClient } from '@prisma/client';
import * as request from 'supertest';
import { AppModule } from '../src/app.module';
import { PasswordResetDeliveryService } from '../src/auth/password-reset-delivery.service';
import { PrismaService } from '../src/prisma/prisma.service';

describe('Authentication security with PostgreSQL (e2e)', () => {
  let app: INestApplication;
  let prisma: PrismaClient;
  let deliveredToken: string | undefined;
  const email = 'security-e2e@example.test';
  const password = 'InitialPassword1!';

  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({ imports: [AppModule] })
      .overrideProvider(PasswordResetDeliveryService)
      .useValue({ send: jest.fn(async (_email: string, token: string) => void (deliveredToken = token)) })
      .compile();
    app = moduleRef.createNestApplication();
    app.setGlobalPrefix('api');
    app.useGlobalPipes(new ValidationPipe({ whitelist: true, forbidNonWhitelisted: true, transform: true }));
    await app.init();
    prisma = moduleRef.get(PrismaService);
    await prisma.user.deleteMany({ where: { email } });
  });

  afterAll(async () => {
    await prisma.user.deleteMany({ where: { email } });
    await app.close();
  });

  async function register(): Promise<string> {
    const response = await request(app.getHttpServer())
      .post('/api/auth/register')
      .send({
        email,
        password,
        ageConfirmed: true,
        termsVersion: '1',
        privacyPolicyVersion: '1',
        acceptableUsePolicyVersion: '1',
      })
      .expect(201);
    return response.body.data.tokens.refreshToken as string;
  }

  it('permits exactly one concurrent refresh and prevents multiple active descendants', async () => {
    const original = await register();
    const responses = await Promise.all([
      request(app.getHttpServer()).post('/api/auth/refresh').send({ refreshToken: original }),
      request(app.getHttpServer()).post('/api/auth/refresh').send({ refreshToken: original }),
    ]);
    expect(responses.filter(({ status }) => status === 201)).toHaveLength(1);
    expect(responses.filter(({ status }) => status === 401)).toHaveLength(1);

    const user = await prisma.user.findUniqueOrThrow({ where: { email } });
    const tokens = await prisma.refreshToken.findMany({ where: { userId: user.id } });
    expect(tokens).toHaveLength(2);
    expect(tokens.filter((token) => !token.revokedAt && !token.consumedAt)).toHaveLength(0);
    expect(tokens.filter((token) => token.consumedAt)).toHaveLength(1);
    await prisma.user.delete({ where: { id: user.id } });
  });

  it('revokes every descendant after replaying a consumed token', async () => {
    const original = await register();
    const first = await request(app.getHttpServer()).post('/api/auth/refresh').send({ refreshToken: original }).expect(201);
    const child = first.body.data.tokens.refreshToken as string;
    const second = await request(app.getHttpServer()).post('/api/auth/refresh').send({ refreshToken: child }).expect(201);
    const grandchild = second.body.data.tokens.refreshToken as string;

    await request(app.getHttpServer()).post('/api/auth/refresh').send({ refreshToken: original }).expect(401);
    await request(app.getHttpServer()).post('/api/auth/refresh').send({ refreshToken: grandchild }).expect(401);

    const user = await prisma.user.findUniqueOrThrow({ where: { email } });
    const family = await prisma.refreshToken.findMany({ where: { userId: user.id } });
    expect(family).toHaveLength(3);
    expect(family.every((token) => token.familyRevokedAt && token.revokedAt)).toBe(true);
    await prisma.user.delete({ where: { id: user.id } });
  });

  it('consumes a reset token once and revokes every prior session', async () => {
    const oldRefresh = await register();
    deliveredToken = undefined;
    await request(app.getHttpServer()).post('/api/auth/forgot-password').send({ email: email.toUpperCase() }).expect(201);
    expect(deliveredToken).toMatch(/^[a-f0-9]{64}$/);

    const user = await prisma.user.findUniqueOrThrow({ where: { email } });
    const stored = await prisma.passwordReset.findFirstOrThrow({ where: { userId: user.id }, orderBy: { createdAt: 'desc' } });
    expect(stored.tokenHash).not.toBe(deliveredToken);
    const attempts = await Promise.all([
      request(app.getHttpServer()).post('/api/auth/reset-password').send({ token: deliveredToken, password: 'ChangedPassword1!' }),
      request(app.getHttpServer()).post('/api/auth/reset-password').send({ token: deliveredToken, password: 'ChangedPassword1!' }),
    ]);
    expect(attempts.filter(({ status }) => status === 201)).toHaveLength(1);
    expect(attempts.filter(({ status }) => status === 400)).toHaveLength(1);
    await request(app.getHttpServer()).post('/api/auth/refresh').send({ refreshToken: oldRefresh }).expect(401);
  });

  it('returns the same recovery response for existing and absent accounts', async () => {
    const existing = await request(app.getHttpServer()).post('/api/auth/forgot-password').send({ email });
    const absent = await request(app.getHttpServer()).post('/api/auth/forgot-password').send({ email: 'absent@example.test' });
    expect(existing.status).toBe(absent.status);
    expect(existing.body).toEqual(absent.body);
  });

  it.each(['expired', 'used'] as const)('rejects an %s reset token', async (state) => {
    deliveredToken = undefined;
    await request(app.getHttpServer()).post('/api/auth/forgot-password').send({ email }).expect(201);
    const user = await prisma.user.findUniqueOrThrow({ where: { email } });
    const reset = await prisma.passwordReset.findFirstOrThrow({ where: { userId: user.id }, orderBy: { createdAt: 'desc' } });
    await prisma.passwordReset.update({
      where: { id: reset.id },
      data: state === 'expired' ? { expiresAt: new Date(Date.now() - 1_000) } : { usedAt: new Date() },
    });
    await request(app.getHttpServer()).post('/api/auth/reset-password').send({ token: deliveredToken, password: 'AnotherPassword1!' }).expect(400);
  });

  it.each([
    ['login', { email: 'absent@example.test', password: 'WrongPassword1!' }],
    ['forgot-password', { email: 'absent@example.test' }],
    ['reset-password', { token: 'invalid-token', password: 'ChangedPassword1!' }],
    ['refresh', { refreshToken: 'invalid-token' }],
  ])(
    'rate limits the public %s endpoint and ignores spoofed forwarding headers',
    async (path, body) => {
      let finalStatus = 0;
      for (let attempt = 0; attempt <= Number(process.env.RATE_LIMIT_MAX); attempt += 1) {
        const response = await request(app.getHttpServer())
          .post(`/api/auth/${path}`)
          .set('X-Forwarded-For', `198.51.100.${attempt % 250}`)
          .send(body);
        finalStatus = response.status;
        if (finalStatus === 429) break;
      }
      expect(finalStatus).toBe(429);
    },
    20_000,
  );
});
