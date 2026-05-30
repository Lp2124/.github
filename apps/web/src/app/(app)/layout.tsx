import { AppShell } from '@/components/app-shell';
import { requireUser } from '@/lib/auth/session';
import { requireTenantContext } from '@/lib/tenant/context';

export default async function ProtectedLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  const user = await requireUser();
  const tenant = await requireTenantContext(user.id);

  return (
    <AppShell
      store={tenant.store}
      membership={tenant.membership}
      memberships={tenant.memberships}
      userEmail={user.email ?? 'Usuario sin correo'}
    >
      {children}
    </AppShell>
  );
}
