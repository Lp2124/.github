import { requireUser } from '@/lib/auth/session';
import { requireTenantContext } from '@/lib/tenant/context';
import { createClient } from '@/lib/supabase/server';
import { canAccessAdmin } from '@/lib/auth/roles';

export default async function DashboardPage() {
  const user = await requireUser();
  const tenant = await requireTenantContext(user.id);
  const supabase = await createClient();

  const [{ count: memberCount, error: membersError }, { data: settings, error: settingsError }, { data: auditLogs, error: auditError }] = await Promise.all([
    supabase
      .from('store_memberships')
      .select('id', { count: 'exact', head: true })
      .eq('store_id', tenant.store.id)
      .eq('is_active', true),
    supabase
      .from('store_settings')
      .select('setting_key, setting_value, updated_at')
      .eq('store_id', tenant.store.id)
      .order('setting_key', { ascending: true })
      .limit(10),
    supabase
      .from('audit_logs')
      .select('action, entity_type, created_at')
      .eq('store_id', tenant.store.id)
      .order('created_at', { ascending: false })
      .limit(8),
  ]);

  if (membersError || settingsError || auditError) {
    throw new Error(membersError?.message ?? settingsError?.message ?? auditError?.message ?? 'Error loading dashboard');
  }

  const adminEnabled = canAccessAdmin(tenant.membership.role);

  return (
    <section className="space-y-6">
      <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <div className="flex flex-col gap-2 lg:flex-row lg:items-start lg:justify-between">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.2em] text-green-800">Dashboard Admin</p>
            <h2 className="mt-2 text-3xl font-bold text-slate-950">Operación base lista</h2>
            <p className="mt-2 max-w-3xl text-slate-600">
              Vista SSR protegida por Supabase Auth, contexto multi-tenant por store_id, roles y datos reales leídos con RLS.
            </p>
          </div>
          <span className="rounded-full bg-green-50 px-3 py-1 text-sm font-semibold text-green-900">
            {adminEnabled ? 'Acceso administrativo' : 'Acceso limitado'}
          </span>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <Metric label="Tienda activa" value={tenant.store.name} detail={`Moneda ${tenant.store.currency}`} />
        <Metric label="Miembros activos" value={String(memberCount ?? 0)} detail="Filtrado por store_id" />
        <Metric label="Rol actual" value={tenant.membership.role} detail="Validado server-side" />
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <h3 className="text-lg font-bold text-slate-950">Configuración global</h3>
          <div className="mt-4 divide-y divide-slate-100">
            {settings && settings.length > 0 ? settings.map((setting) => (
              <div className="py-3" key={setting.setting_key}>
                <p className="font-semibold text-slate-800">{setting.setting_key}</p>
                <p className="mt-1 break-words text-sm text-slate-600">{JSON.stringify(setting.setting_value)}</p>
              </div>
            )) : <p className="text-sm text-slate-600">No hay configuración registrada para esta tienda.</p>}
          </div>
        </div>
        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <h3 className="text-lg font-bold text-slate-950">Auditoría reciente</h3>
          <div className="mt-4 divide-y divide-slate-100">
            {auditLogs && auditLogs.length > 0 ? auditLogs.map((log) => (
              <div className="py-3" key={`${log.action}-${log.entity_type}-${log.created_at}`}>
                <p className="font-semibold text-slate-800">{log.action}</p>
                <p className="text-sm text-slate-600">{log.entity_type} · {new Date(log.created_at).toLocaleString('es-MX')}</p>
              </div>
            )) : <p className="text-sm text-slate-600">Sin eventos de auditoría para esta tienda.</p>}
          </div>
        </div>
      </div>
    </section>
  );
}

function Metric({ label, value, detail }: Readonly<{ label: string; value: string; detail: string }>) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
      <p className="text-sm font-semibold text-slate-500">{label}</p>
      <p className="mt-2 text-2xl font-bold text-slate-950">{value}</p>
      <p className="mt-1 text-sm text-slate-600">{detail}</p>
    </div>
  );
}
