import { describe, expect, it } from 'vitest';
import { detectCardBrand } from '../../src/lib/payments/card-brand';
import { validateLuhn } from '../../src/lib/payments/card-validation';
import {
  formatStripeTestCardNumber,
  STRIPE_TEST_CARD_FIXTURES,
  STRIPE_TESTING_DOCS_URL
} from '../../src/lib/payments/stripe-test-cards';

describe('Stripe test card catalog', () => {
  it('contains only unique, checksum-valid, brand-consistent fixtures', () => {
    const ids = new Set<string>();
    const numbers = new Set<string>();

    for (const fixture of STRIPE_TEST_CARD_FIXTURES) {
      expect(ids.has(fixture.id)).toBe(false);
      expect(numbers.has(fixture.number)).toBe(false);
      expect(fixture.number).toMatch(/^\d{15,16}$/);
      expect(validateLuhn(fixture.number)).toBe(true);
      expect(detectCardBrand(fixture.number)).toBe(fixture.brand);
      ids.add(fixture.id);
      numbers.add(fixture.number);
    }
  });

  it('covers success, decline, insufficient funds, and authentication scenarios', () => {
    expect(new Set(STRIPE_TEST_CARD_FIXTURES.map(({ outcome }) => outcome))).toEqual(
      new Set(['success', 'decline', 'insufficient_funds', 'authentication_required'])
    );
  });

  it('formats fixtures for display without changing their value', () => {
    const number = '4242424242424242';
    expect(formatStripeTestCardNumber(number)).toBe('4242 4242 4242 4242');
    expect(formatStripeTestCardNumber(number).replaceAll(' ', '')).toBe(number);
  });

  it('links to Stripe official HTTPS documentation', () => {
    expect(new URL(STRIPE_TESTING_DOCS_URL)).toMatchObject({ protocol: 'https:', hostname: 'docs.stripe.com' });
  });
});
