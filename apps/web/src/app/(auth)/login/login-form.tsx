'use client';

import { useActionState } from 'react';
import { useSearchParams } from 'next/navigation';
import { signInAction, type AuthActionState } from '@/app/actions/auth';

const initialState: AuthActionState = {};

export function LoginForm() {
  const searchParams = useSearchParams();
  const [state, formAction, pending] = useActionState(signInAction, initialState);
  const redirectTo = searchParams.get('redirectTo') ?? '/dashboard';

  return (
    <form action={formAction} className="space-y-4 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
      <input type="hidden" name="redirectTo" value={redirectTo} />
      <div>
        <label className="block text-sm font-semibold text-slate-700" htmlFor="email">Correo electrónico</label>
        <input
          className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 outline-none focus:border-green-700 focus:ring-2 focus:ring-green-100"
          id="email"
          name="email"
          type="email"
          autoComplete="email"
          required
          maxLength={254}
        />
      </div>
      <div>
        <label className="block text-sm font-semibold text-slate-700" htmlFor="password">Contraseña</label>
        <input
          className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 outline-none focus:border-green-700 focus:ring-2 focus:ring-green-100"
          id="password"
          name="password"
          type="password"
          autoComplete="current-password"
          required
          minLength={8}
          maxLength={128}
        />
      </div>
      {state.error ? <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{state.error}</p> : null}
      <button
        className="w-full rounded-lg bg-green-800 px-4 py-2 font-semibold text-white transition hover:bg-green-900"
        type="submit"
        disabled={pending}
      >
        {pending ? 'Validando sesión…' : 'Iniciar sesión'}
      </button>
    </form>
  );
}
