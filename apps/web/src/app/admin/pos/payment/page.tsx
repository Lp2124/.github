import Link from 'next/link';
import { PaymentCheckout } from '@/components/payments/PaymentCheckout';
import { getPublicEnv } from '@/lib/env';

export default async function PosPaymentPage({ searchParams }: { readonly searchParams: Promise<{ storeId?: string }> }) {
  const { storeId } = await searchParams;
  const { NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY } = getPublicEnv();
  const validStoreId = storeId && /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(storeId) ? storeId : undefined;
  return (
    <main className="mx-auto min-h-screen max-w-xl px-4 py-12">
      <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <h1 className="text-2xl font-bold">Cobro con tarjeta</h1>
        <p className="mb-6 mt-2 text-sm text-slate-600">Los datos de tarjeta se capturan en el iframe seguro de Stripe y nunca pasan por los servidores de Liora.</p>
        <Link className="mb-6 flex items-center justify-between rounded-xl border border-indigo-200 bg-indigo-50 px-4 py-3 text-sm font-bold text-indigo-900 transition hover:border-indigo-300 hover:bg-indigo-100" href="/admin/pos/payment/lab">
          <span>Abrir laboratorio seguro de pruebas</span><span aria-hidden="true">→</span>
        </Link>
        {validStoreId ? <PaymentCheckout storeId={validStoreId} stripePublishableKey={NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY} /> : <p className="rounded-lg bg-amber-50 p-4 text-sm text-amber-900">Selecciona una tienda válida antes de iniciar el cobro.</p>}
      </section>
    </main>
  );
}
