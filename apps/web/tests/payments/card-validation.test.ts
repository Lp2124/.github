import { describe, expect, it } from 'vitest';
import { detectCardBrand } from '../../src/lib/payments/card-brand';
import { formatCardNumber, maskCardNumber } from '../../src/lib/payments/card-mask';
import { normalizeCardNumber, validateCardInput, validateLuhn } from '../../src/lib/payments/card-validation';

describe('normalizeCardNumber', () => {
  it('removes spaces and hyphens without silently removing other characters', () => {
    expect(normalizeCardNumber('4242-4242 4242-4242')).toBe('4242424242424242');
    expect(normalizeCardNumber('4242x4242')).toBe('4242x4242');
  });
});

describe('validateLuhn', () => {
  it.each([
    '4242424242424242',
    '5555555555554444',
    '378282246310005',
    '6011111111111117'
  ])('accepts a checksum-valid official test number: %s', (number) => {
    expect(validateLuhn(number)).toBe(true);
  });

  it.each(['', '4242424242424241', 'not-a-card', '0000000000000001'])('rejects invalid input: %s', (number) => {
    expect(validateLuhn(number)).toBe(false);
  });
});

describe('detectCardBrand', () => {
  it.each([
    ['4', 'visa'],
    ['2221', 'mastercard'],
    ['2720', 'mastercard'],
    ['34', 'amex'],
    ['6011', 'discover'],
    ['622126', 'discover'],
    ['9', 'unknown']
  ] as const)('detects %s as %s', (number, brand) => {
    expect(detectCardBrand(number)).toBe(brand);
  });

  it('does not accept Mastercard or Discover prefixes outside their assigned ranges', () => {
    expect(detectCardBrand('2220')).toBe('unknown');
    expect(detectCardBrand('2721')).toBe('unknown');
    expect(detectCardBrand('622125')).toBe('unknown');
    expect(detectCardBrand('622926')).toBe('unknown');
  });
});

describe('validateCardInput', () => {
  it.each([
    ['4242 4242 4242 4242', 'visa'],
    ['5555-5555-5555-4444', 'mastercard'],
    ['378282246310005', 'amex'],
    ['6011111111111117', 'discover']
  ] as const)('validates %s as %s', (number, brand) => {
    expect(validateCardInput(number)).toMatchObject({ valid: true, brand });
  });

  it('returns typed errors for empty, unsafe, unsupported, wrong-length, and bad-checksum input', () => {
    expect(validateCardInput('')).toMatchObject({ valid: false, error: { code: 'EMPTY' } });
    expect(validateCardInput('4242<script>')).toMatchObject({ valid: false, error: { code: 'INVALID_CHARACTERS' } });
    expect(validateCardInput('9111111111111111')).toMatchObject({ valid: false, error: { code: 'UNSUPPORTED_BRAND' } });
    expect(validateCardInput('4242')).toMatchObject({ valid: false, error: { code: 'INVALID_LENGTH' } });
    expect(validateCardInput('4242424242424241')).toMatchObject({ valid: false, error: { code: 'INVALID_CHECKSUM' } });
  });
});

describe('display helpers', () => {
  it('formats Amex using 4-6-5 grouping and limits input to 19 digits', () => {
    expect(formatCardNumber('378282246310005')).toBe('3782 822463 10005');
    expect(formatCardNumber('424242424242424212345')).toBe('4242 4242 4242 4242 123');
  });

  it('masks all but the final four digits', () => {
    expect(maskCardNumber('4242 4242 4242 4242')).toBe('•••• •••• •••• 4242');
    expect(maskCardNumber('123')).toBe('123');
  });
});
