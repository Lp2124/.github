import Link from 'next/link';
import { CashMovementForm } from '@/app/(app)/cash/cash-forms';
import { canManageCash } from '@/lib/auth/roles';
import { requireUser } from '@/lib/auth/session';
import { createClient } from '@/lib/supabase/server';
import { requireTenantContext } from '@/lib/tenant/context';

export default async function CashPage() {
  const user = await requireUser();
  const tenant = await requireTenantContext(user.id);
  const supabase = await createClient();
  const [{ data: session }, { data: movements }] = await Promise.all([
    supabase.from('cash_register_sessions').select('*').eq('store_id', tenant.store.id).eq('status', 'open').maybeSingle(),
    supabase.from('cash_movements').select('*').eq('store_id', tenant.store.id).order('created_at', { ascending: false }).limit(20),
  ]);
  const canManage = canManageCash(tenant.membership.role);
  return <section className="space-y-6"><div className="flex flex-col gap-3 rounded-2xl border bg-white p-6 shadow-sm md:flex-row md:items-center md:justify-between"><div><p className="text-sm font-semibold uppercase tracking-[0.2em] text-green-800">Caja</p><h2 className="text-3xl font-bold">Sesión de caja</h2><p className="text-slate-600">Apertura, movimientos y cierre asociados a ventas.</p></div><div className="flex gap-2">{canManage && !session ? <Link className="rounded-lg bg-green-700 px-4 py-2 text-sm font-bold text-white" href="/cash/open">Abrir caja</Link> : null}{canManage && session ? <Link className="rounded-lg bg-red-700 px-4 py-2 text-sm font-bold text-white" href="/cash/close">Cerrar caja</Link> : null}<Link className="rounded-lg border px-4 py-2 text-sm font-bold" href="/cash/history">Historial</Link></div></div>{session ? <div className="rounded-2xl border bg-white p-6 shadow-sm"><h3 className="text-xl font-bold">Caja abierta</h3><p>Monto inicial: ${Number(session.opening_amount).toFixed(2)}</p><p>Abierta: {new Date(session.opened_at).toLocaleString('es-MX')}</p></div> : <p className="rounded-2xl border bg-white p-6 text-slate-600">No hay caja abierta. El POS requiere una caja abierta para completar ventas.</p>}{canManage && session ? <CashMovementForm /> : null}<div className="rounded-2xl border bg-white p-6 shadow-sm"><h3 className="text-lg font-bold">Movimientos recientes</h3>{movements?.length ? <div className="mt-3 divide-y">{movements.map((movement) => <div className="py-3 text-sm" key={movement.id}><b>{movement.movement_type}</b> · ${Number(movement.amount).toFixed(2)}<p className="text-slate-600">{movement.reason}</p></div>)}</div> : <p className="mt-3 text-sm text-slate-600">Sin movimientos de caja.</p>}</div></section>;
}
