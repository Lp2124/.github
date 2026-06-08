import { describe, expect, it } from 'vitest';
import { publicEnvSchema, serverEnvSchema } from '../src/lib/env';

const validEnvironment = {
  NEXT_PUBLIC_APP_NAME: 'Liora',
  NEXT_PUBLIC_APP_URL: 'https://commerce.example.com',
  NEXT_PUBLIC_SUPABASE_URL: 'https://project.supabase.co',
  NEXT_PUBLIC_SUPABASE_ANON_KEY: 'anon-key',
  NEXT_PUBLIC_WHATSAPP_CHECKOUT_NUMBER: '5210000000000',
  NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY: 'pk_test_example',
  STRIPE_MODE: 'test',
  STRIPE_SECRET_KEY: 'sk_test_example'
} as const;

describe('environment validation', () => {
  it('accepts a complete public environment', () => {
    expect(publicEnvSchema.safeParse(validEnvironment).success).toBe(true);
  });

  it('rejects missing payment configuration', () => {
    expect(serverEnvSchema.safeParse({}).success).toBe(false);
  });

  it('rejects Stripe keys whose mode does not match STRIPE_MODE', () => {
    const result = serverEnvSchema.safeParse({
      ...validEnvironment,
      STRIPE_MODE: 'live',
      STRIPE_SECRET_KEY: 'sk_test_example',
      NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY: 'pk_test_example'
    });
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues.map((issue) => issue.path.join('.'))).toEqual(
        expect.arrayContaining(['STRIPE_SECRET_KEY', 'NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY'])
      );
    }
  });
});
