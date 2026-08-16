import { z } from 'zod';

const publicEnvSchema = z.object({
  NEXT_PUBLIC_APP_NAME: z.string().trim().min(1),
  NEXT_PUBLIC_APP_URL: z.string().trim().url(),
  NEXT_PUBLIC_SUPABASE_URL: z.string().trim().url(),
  NEXT_PUBLIC_SUPABASE_ANON_KEY: z.string().trim().min(1),
  NEXT_PUBLIC_WHATSAPP_CHECKOUT_NUMBER: z.string().trim().regex(/^\d{8,15}$/),
  NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY: z.string().trim().regex(/^pk_(test|live)_[A-Za-z0-9_]+$/)
});

const serverEnvSchema = publicEnvSchema.extend({
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

const validation = serverEnvSchema.safeParse({
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
});

if (!validation.success) {
  const details = validation.error.issues.map((issue) => `- ${issue.path.join('.')}: ${issue.message}`).join('\n');
  if (process.env.NODE_ENV === 'production') {
    throw new Error(`Invalid environment configuration:\n${details}`);
  } else {
    // In non-production builds (local development / CI audits) allow the build to proceed but warn
    // The application still requires real env vars at runtime; this avoids blocking local builds
    // while keeping validation logic intact for production.
    // eslint-disable-next-line no-console
    console.warn(`Warning: environment validation failed — continuing because NODE_ENV!=production:\n${details}`);
  }
}

const stripeFrameAncestors = ["'self'", 'https://js.stripe.com', 'https://hooks.stripe.com'];
const connectSources = ["'self'", 'https://api.stripe.com', 'https://*.supabase.co'];
const scriptSources = ["'self'", "'unsafe-inline'", 'https://js.stripe.com'];
if (process.env.NODE_ENV === 'development') scriptSources.push("'unsafe-eval'");

/** @type {import('next').NextConfig} */
const nextConfig = {
  async headers() {
    return [
      {
        source: '/:path*',
        headers: [
          { key: 'Content-Security-Policy', value: [
            "default-src 'self'",
            "base-uri 'self'",
            "object-src 'none'",
            `script-src ${scriptSources.join(' ')}`,
            "style-src 'self' 'unsafe-inline'",
            "img-src 'self' data: https://*.stripe.com",
            `frame-src ${stripeFrameAncestors.join(' ')}`,
            `connect-src ${connectSources.join(' ')}`,
            "form-action 'self' https://hooks.stripe.com",
            "frame-ancestors 'self'"
          ].join('; ') },
          { key: 'X-Content-Type-Options', value: 'nosniff' },
          { key: 'X-Frame-Options', value: 'SAMEORIGIN' },
          { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
          { key: 'Permissions-Policy', value: 'camera=(), microphone=(), geolocation=(), payment=(self "https://js.stripe.com")' }
        ]
      }
    ];
  }
};

export default nextConfig;
