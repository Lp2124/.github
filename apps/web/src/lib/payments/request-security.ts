import { NextRequest } from 'next/server';

const WINDOW_MS = 60_000;
const MAX_REQUESTS = 12;
const buckets = new Map<string, { count: number; resetAt: number }>();

export class PaymentRequestError extends Error {
  constructor(readonly status: number, readonly code: string, message: string) {
    super(message);
    this.name = 'PaymentRequestError';
  }
}

function getRequestIdentity(request: NextRequest): string {
  return request.headers.get('x-vercel-forwarded-for')?.split(',')[0]?.trim()
    ?? request.headers.get('x-forwarded-for')?.split(',')[0]?.trim()
    ?? 'unknown';
}

export function enforcePaymentRequestSecurity(request: NextRequest): void {
  const contentType = request.headers.get('content-type');
  if (!contentType?.toLowerCase().startsWith('application/json')) {
    throw new PaymentRequestError(415, 'UNSUPPORTED_MEDIA_TYPE', 'Content-Type must be application/json.');
  }

  const contentLength = Number(request.headers.get('content-length') ?? 0);
  if (!Number.isFinite(contentLength) || contentLength > 2_048) {
    throw new PaymentRequestError(413, 'PAYLOAD_TOO_LARGE', 'Request body is too large.');
  }

  const expectedOrigin = process.env.NEXT_PUBLIC_APP_URL;
  const origin = request.headers.get('origin');
  if (!expectedOrigin || !origin || origin !== new URL(expectedOrigin).origin) {
    throw new PaymentRequestError(403, 'INVALID_ORIGIN', 'Request origin is not allowed.');
  }

  const now = Date.now();
  const identity = getRequestIdentity(request);
  const bucket = buckets.get(identity);
  if (!bucket || now >= bucket.resetAt) {
    buckets.set(identity, { count: 1, resetAt: now + WINDOW_MS });
    return;
  }
  bucket.count += 1;
  if (bucket.count > MAX_REQUESTS) {
    throw new PaymentRequestError(429, 'RATE_LIMITED', 'Too many payment requests. Try again later.');
  }

  if (buckets.size > 10_000) {
    for (const [key, value] of buckets) if (now >= value.resetAt) buckets.delete(key);
  }
}
