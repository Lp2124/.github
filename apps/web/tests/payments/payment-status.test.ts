import { describe, expect, it } from 'vitest';
import { buildPaymentReturnUrl, formatPaymentReference, getPaymentOutcome } from '../../src/lib/payments/payment-status';

describe('getPaymentOutcome', () => {
  it.each([
    ['succeeded', 'success', false],
    ['processing', 'pending', false],
    ['requires_action', 'action', false],
    ['requires_capture', 'pending', false],
    ['requires_confirmation', 'action', true],
    ['requires_payment_method', 'failure', true],
    ['canceled', 'failure', true]
  ] as const)('maps %s to a safe transaction outcome', (status, tone, canRetry) => {
    expect(getPaymentOutcome(status)).toMatchObject({ tone, canRetry });
  });

  it('never describes a failed transaction as an invalid card', () => {
    const outcome = getPaymentOutcome('requires_payment_method');
    expect(`${outcome.title} ${outcome.message}`.toLowerCase()).not.toMatch(/tarjeta.*(inválida|funciona)/);
  });
});

describe('formatPaymentReference', () => {
  it('allows Stripe PaymentIntent identifiers and rejects arbitrary text', () => {
    expect(formatPaymentReference('pi_3Example_123')).toBe('pi_3Example_123');
    expect(formatPaymentReference('<script>alert(1)</script>')).toBe('Referencia no disponible');
  });
});


describe('buildPaymentReturnUrl', () => {
  it('preserves the authorized store context in the Stripe return URL', () => {
    expect(buildPaymentReturnUrl('https://commerce.example.com', '123e4567-e89b-42d3-a456-426614174000')).toBe(
      'https://commerce.example.com/admin/pos/payment/result?storeId=123e4567-e89b-42d3-a456-426614174000'
    );
  });
});
