import { describe, expect, it } from 'vitest';
import { assertSafeRedirect } from './validation';
import { checkFixedWindowRateLimit } from './rate-limit';

describe('security helpers', () => {
  it('rejects open redirects', () => {
    expect(assertSafeRedirect('https://evil.example')).toBe('/dashboard');
    expect(assertSafeRedirect('//evil.example')).toBe('/dashboard');
    expect(assertSafeRedirect('/dashboard')).toBe('/dashboard');
  });

  it('enforces fixed window limits', () => {
    const key = `test-${crypto.randomUUID()}`;
    expect(checkFixedWindowRateLimit(key, 2, 60_000).allowed).toBe(true);
    expect(checkFixedWindowRateLimit(key, 2, 60_000).allowed).toBe(true);
    expect(checkFixedWindowRateLimit(key, 2, 60_000).allowed).toBe(false);
  });
});
