'use client';

import { switchStoreAction } from '@/app/actions/tenant';
import type { Store, StoreMembership } from '@/lib/tenant/context';

export function StoreSwitcher({ store, memberships }: Readonly<{ store: Store; memberships: Array<{ store: Store; membership: StoreMembership }> }>) {
  return (
    <form action={switchStoreAction}>
      <label className="sr-only" htmlFor="storeId">Tienda activa</label>
      <select
        className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm"
        id="storeId"
        name="storeId"
        defaultValue={store.id}
        onChange={(event) => event.currentTarget.form?.requestSubmit()}
      >
        {memberships.map((entry) => (
          <option key={entry.store.id} value={entry.store.id}>{entry.store.name}</option>
        ))}
      </select>
    </form>
  );
}
