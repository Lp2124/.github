'use client';

import { loadStripe } from '@stripe/stripe-js';
import Link from 'next/link';
import { useEffect, useMemo, useState } from 'react';
import { formatPaymentReference, getPaymentOutcome, type PaymentOutcome } from '@/lib/payments/payment-status';

interface PaymentResultProps {
  readonly clientSecret?: string;
  readonly storeId?: string;
  readonly stripePublishableKey: string;
}

const TONE_STYLES = {
  success: 'border-emerald-200 bg-emerald-50 text-emerald-950',
  pending: 'border-blue-200 bg-blue-50 text-blue-950',
  action: 'border-amber-200 bg-amber-50 text-amber-950',
  failure: 'border-red-200 bg-red-50 text-red-950'
} as const;

export function PaymentResult({ clientSecret, storeId, stripePublishableKey }: PaymentResultProps) {
  const stripePromise = useMemo(() => loadStripe(stripePublishableKey), [stripePublishableKey]);
  const [state, setState] = useState<
    | { readonly kind: 'loading' }
    | { readonly kind: 'error'; readonly message: string }
    | { readonly kind: 'result'; readonly outcome: PaymentOutcome; readonly reference: string }
  >({ kind: 'loading' });

  useEffect(() => {
    let active = true;

    async function retrieveResult() {
      if (!clientSecret) {
        setState({ kind: 'error', message: 'Falta la referencia segura de Stripe. Regresa al cobro e inténtalo nuevamente.' });
        return;
      }

      const stripe = await stripePromise;
      if (!stripe || !active) {
        if (active) setState({ kind: 'error', message: 'No fue posible cargar el proveedor de pagos.' });
        return;
      }

      const { paymentIntent, error } = await stripe.retrievePaymentIntent(clientSecret);
      if (!active) return;
      if (error || !paymentIntent) {
        setState({ kind: 'error', message: 'No fue posible consultar el estado de esta transacción.' });
        return;
      }

      setState({
        kind: 'result',
        outcome: getPaymentOutcome(paymentIntent.status),
        reference: formatPaymentReference(paymentIntent.id)
      });
    }

    void retrieveResult();
    return () => { active = false; };
  }, [clientSecret, stripePromise]);

  const checkoutHref = storeId ? `/admin/pos/payment?storeId=${encodeURIComponent(storeId)}` : '/admin/pos/payment';

  if (state.kind === 'loading') {
    return <ResultShell><p aria-live="polite" className="text-sm text-slate-600">Consultando el estado seguro del pago…</p></ResultShell>;
  }

  if (state.kind === 'error') {
    return (
      <ResultShell>
        <div className="rounded-2xl border border-red-200 bg-red-50 p-5 text-red-950" role="alert">
          <h1 className="text-xl font-bold">No se pudo verificar la transacción</h1>
          <p className="mt-2 text-sm leading-6">{state.message}</p>
        </div>
        <Link className="mt-5 inline-flex rounded-lg bg-slate-900 px-4 py-2.5 text-sm font-bold text-white" href={checkoutHref}>Volver al cobro</Link>
      </ResultShell>
    );
  }

  return (
    <ResultShell>
      <div className={`rounded-2xl border p-5 ${TONE_STYLES[state.outcome.tone]}`} aria-live="polite">
        <h1 className="text-2xl font-black">{state.outcome.title}</h1>
        <p className="mt-2 text-sm leading-6">{state.outcome.message}</p>
      </div>
      <dl className="mt-5 rounded-xl border border-slate-200 bg-slate-50 p-4">
        <dt className="text-xs font-bold uppercase tracking-wide text-slate-500">Referencia de Stripe</dt>
        <dd className="mt-1 break-all font-mono text-sm text-slate-900">{state.reference}</dd>
      </dl>
      <p className="mt-4 text-xs leading-5 text-slate-500">Este resultado describe únicamente la transacción actual. No confirma saldo, CVV, banco, titular ni que una tarjeta pueda utilizarse en otros cobros.</p>
      <Link className="mt-5 inline-flex rounded-lg bg-slate-900 px-4 py-2.5 text-sm font-bold text-white" href={checkoutHref}>
        {state.outcome.canRetry ? 'Volver a intentar el cobro' : 'Volver al punto de venta'}
      </Link>
    </ResultShell>
  );
}

function ResultShell({ children }: { readonly children: React.ReactNode }) {
  return <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">{children}</section>;
}
