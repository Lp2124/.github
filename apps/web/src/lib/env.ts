import { z } from 'zod';

export const publicEnvSchema = z.object({
  NEXT_PUBLIC_APP_NAME: z.string().trim().min(1),
  NEXT_PUBLIC_APP_URL: z.string().trim().url(),
  NEXT_PUBLIC_SUPABASE_URL: z.string().trim().url(),
  NEXT_PUBLIC_SUPABASE_ANON_KEY: z.string().trim().min(1),
  NEXT_PUBLIC_WHATSAPP_CHECKOUT_NUMBER: z.string().trim().regex(/^\d{8,15}$/),
  NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY: z.string().trim().regex(/^pk_(test|live)_[A-Za-z0-9_]+$/)
});

export const serverEnvSchema = publicEnvSchema.extend({
  STRIPE_MODE: z.enum(['test', 'live']),
  STRIPE_SECRET_KEY: z.string().trim().regex(/^sk_(test|live)_[A-Za-z0-9_]+$/),
  SUPABASE_SERVICE_ROLE_KEY: z.string().trim().min(1).optional(),
  ENCRYPTION_KEY: z.string().trim().min(32).optional()
}).superRefine((env, context) => {
  const secretPrefix = `sk_${env.STRIPE_MODE}_`;
  const publishablePrefix = `pk_${env.STRIPE_MODE}_`;
  if (!env.STRIPE_SECRET_KEY.startsWith(secretPrefix)) {
    context.addIssue({ code: 'custom', path: ['STRIPE_SECRET_KEY'], message: `Stripe secret key must match STRIPE_MODE=${env.STRIPE_MODE}.` });
  }
  if (!env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY.startsWith(publishablePrefix)) {
    context.addIssue({ code: 'custom', path: ['NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY'], message: `Stripe publishable key must match STRIPE_MODE=${env.STRIPE_MODE}.` });
  }
});

export type PublicEnv = z.infer<typeof publicEnvSchema>;
export type ServerEnv = z.infer<typeof serverEnvSchema>;

function envInput() {
  return {
    NEXT_PUBLIC_APP_NAME: process.env.NEXT_PUBLIC_APP_NAME,
    NEXT_PUBLIC_APP_URL: process.env.NEXT_PUBLIC_APP_URL,
    NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL,
    NEXT_PUBLIC_SUPABASE_ANON_KEY: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    NEXT_PUBLIC_WHATSAPP_CHECKOUT_NUMBER: process.env.NEXT_PUBLIC_WHATSAPP_CHECKOUT_NUMBER,
    NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY: process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY,
    STRIPE_MODE: process.env.STRIPE_MODE,
    STRIPE_SECRET_KEY: process.env.STRIPE_SECRET_KEY,
    SUPABASE_SERVICE_ROLE_KEY: process.env.SUPABASE_SERVICE_ROLE_KEY,
    ENCRYPTION_KEY: process.env.ENCRYPTION_KEY
  };
}

export function getPublicEnv(): PublicEnv {
  return publicEnvSchema.parse(envInput());
}

export function getServerEnv(): ServerEnv {
  return serverEnvSchema.parse(envInput());
}
