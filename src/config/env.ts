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
  smtpHost: string;
  smtpPort: number;
  smtpUser: string;
  smtpPassword: string;
  passwordResetFrom: string;
  passwordResetUrl: string;
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
  'SMTP_HOST',
  'SMTP_PORT',
  'SMTP_USER',
  'SMTP_PASSWORD',
  'PASSWORD_RESET_FROM',
  'PASSWORD_RESET_URL',
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

  return {
    databaseUrl: readRequired(config, 'DATABASE_URL'),
    jwtSecret,
    jwtExpiresIn: readRequired(config, 'JWT_EXPIRES_IN'),
    refreshTokenSecret,
    refreshTokenExpiresIn: readRequired(config, 'REFRESH_TOKEN_EXPIRES_IN'),
    corsOrigin: readRequired(config, 'CORS_ORIGIN'),
    nodeEnv: readNodeEnv(config),
    port: readPositiveInt(config, 'PORT'),
    rateLimitWindow: readPositiveInt(config, 'RATE_LIMIT_WINDOW'),
    rateLimitMax: readPositiveInt(config, 'RATE_LIMIT_MAX'),
    smtpHost: readRequired(config, 'SMTP_HOST'),
    smtpPort: readPositiveInt(config, 'SMTP_PORT'),
    smtpUser: readRequired(config, 'SMTP_USER'),
    smtpPassword: readRequired(config, 'SMTP_PASSWORD'),
    passwordResetFrom: readRequired(config, 'PASSWORD_RESET_FROM'),
    passwordResetUrl: readRequired(config, 'PASSWORD_RESET_URL'),
  };
}

export default (): AppConfig => validateEnv(process.env);
