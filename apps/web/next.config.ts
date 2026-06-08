import { serverEnvSchema } from './src/lib/env';

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
  throw new Error(`Invalid environment configuration:\n${details}`);
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
