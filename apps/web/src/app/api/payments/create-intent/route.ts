import { createServerClient } from '@supabase/ssr';
import { NextRequest, NextResponse } from 'next/server';
import Stripe from 'stripe';
import { z } from 'zod';
import { getServerEnv } from '@/lib/env';
import { createPaymentIntent } from '@/lib/payments/payment-provider';
import { enforcePaymentRequestSecurity, PaymentRequestError } from '@/lib/payments/request-security';

export const runtime = 'nodejs';

const requestSchema = z.object({
  amount: z.number().int().min(50).max(99_999_999),
  currency: z.enum(['mxn', 'usd']),
  storeId: z.uuid()
}).strict();

const idempotencyKeySchema = z.uuid();

async function authorizeStoreOperator(request: NextRequest, storeId: string): Promise<string> {
  const { NEXT_PUBLIC_SUPABASE_URL, NEXT_PUBLIC_SUPABASE_ANON_KEY } = getServerEnv();

  const supabase = createServerClient(NEXT_PUBLIC_SUPABASE_URL, NEXT_PUBLIC_SUPABASE_ANON_KEY, {
    cookies: {
      getAll: () => request.cookies.getAll(),
      setAll: () => undefined
    }
  });
  const { data: { user }, error: userError } = await supabase.auth.getUser();
  if (userError || !user) throw new PaymentRequestError(401, 'UNAUTHENTICATED', 'An authenticated POS session is required.');

  const { data: membership, error: membershipError } = await supabase
    .from('user_store_roles')
    .select('id')
    .eq('user_id', user.id)
    .eq('store_id', storeId)
    .in('role', ['super_admin', 'store_owner', 'employee'])
    .limit(1)
    .maybeSingle();
  if (membershipError || !membership) throw new PaymentRequestError(403, 'FORBIDDEN', 'The user cannot collect payments for this store.');
  return user.id;
}

export async function POST(request: NextRequest) {
  try {
    enforcePaymentRequestSecurity(request);
    const parsed = requestSchema.safeParse(await request.json());
    if (!parsed.success) throw new PaymentRequestError(400, 'INVALID_REQUEST', 'Amount, currency, or store is invalid.');

    const idempotencyResult = idempotencyKeySchema.safeParse(request.headers.get('x-idempotency-key'));
    if (!idempotencyResult.success) throw new PaymentRequestError(400, 'INVALID_IDEMPOTENCY_KEY', 'A valid idempotency key is required.');

    const userId = await authorizeStoreOperator(request, parsed.data.storeId);
    const result = await createPaymentIntent({
      amount: parsed.data.amount,
      currency: parsed.data.currency,
      idempotencyKey: idempotencyResult.data,
      orderReference: `pos:${parsed.data.storeId}:${userId}`
    });

    return NextResponse.json(result, { status: 201, headers: { 'cache-control': 'no-store' } });
  } catch (error) {
    if (error instanceof PaymentRequestError) {
      return NextResponse.json({ error: error.message, code: error.code }, { status: error.status, headers: { 'cache-control': 'no-store' } });
    }
    if (error instanceof SyntaxError) {
      return NextResponse.json({ error: 'Malformed JSON body.', code: 'INVALID_JSON' }, { status: 400, headers: { 'cache-control': 'no-store' } });
    }
    if (error instanceof Stripe.errors.StripeError) {
      const status = error.type === 'StripeRateLimitError' ? 503 : 502;
      return NextResponse.json({ error: 'The payment provider could not create the payment.', code: 'PROVIDER_ERROR' }, { status, headers: { 'cache-control': 'no-store' } });
    }
    return NextResponse.json({ error: 'The payment could not be initialized.', code: 'INTERNAL_ERROR' }, { status: 500, headers: { 'cache-control': 'no-store' } });
  }
}
