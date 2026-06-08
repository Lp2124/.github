import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { NextRequest } from 'next/server';
import { POST } from '../../src/app/api/payments/create-intent/route';

const endpoint = 'http://localhost:3000/api/payments/create-intent';

function request(body: unknown, headers: Record<string, string> = {}) {
  return new NextRequest(endpoint, {
    method: 'POST',
    headers: {
      'content-type': 'application/json',
      origin: 'http://localhost:3000',
      'x-forwarded-for': crypto.randomUUID(),
      'x-idempotency-key': crypto.randomUUID(),
      ...headers
    },
    body: JSON.stringify(body)
  });
}

describe('POST /api/payments/create-intent security boundary', () => {
  beforeEach(() => {
    vi.stubEnv('NEXT_PUBLIC_APP_URL', 'http://localhost:3000');
  });

  afterEach(() => vi.unstubAllEnvs());

  it('rejects cross-site requests before payment processing', async () => {
    const response = await POST(request({}, { origin: 'https://attacker.example' }));
    expect(response.status).toBe(403);
    await expect(response.json()).resolves.toMatchObject({ code: 'INVALID_ORIGIN' });
  });

  it('rejects raw card fields before schema validation', async () => {
    const response = await POST(request({
      amount: 10_000,
      currency: 'mxn',
      storeId: '123e4567-e89b-42d3-a456-426614174000',
      cardNumber: '4242424242424242',
      cvv: '123'
    }));
    expect(response.status).toBe(400);
    await expect(response.json()).resolves.toMatchObject({ code: 'RAW_CARD_DATA_FORBIDDEN' });
  });

  it('rejects nested raw card aliases before schema validation', async () => {
    const response = await POST(request({
      amount: 10_000,
      currency: 'mxn',
      storeId: '123e4567-e89b-42d3-a456-426614174000',
      payment: { pan: '4242424242424242', security_code: '123' }
    }));
    expect(response.status).toBe(400);
    await expect(response.json()).resolves.toMatchObject({ code: 'RAW_CARD_DATA_FORBIDDEN' });
  });

  it('measures the actual UTF-8 body when Content-Length is unavailable', async () => {
    const oversizedRequest = request({ padding: 'á'.repeat(1_100) });
    oversizedRequest.headers.delete('content-length');
    const response = await POST(oversizedRequest);
    expect(response.status).toBe(413);
    await expect(response.json()).resolves.toMatchObject({ code: 'PAYLOAD_TOO_LARGE' });
  });

  it('rejects malformed amounts and currencies before authentication', async () => {
    const response = await POST(request({ amount: 0.5, currency: 'btc', storeId: 'invalid' }));
    expect(response.status).toBe(400);
    await expect(response.json()).resolves.toMatchObject({ code: 'INVALID_REQUEST' });
  });
});
