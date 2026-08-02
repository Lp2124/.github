import { validateEnv } from './env';

function environment(overrides: Record<string, string> = {}): Record<string, string> {
  return {
    DATABASE_URL: 'postgresql://user:pass@localhost:5432/app',
    JWT_SECRET: 'access-secret-at-least-32-characters-long',
    JWT_EXPIRES_IN: '15m',
    REFRESH_TOKEN_SECRET: 'refresh-secret-at-least-32-characters-long',
    REFRESH_TOKEN_EXPIRES_IN: '30d',
    CORS_ORIGIN: 'http://localhost:3000',
    NODE_ENV: 'test',
    PORT: '4000',
    RATE_LIMIT_WINDOW: '60',
    RATE_LIMIT_MAX: '100',
    TRUST_PROXY_HOPS: '0',
    SMTP_HOST: 'smtp.example.test',
    SMTP_PORT: '587',
    SMTP_SECURE: 'false',
    SMTP_USER: 'user',
    SMTP_PASSWORD: 'password',
    SMTP_FROM: 'no-reply@example.test',
    PASSWORD_RESET_URL: 'http://localhost:3000/reset-password',
    PASSWORD_RESET_TOKEN_TTL_MINUTES: '15',
    ...overrides,
  };
}

describe('validateEnv security settings', () => {
  it('accepts an explicit zero trust-proxy hop count', () => {
    expect(validateEnv(environment()).trustProxyHops).toBe(0);
  });

  it.each(['javascript:alert(1)', 'data:text/plain,test', 'file:///tmp/reset'])('rejects unsafe reset URL %s', (passwordResetUrl) => {
    expect(() => validateEnv(environment({ PASSWORD_RESET_URL: passwordResetUrl }))).toThrow('PASSWORD_RESET_URL');
  });

  it('requires HTTPS reset URLs in production', () => {
    expect(() => validateEnv(environment({ NODE_ENV: 'production' }))).toThrow('PASSWORD_RESET_URL');
    expect(validateEnv(environment({ NODE_ENV: 'production', PASSWORD_RESET_URL: 'https://app.example.test/reset' })).passwordResetUrl).toBe(
      'https://app.example.test/reset',
    );
  });
});
