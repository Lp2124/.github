import Stripe from 'stripe';
import { getServerEnv } from '@/lib/env';

export const SUPPORTED_PAYMENT_CURRENCIES = ['usd', 'mxn'] as const;
export type PaymentCurrency = (typeof SUPPORTED_PAYMENT_CURRENCIES)[number];

export interface CreatePaymentIntentInput {
  readonly amount: number;
  readonly currency: PaymentCurrency;
  readonly idempotencyKey: string;
  readonly orderReference?: string;
}

let stripeClient: Stripe | undefined;

export function getStripeClient(): Stripe {
  const { STRIPE_SECRET_KEY: secretKey } = getServerEnv();
  stripeClient ??= new Stripe(secretKey, { maxNetworkRetries: 2 });
  return stripeClient;
}

export async function createPaymentIntent(input: CreatePaymentIntentInput): Promise<{
  readonly clientSecret: string;
  readonly paymentIntentId: string;
}> {
  if (!Number.isSafeInteger(input.amount) || input.amount < 50 || input.amount > 99_999_999) {
    throw new RangeError('Payment amount must be an integer between 50 and 99,999,999 minor units.');
  }
  if (!SUPPORTED_PAYMENT_CURRENCIES.includes(input.currency)) {
    throw new RangeError('Unsupported payment currency.');
  }

  const intent = await getStripeClient().paymentIntents.create(
    {
      amount: input.amount,
      currency: input.currency,
      automatic_payment_methods: { enabled: true },
      metadata: input.orderReference ? { order_reference: input.orderReference } : undefined
    },
    { idempotencyKey: input.idempotencyKey }
  );

  if (!intent.client_secret) throw new Error('Stripe did not return a client secret.');
  return { clientSecret: intent.client_secret, paymentIntentId: intent.id };
}
