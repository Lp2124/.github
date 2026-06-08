'use client';

import { useId, useMemo, useState } from 'react';
import { formatCardNumber } from '@/lib/payments/card-mask';
import { validateCardInput } from '@/lib/payments/card-validation';

export interface CardInputProps {
  readonly disabled?: boolean;
  readonly onValidityChange?: (valid: boolean) => void;
}

const BRAND_LABELS = { visa: 'Visa', mastercard: 'Mastercard', amex: 'American Express', discover: 'Discover', unknown: 'Desconocida' } as const;

export function CardInput({ disabled = false, onValidityChange }: CardInputProps) {
  const inputId = useId();
  const errorId = `${inputId}-error`;
  const [value, setValue] = useState('');
  const result = useMemo(() => validateCardInput(value), [value]);
  const showError = value.length > 0 && !result.valid && result.error.code !== 'INVALID_LENGTH';

  return (
    <div className="space-y-2">
      <label className="block text-sm font-medium text-slate-800" htmlFor={inputId}>Número de tarjeta (validación local de formato)</label>
      <div className="relative">
        <input
          aria-describedby={showError ? errorId : undefined}
          aria-invalid={showError}
          autoComplete="off"
          className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 pr-36 shadow-sm focus:border-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-200"
          disabled={disabled}
          id={inputId}
          inputMode="numeric"
          maxLength={23}
          name="card-format-preview"
          onChange={(event) => {
            const formatted = formatCardNumber(event.target.value);
            setValue(formatted);
            onValidityChange?.(validateCardInput(formatted).valid);
          }}
          placeholder="4242 4242 4242 4242"
          type="text"
          value={value}
        />
        <span className="absolute inset-y-0 right-3 flex items-center text-xs font-semibold uppercase text-slate-500">
          {BRAND_LABELS[result.brand]}
        </span>
      </div>
      {showError ? <p className="text-sm text-red-700" id={errorId} role="alert">{result.error.message}</p> : null}
      <p className="text-xs text-slate-500">No incluye CVV ni vencimiento, no persiste el valor y no debe sustituir Stripe Payment Element.</p>
    </div>
  );
}
