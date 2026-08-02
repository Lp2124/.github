export type NodeEnv = 'development' | 'test' | 'production';

export interface AppConfig {
  databaseUrl: string;
  jwtSecret: string;
  jwtExpiresIn: string;
  refreshTokenSecret: string;
  refreshTokenExpiresIn: string;
  corsOrigin: string;
  nodeEnv: NodeEnv;
  port: number;
  rateLimitWindow: number;
  rateLimitMax: number;
  trustProxyHops: number;
  smtpHost: string;
  smtpPort: number;
  smtpUser: string;
  smtpPassword: string;
  smtpSecure: boolean;
  smtpFrom: string;
  passwordResetUrl: string;
  passwordResetTokenTtlMinutes: number;
}

const requiredKeys = [
  'DATABASE_URL',
  'JWT_SECRET',
  'JWT_EXPIRES_IN',
  'REFRESH_TOKEN_SECRET',
  'REFRESH_TOKEN_EXPIRES_IN',
  'CORS_ORIGIN',
  'NODE_ENV',
  'PORT',
  'RATE_LIMIT_WINDOW',
  'RATE_LIMIT_MAX',
  'TRUST_PROXY_HOPS',
  'SMTP_HOST',
  'SMTP_PORT',
  'SMTP_USER',
  'SMTP_PASSWORD',
  'SMTP_SECURE',
  'SMTP_FROM',
  'PASSWORD_RESET_URL',
  'PASSWORD_RESET_TOKEN_TTL_MINUTES',
] as const;

type RequiredEnvKey = (typeof requiredKeys)[number];

function readRequired(config: Record<string, unknown>, key: RequiredEnvKey): string {
  const value = config[key];
  if (typeof value !== 'string' || value.trim().length === 0) {
    throw new Error(`Missing required environment variable: ${key}`);
  }
  return value.trim();
}

function readPositiveInt(config: Record<string, unknown>, key: RequiredEnvKey): number {
  const raw = readRequired(config, key);
  const value = Number.parseInt(raw, 10);
  if (!Number.isInteger(value) || value <= 0) {
    throw new Error(`Environment variable ${key} must be a positive integer`);
  }
  return value;
}

function readNonNegativeInt(config: Record<string, unknown>, key: RequiredEnvKey): number {
  const raw = readRequired(config, key);
  const value = Number(raw);
  if (!Number.isSafeInteger(value) || value < 0) throw new Error(`Environment variable ${key} must be a non-negative integer`);
  return value;
}

function readBoolean(config: Record<string, unknown>, key: RequiredEnvKey): boolean {
  const value = readRequired(config, key);
  if (value !== 'true' && value !== 'false') throw new Error(`Environment variable ${key} must be true or false`);
  return value === 'true';
}

function readNodeEnv(config: Record<string, unknown>): NodeEnv {
  const raw = readRequired(config, 'NODE_ENV');
  if (raw !== 'development' && raw !== 'test' && raw !== 'production') {
    throw new Error('NODE_ENV must be development, test, or production');
  }
  return raw;
}

function validateSecret(name: string, value: string): void {
  if (value.length < 32) {
    throw new Error(`${name} must be at least 32 characters`);
  }
}

export function validateEnv(config: Record<string, unknown>): AppConfig {
  for (const key of requiredKeys) {
    readRequired(config, key);
  }

  const jwtSecret = readRequired(config, 'JWT_SECRET');
  const refreshTokenSecret = readRequired(config, 'REFRESH_TOKEN_SECRET');
  validateSecret('JWT_SECRET', jwtSecret);
  validateSecret('REFRESH_TOKEN_SECRET', refreshTokenSecret);
  const nodeEnv = readNodeEnv(config);
  const resetUrl = new URL(readRequired(config, 'PASSWORD_RESET_URL'));
  if (!['http:', 'https:'].includes(resetUrl.protocol) || (nodeEnv === 'production' && resetUrl.protocol !== 'https:')) {
    throw new Error('PASSWORD_RESET_URL must use HTTPS in production and HTTP(S) otherwise');
  }
  const smtpFrom = readRequired(config, 'SMTP_FROM');
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(smtpFrom)) throw new Error('SMTP_FROM must be a valid email address');

  return {
    databaseUrl: readRequired(config, 'DATABASE_URL'),
    jwtSecret,
    jwtExpiresIn: readRequired(config, 'JWT_EXPIRES_IN'),
    refreshTokenSecret,
    refreshTokenExpiresIn: readRequired(config, 'REFRESH_TOKEN_EXPIRES_IN'),
    corsOrigin: readRequired(config, 'CORS_ORIGIN'),
    nodeEnv,
    port: readPositiveInt(config, 'PORT'),
    rateLimitWindow: readPositiveInt(config, 'RATE_LIMIT_WINDOW'),
    rateLimitMax: readPositiveInt(config, 'RATE_LIMIT_MAX'),
    trustProxyHops: readNonNegativeInt(config, 'TRUST_PROXY_HOPS'),
    smtpHost: readRequired(config, 'SMTP_HOST'),
    smtpPort: readPositiveInt(config, 'SMTP_PORT'),
    smtpUser: readRequired(config, 'SMTP_USER'),
    smtpPassword: readRequired(config, 'SMTP_PASSWORD'),
    smtpSecure: readBoolean(config, 'SMTP_SECURE'),
    smtpFrom,
    passwordResetUrl: resetUrl.toString(),
    passwordResetTokenTtlMinutes: readPositiveInt(config, 'PASSWORD_RESET_TOKEN_TTL_MINUTES'),
  };
}

export default (): AppConfig => validateEnv(process.env);
