import type { Metadata } from 'next';
import { PaymentResult } from '@/components/payments/PaymentResult';
import { getPublicEnv } from '@/lib/env';

export const metadata: Metadata = {
  title: 'Resultado del pago',
  robots: { index: false, follow: false }
};

interface PaymentResultPageProps {
  readonly searchParams: Promise<{
    payment_intent_client_secret?: string;
    storeId?: string;
  }>;
}

export default async function PaymentResultPage({ searchParams }: PaymentResultPageProps) {
  const { payment_intent_client_secret: clientSecret, storeId } = await searchParams;
  const { NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY } = getPublicEnv();
  const validStoreId = storeId && /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(storeId)
    ? storeId
    : undefined;

  return (
    <main className="mx-auto min-h-screen max-w-xl px-4 py-12">
      <PaymentResult clientSecret={clientSecret} storeId={validStoreId} stripePublishableKey={NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY} />
    </main>
  );
}
