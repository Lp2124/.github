'use client';

import { useFormStatus } from 'react-dom';

export function SubmitButton({ label, pendingLabel = 'Guardando...' }: Readonly<{ label: string; pendingLabel?: string }>) {
  const { pending } = useFormStatus();
  return (
    <button className="rounded-lg bg-green-700 px-4 py-2 text-sm font-bold text-white hover:bg-green-800 disabled:cursor-not-allowed disabled:opacity-60" disabled={pending} type="submit">
      {pending ? pendingLabel : label}
    </button>
  );
}
