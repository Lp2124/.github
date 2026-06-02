'use client';

import { useActionState } from 'react';
import { updateStoreSettingsAction, type SettingsActionState } from '@/app/actions/settings';
import type { Store } from '@/lib/tenant/context';

const initialState: SettingsActionState = {};

export function SettingsForm({ store, canEdit }: Readonly<{ store: Store; canEdit: boolean }>) {
  const [state, formAction, pending] = useActionState(updateStoreSettingsAction, initialState);

  return (
    <form action={formAction} className="space-y-5 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
      <div>
        <label className="block text-sm font-semibold text-slate-700" htmlFor="name">Nombre de tienda</label>
        <input
          className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 outline-none focus:border-green-700 focus:ring-2 focus:ring-green-100 disabled:bg-slate-100"
          id="name"
          name="name"
          defaultValue={store.name}
          minLength={2}
          maxLength={140}
          required
          disabled={!canEdit || pending}
        />
      </div>
      <div className="grid gap-4 md:grid-cols-2">
        <div>
          <label className="block text-sm font-semibold text-slate-700" htmlFor="timezone">Zona horaria</label>
          <input
            className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 outline-none focus:border-green-700 focus:ring-2 focus:ring-green-100 disabled:bg-slate-100"
            id="timezone"
            name="timezone"
            defaultValue={store.timezone}
            pattern="^[A-Za-z_]+\/[A-Za-z_]+(?:\/[A-Za-z_]+)?$"
            required
            disabled={!canEdit || pending}
          />
        </div>
        <div>
          <label className="block text-sm font-semibold text-slate-700" htmlFor="currency">Moneda</label>
          <input
            className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 uppercase outline-none focus:border-green-700 focus:ring-2 focus:ring-green-100 disabled:bg-slate-100"
            id="currency"
            name="currency"
            defaultValue={store.currency}
            minLength={3}
            maxLength={3}
            pattern="^[A-Za-z]{3}$"
            required
            disabled={!canEdit || pending}
          />
        </div>
      </div>
      {state.error ? <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{state.error}</p> : null}
      {state.success ? <p className="rounded-lg bg-green-50 px-3 py-2 text-sm text-green-800">{state.success}</p> : null}
      <button
        className="rounded-lg bg-green-800 px-4 py-2 font-semibold text-white transition hover:bg-green-900 disabled:hover:bg-green-800"
        type="submit"
        disabled={!canEdit || pending}
      >
        {pending ? 'Guardando…' : 'Guardar configuración'}
      </button>
    </form>
  );
}
