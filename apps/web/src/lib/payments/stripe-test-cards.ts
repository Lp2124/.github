import type { SupportedCardBrand } from './iin-classifier';

export type StripeTestOutcome = 'success' | 'decline' | 'insufficient_funds' | 'authentication_required';

export interface StripeTestCardFixture {
  readonly id: string;
  readonly label: string;
  readonly description: string;
  readonly number: string;
  readonly brand: SupportedCardBrand;
  readonly outcome: StripeTestOutcome;
}

export const STRIPE_TESTING_DOCS_URL = 'https://docs.stripe.com/testing?testing-method=payment-methods';

/**
 * Public test values documented by Stripe. These fixtures must only be used
 * with Stripe test-mode keys or a Stripe Sandbox. Never send them to Liora APIs.
 */
export const STRIPE_TEST_CARD_FIXTURES: readonly StripeTestCardFixture[] = [
  {
    id: 'visa-success',
    label: 'Visa · pago aprobado',
    description: 'Simula un pago con tarjeta exitoso.',
    number: '4242424242424242',
    brand: 'visa',
    outcome: 'success'
  },
  {
    id: 'mastercard-success',
    label: 'Mastercard · pago aprobado',
    description: 'Simula un pago Mastercard exitoso.',
    number: '5555555555554444',
    brand: 'mastercard',
    outcome: 'success'
  },
  {
    id: 'amex-success',
    label: 'American Express · pago aprobado',
    description: 'Simula un pago American Express exitoso.',
    number: '378282246310005',
    brand: 'amex',
    outcome: 'success'
  },
  {
    id: 'discover-success',
    label: 'Discover · pago aprobado',
    description: 'Simula un pago Discover exitoso.',
    number: '6011111111111117',
    brand: 'discover',
    outcome: 'success'
  },
  {
    id: 'generic-decline',
    label: 'Rechazo genérico',
    description: 'El emisor simulado rechaza el pago.',
    number: '4000000000000002',
    brand: 'visa',
    outcome: 'decline'
  },
  {
    id: 'insufficient-funds',
    label: 'Fondos insuficientes',
    description: 'Devuelve el código de rechazo insufficient_funds.',
    number: '4000000000009995',
    brand: 'visa',
    outcome: 'insufficient_funds'
  },
  {
    id: '3ds-required',
    label: 'Autenticación 3D Secure',
    description: 'Requiere completar autenticación 3D Secure.',
    number: '4000002500003155',
    brand: 'visa',
    outcome: 'authentication_required'
  }
];

export function formatStripeTestCardNumber(number: string): string {
  const groups = number.match(/.{1,4}/g);
  return groups?.join(' ') ?? number;
}
