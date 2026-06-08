'use client';

import { Elements, PaymentElement, useElements, useStripe } from '@stripe/react-stripe-js';
import { loadStripe } from '@stripe/stripe-js';
import { FormEvent, useMemo, useState } from 'react';

import { createIdempotencyKey } from '@/lib/payments/idempotency';
type Currency = 'mxn' | 'usd';

function PaymentForm({ returnUrl }: { readonly returnUrl: string }) {
  const stripe = useStripe();
  const elements = useElements();
  const [error, setError] = useState<string>();
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!stripe || !elements) return;
    setSubmitting(true);
    setError(undefined);
    const result = await stripe.confirmPayment({ elements, confirmParams: { return_url: returnUrl } });
    if (result.error) setError(result.error.message ?? 'No fue posible confirmar el pago.');
    setSubmitting(false);
  }

  return (
    <form className="space-y-5" onSubmit={handleSubmit}>
      <PaymentElement options={{ layout: 'tabs' }} />
      {error ? <p className="text-sm text-red-700" role="alert">{error}</p> : null}
      <button className="w-full rounded-lg bg-blue-700 px-4 py-3 font-semibold text-white disabled:cursor-not-allowed disabled:opacity-50" disabled={!stripe || submitting} type="submit">
        {submitting ? 'Procesando…' : 'Pagar de forma segura'}
      </button>
    </form>
  );
}

export function PaymentCheckout({ storeId, stripePublishableKey }: { readonly storeId: string; readonly stripePublishableKey: string }) {
  const stripePromise = useMemo(() => loadStripe(stripePublishableKey), [stripePublishableKey]);
  const [amount, setAmount] = useState('');
  const [currency, setCurrency] = useState<Currency>('mxn');
  const [clientSecret, setClientSecret] = useState<string>();
  const [error, setError] = useState<string>();
  const [loading, setLoading] = useState(false);
  const returnUrl = useMemo(() => typeof window === 'undefined' ? '' : `${window.location.origin}/admin/pos/payment`, []);

  async function initializePayment(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const minorUnits = Math.round(Number(amount) * 100);
    if (!Number.isSafeInteger(minorUnits) || minorUnits < 50) {
      setError('Ingresa un monto válido de al menos 0.50.');
      return;
    }
    setLoading(true);
    setError(undefined);
    try {
      const response = await fetch('/api/payments/create-intent', {
        method: 'POST',
        headers: { 'content-type': 'application/json', 'x-idempotency-key': createIdempotencyKey() },
        body: JSON.stringify({ amount: minorUnits, currency, storeId })
      });
      const payload = await response.json() as { clientSecret?: string; error?: string };
      if (!response.ok || !payload.clientSecret) throw new Error(payload.error ?? 'No fue posible iniciar el pago.');
      setClientSecret(payload.clientSecret);
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : 'Error inesperado al iniciar el pago.');
    } finally {
      setLoading(false);
    }
  }

  if (clientSecret) {
    return <Elements options={{ clientSecret, appearance: { theme: 'stripe' } }} stripe={stripePromise}><PaymentForm returnUrl={returnUrl} /></Elements>;
  }

  return (
    <form className="space-y-4" onSubmit={initializePayment}>
      <div><label className="mb-1 block text-sm font-medium" htmlFor="amount">Monto</label><input className="w-full rounded-lg border border-slate-300 px-3 py-2" id="amount" min="0.50" onChange={(event) => setAmount(event.target.value)} required step="0.01" type="number" value={amount} /></div>
      <div><label className="mb-1 block text-sm font-medium" htmlFor="currency">Moneda</label><select className="w-full rounded-lg border border-slate-300 px-3 py-2" id="currency" onChange={(event) => setCurrency(event.target.value as Currency)} value={currency}><option value="mxn">MXN</option><option value="usd">USD</option></select></div>
      {error ? <p className="text-sm text-red-700" role="alert">{error}</p> : null}
      <button className="w-full rounded-lg bg-blue-700 px-4 py-3 font-semibold text-white disabled:opacity-50" disabled={loading} type="submit">{loading ? 'Preparando…' : 'Continuar al pago'}</button>
    </form>
  );
}
