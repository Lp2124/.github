import { hasRoleAtLeast } from '@/lib/auth/roles';
import { requireUser } from '@/lib/auth/session';
import { createClient } from '@/lib/supabase/server';
import { requireTenantContext } from '@/lib/tenant/context';

export default async function AuditPage() {
  const user = await requireUser();
  const tenant = await requireTenantContext(user.id);
  const supabase = await createClient();

  if (!hasRoleAtLeast(tenant.membership.role, 'manager')) {
    return (
      <section className="rounded-2xl border border-amber-200 bg-amber-50 p-6 text-amber-900">
        <h2 className="text-xl font-bold">Acceso restringido</h2>
        <p className="mt-2">Tu rol actual no permite consultar auditoría de la tienda.</p>
      </section>
    );
  }

  const { data: logs, error } = await supabase
    .from('audit_logs')
    .select('id, actor_id, action, entity_type, entity_id, metadata, created_at')
    .eq('store_id', tenant.store.id)
    .order('created_at', { ascending: false })
    .limit(100);

  if (error) {
    throw new Error(`Unable to load audit logs: ${error.message}`);
  }

  return (
    <section className="space-y-6">
      <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <p className="text-sm font-semibold uppercase tracking-[0.2em] text-green-800">Auditoría</p>
        <h2 className="mt-2 text-3xl font-bold text-slate-950">Historial de acciones críticas</h2>
        <p className="mt-2 max-w-3xl text-slate-600">Eventos reales registrados por tienda y protegidos por RLS.</p>
      </div>
      <div className="space-y-3">
        {(logs ?? []).map((log) => (
          <article className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm" key={log.id}>
            <div className="flex flex-col gap-1 md:flex-row md:items-center md:justify-between">
              <h3 className="font-bold text-slate-950">{log.action}</h3>
              <time className="text-sm text-slate-500" dateTime={log.created_at}>{new Date(log.created_at).toLocaleString('es-MX')}</time>
            </div>
            <p className="mt-2 text-sm text-slate-600">Entidad: {log.entity_type}{log.entity_id ? ` · ${log.entity_id}` : ''}</p>
            <p className="mt-1 font-mono text-xs text-slate-500">Actor: {log.actor_id ?? 'sistema'}</p>
            <pre className="mt-3 overflow-auto rounded-lg bg-slate-950 p-3 text-xs text-slate-100">{JSON.stringify(log.metadata, null, 2)}</pre>
          </article>
        ))}
        {logs?.length === 0 ? <p className="rounded-2xl border border-slate-200 bg-white p-6 text-slate-600">Sin eventos de auditoría para esta tienda.</p> : null}
      </div>
    </section>
  );
}
