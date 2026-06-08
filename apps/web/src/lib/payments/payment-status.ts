import type { PaymentIntent } from '@stripe/stripe-js';

export type PaymentOutcomeTone = 'success' | 'pending' | 'action' | 'failure';

export interface PaymentOutcome {
  readonly tone: PaymentOutcomeTone;
  readonly title: string;
  readonly message: string;
  readonly canRetry: boolean;
}

const OUTCOMES: Readonly<Record<PaymentIntent.Status, PaymentOutcome>> = {
  succeeded: {
    tone: 'success',
    title: 'Pago aprobado',
    message: 'Stripe confirmó el pago. Conserva la referencia para conciliación.',
    canRetry: false
  },
  processing: {
    tone: 'pending',
    title: 'Pago en proceso',
    message: 'El proveedor sigue procesando la transacción. No vuelvas a cobrar mientras esté pendiente.',
    canRetry: false
  },
  requires_action: {
    tone: 'action',
    title: 'Pago pendiente de autenticación',
    message: 'La transacción requiere una acción adicional del cliente antes de poder completarse.',
    canRetry: false
  },
  requires_capture: {
    tone: 'pending',
    title: 'Pago autorizado',
    message: 'La transacción fue autorizada y está pendiente de captura por el comercio.',
    canRetry: false
  },
  requires_confirmation: {
    tone: 'action',
    title: 'Pago sin confirmar',
    message: 'La transacción todavía debe confirmarse mediante el flujo seguro del proveedor.',
    canRetry: true
  },
  requires_payment_method: {
    tone: 'failure',
    title: 'Pago no completado',
    message: 'Stripe no pudo completar esta transacción. Solicita otro método de pago o vuelve a intentarlo desde el checkout.',
    canRetry: true
  },
  canceled: {
    tone: 'failure',
    title: 'Pago cancelado',
    message: 'La transacción fue cancelada y no debe entregarse mercancía con esta referencia.',
    canRetry: true
  }
};

export function getPaymentOutcome(status: PaymentIntent.Status): PaymentOutcome {
  return OUTCOMES[status];
}

export function formatPaymentReference(paymentIntentId: string): string {
  if (!/^pi_[A-Za-z0-9_]+$/.test(paymentIntentId)) return 'Referencia no disponible';
  return paymentIntentId;
}

export function buildPaymentReturnUrl(origin: string, storeId: string): string {
  const resultUrl = new URL('/admin/pos/payment/result', origin);
  resultUrl.searchParams.set('storeId', storeId);
  return resultUrl.toString();
}
