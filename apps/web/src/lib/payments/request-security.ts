import { NextRequest } from 'next/server';

const WINDOW_MS = 60_000;
const MAX_REQUESTS = 12;
const MAX_BODY_BYTES = 2_048;
const buckets = new Map<string, { count: number; resetAt: number }>();
const RAW_CARD_FIELD_NAMES = new Set([
  'cardnumber',
  'cvc',
  'cvv',
  'expiration',
  'expirationdate',
  'expmonth',
  'expyear',
  'pan',
  'securitycode'
]);

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

function normalizeFieldName(fieldName: string): string {
  return fieldName.toLowerCase().replace(/[^a-z0-9]/g, '');
}

function containsRawCardField(value: unknown): boolean {
  if (Array.isArray(value)) return value.some(containsRawCardField);
  if (value === null || typeof value !== 'object') return false;

  return Object.entries(value).some(([fieldName, fieldValue]) => (
    RAW_CARD_FIELD_NAMES.has(normalizeFieldName(fieldName)) || containsRawCardField(fieldValue)
  ));
}

export function enforcePaymentRequestSecurity(request: NextRequest): void {
  const contentType = request.headers.get('content-type');
  if (!contentType?.toLowerCase().startsWith('application/json')) {
    throw new PaymentRequestError(415, 'UNSUPPORTED_MEDIA_TYPE', 'Content-Type must be application/json.');
  }

  const contentLengthHeader = request.headers.get('content-length');
  if (contentLengthHeader !== null) {
    const contentLength = Number(contentLengthHeader);
    if (!Number.isFinite(contentLength) || contentLength < 0 || contentLength > MAX_BODY_BYTES) {
      throw new PaymentRequestError(413, 'PAYLOAD_TOO_LARGE', 'Request body is too large.');
    }
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

export async function parsePaymentJsonBody(request: NextRequest): Promise<unknown> {
  const rawBody = await request.text();
  if (new TextEncoder().encode(rawBody).byteLength > MAX_BODY_BYTES) {
    throw new PaymentRequestError(413, 'PAYLOAD_TOO_LARGE', 'Request body is too large.');
  }

  const body: unknown = JSON.parse(rawBody);
  if (containsRawCardField(body)) {
    throw new PaymentRequestError(
      400,
      'RAW_CARD_DATA_FORBIDDEN',
      'Raw card data is forbidden. Use Stripe Payment Element tokenization.'
    );
  }
  return body;
}
