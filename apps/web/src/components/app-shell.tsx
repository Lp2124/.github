import Link from 'next/link';
import { signOutAction } from '@/app/actions/auth';
import { StoreSwitcher } from '@/components/store-switcher';
import type { Store, StoreMembership } from '@/lib/tenant/context';

const navigation = [{ href: '/dashboard', label: 'Dashboard' }];

export function AppShell({
  children,
  store,
  membership,
  memberships,
  userEmail,
}: Readonly<{
  children: React.ReactNode;
  store: Store;
  membership: StoreMembership;
  memberships: Array<{ store: Store; membership: StoreMembership }>;
  userEmail: string;
}>) {
  return (
    <div className="min-h-screen bg-slate-50">
      <header className="border-b border-slate-200 bg-white">
        <div className="mx-auto flex max-w-7xl flex-col gap-4 px-6 py-4 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.25em] text-green-800">Liora Admin</p>
            <h1 className="text-2xl font-bold text-slate-950">{store.name}</h1>
          </div>
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
            <StoreSwitcher store={store} memberships={memberships} />
            <div className="text-sm text-slate-600">
              <span className="block font-semibold text-slate-900">{userEmail}</span>
              <span>Rol: {membership.role}</span>
            </div>
            <form action={signOutAction}>
              <button className="rounded-lg border border-slate-300 px-3 py-2 text-sm font-semibold hover:bg-slate-100" type="submit">
                Cerrar sesión
              </button>
            </form>
          </div>
        </div>
      </header>
      <div className="mx-auto grid max-w-7xl gap-6 px-6 py-6 lg:grid-cols-[220px_1fr]">
        <aside className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
          <nav className="space-y-1">
            {navigation.map((item) => (
              <Link className="block rounded-lg px-3 py-2 text-sm font-semibold text-slate-700 hover:bg-green-50 hover:text-green-900" href={item.href} key={item.href}>
                {item.label}
              </Link>
            ))}
          </nav>
        </aside>
        <main>{children}</main>
      </div>
    </div>
  );
}
