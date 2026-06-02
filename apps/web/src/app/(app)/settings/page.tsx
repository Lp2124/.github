import { hasRoleAtLeast } from '@/lib/auth/roles';
import { requireUser } from '@/lib/auth/session';
import { requireTenantContext } from '@/lib/tenant/context';
import { SettingsForm } from './settings-form';

export default async function SettingsPage() {
  const user = await requireUser();
  const tenant = await requireTenantContext(user.id);
  const canEdit = hasRoleAtLeast(tenant.membership.role, 'admin');

  return (
    <section className="space-y-6">
      <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <p className="text-sm font-semibold uppercase tracking-[0.2em] text-green-800">Configuración global</p>
        <h2 className="mt-2 text-3xl font-bold text-slate-950">Datos operativos de la tienda</h2>
        <p className="mt-2 max-w-3xl text-slate-600">
          Configuración real persistida en Supabase y protegida por RLS. Solo owner y admin pueden modificarla.
        </p>
      </div>
      <SettingsForm store={tenant.store} canEdit={canEdit} />
    </section>
  );
}
