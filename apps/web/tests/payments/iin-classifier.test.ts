import { describe, expect, it } from 'vitest';
import { classifyIin, normalizeIin } from '../../src/lib/payments/iin-classifier';

describe('normalizeIin', () => {
  it('removes only supported visual separators', () => {
    expect(normalizeIin('6221-26 00')).toBe('62212600');
    expect(normalizeIin('4242x')).toBe('4242x');
  });
});

describe('classifyIin', () => {
  it.each([
    ['424242', 'visa', '4', 1],
    ['510000', 'mastercard', '51–55', 2],
    ['222100', 'mastercard', '2221–2720', 4],
    ['272099', 'mastercard', '2221–2720', 4],
    ['340000', 'amex', '34', 2],
    ['370000', 'amex', '37', 2],
    ['601100', 'discover', '6011', 4],
    ['644000', 'discover', '644–649', 3],
    ['650000', 'discover', '65', 2],
    ['62212600', 'discover', '622126–622925', 6],
    ['62292599', 'discover', '622126–622925', 6]
  ] as const)('classifies %s locally as %s', (prefix, brand, range, matchedPrefixLength) => {
    expect(classifyIin(prefix)).toEqual({
      status: 'matched',
      normalized: prefix,
      brand,
      range,
      matchedPrefixLength
    });
  });

  it('rejects full PANs and unsafe characters instead of silently truncating them', () => {
    expect(classifyIin('4242424242424242')).toMatchObject({ status: 'invalid' });
    expect(classifyIin('4242<script>')).toMatchObject({ status: 'invalid' });
  });

  it('reports empty and unsupported ranges without claiming issuer information', () => {
    expect(classifyIin('')).toEqual({ status: 'empty', normalized: '' });
    expect(classifyIin('900000')).toEqual({ status: 'unknown', normalized: '900000' });
    expect(classifyIin('222000')).toEqual({ status: 'unknown', normalized: '222000' });
    expect(classifyIin('622125')).toEqual({ status: 'unknown', normalized: '622125' });
    expect(classifyIin('622926')).toEqual({ status: 'unknown', normalized: '622926' });
  });
});
