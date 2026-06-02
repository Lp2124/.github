import { MemberRoleForm } from '@/app/(app)/team/member-role-form';
import { hasRoleAtLeast } from '@/lib/auth/roles';
import { requireUser } from '@/lib/auth/session';
import { createClient } from '@/lib/supabase/server';
import { requireTenantContext } from '@/lib/tenant/context';

export default async function TeamPage() {
  const user = await requireUser();
  const tenant = await requireTenantContext(user.id);
  const supabase = await createClient();
  const canEdit = hasRoleAtLeast(tenant.membership.role, 'admin');

  const { data: memberships, error } = await supabase
    .from('store_memberships')
    .select('id, user_id, role, is_active, created_at')
    .eq('store_id', tenant.store.id)
    .eq('is_active', true)
    .order('created_at', { ascending: true });

  if (error) {
    throw new Error(`Unable to load team memberships: ${error.message}`);
  }

  return (
    <section className="space-y-6">
      <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <p className="text-sm font-semibold uppercase tracking-[0.2em] text-green-800">Roles</p>
        <h2 className="mt-2 text-3xl font-bold text-slate-950">Equipo y permisos</h2>
        <p className="mt-2 max-w-3xl text-slate-600">
          Administración real de roles por tienda. Las actualizaciones se validan en servidor, respetan RLS y generan auditoría.
        </p>
      </div>
      <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
        <table className="w-full border-collapse text-left text-sm">
          <thead className="bg-slate-100 text-slate-700">
            <tr>
              <th className="px-4 py-3 font-semibold">Usuario</th>
              <th className="px-4 py-3 font-semibold">Rol</th>
              <th className="px-4 py-3 font-semibold">Alta</th>
              <th className="px-4 py-3 font-semibold">Acciones</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {(memberships ?? []).map((membership) => (
              <tr key={membership.id}>
                <td className="px-4 py-3 font-mono text-xs text-slate-700">{membership.user_id}</td>
                <td className="px-4 py-3 font-semibold text-slate-900">{membership.role}</td>
                <td className="px-4 py-3 text-slate-600">{new Date(membership.created_at).toLocaleDateString('es-MX')}</td>
                <td className="px-4 py-3">
                  <MemberRoleForm
                    membershipId={membership.id}
                    currentRole={membership.role}
                    canEdit={canEdit}
                    isCurrentUser={membership.user_id === user.id}
                  />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}
