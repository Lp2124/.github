import { describe, expect, it, vi } from 'vitest';
import { createIdempotencyKey } from '../../src/lib/payments/idempotency';

describe('createIdempotencyKey', () => {
  it('creates a valid UUID idempotency key', () => {
    expect(createIdempotencyKey()).toMatch(/^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i);
  });

  it('uses secure random bytes when randomUUID is unavailable', () => {
    const originalCrypto = globalThis.crypto;
    const getRandomValues = vi.fn((values: Uint8Array) => {
      values.fill(17);
      return values;
    });
    vi.stubGlobal('crypto', { getRandomValues });

    expect(createIdempotencyKey()).toBe('11111111-1111-4111-9111-111111111111');
    expect(getRandomValues).toHaveBeenCalledOnce();
    vi.stubGlobal('crypto', originalCrypto);
  });
});
