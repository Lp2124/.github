import { canViewReports } from '@/lib/auth/roles';
import { requireUser } from '@/lib/auth/session';
import { createClient } from '@/lib/supabase/server';
import { requireTenantContext } from '@/lib/tenant/context';

function startOfTodayIso() { const date = new Date(); date.setHours(0, 0, 0, 0); return date.toISOString(); }

export default async function ReportsPage() {
  const user = await requireUser();
  const tenant = await requireTenantContext(user.id);
  if (!canViewReports(tenant.membership.role)) return <p className="rounded-2xl border border-red-200 bg-white p-6 font-semibold text-red-700">No tienes permisos para ver reportes.</p>;
  const supabase = await createClient();
  const [{ data: sales }, { data: items }, { data: lowStock }, { data: cashSessions }] = await Promise.all([
    supabase.from('sales').select('id, sale_number, total_amount, gross_margin, created_at').eq('store_id', tenant.store.id).gte('created_at', startOfTodayIso()).order('created_at', { ascending: false }),
    supabase.from('sale_items').select('product_id, quantity, line_total').eq('store_id', tenant.store.id).order('quantity', { ascending: false }).limit(20),
    supabase.from('products').select('sku, name, current_stock, low_stock_threshold').eq('store_id', tenant.store.id).lte('current_stock', 10).order('current_stock'),
    supabase.from('cash_register_sessions').select('status, opened_at, closed_at, expected_amount, counted_amount, difference_amount').eq('store_id', tenant.store.id).order('opened_at', { ascending: false }).limit(10),
  ]);
  const totalToday = (sales ?? []).reduce((sum, sale) => sum + Number(sale.total_amount), 0);
  const marginToday = (sales ?? []).reduce((sum, sale) => sum + Number(sale.gross_margin ?? 0), 0);
  return <section className="space-y-6"><div className="rounded-2xl border bg-white p-6 shadow-sm"><p className="text-sm font-semibold uppercase tracking-[0.2em] text-green-800">Reportes</p><h2 className="text-3xl font-bold">Reportes básicos</h2><p className="text-slate-600">Datos reales de ventas, inventario y caja por store_id.</p></div><div className="grid gap-4 md:grid-cols-3"><Metric label="Ventas hoy" value={`$${totalToday.toFixed(2)}`} /><Metric label="Tickets hoy" value={String(sales?.length ?? 0)} /><Metric label="Margen estimado" value={`$${marginToday.toFixed(2)}`} /></div><Panel title="Ventas del día" rows={(sales ?? []).map((sale) => `${sale.sale_number} · $${Number(sale.total_amount).toFixed(2)} · ${new Date(sale.created_at).toLocaleString('es-MX')}`)} /><Panel title="Productos más vendidos" rows={(items ?? []).map((item) => `${item.product_id} · cantidad ${Number(item.quantity)} · $${Number(item.line_total).toFixed(2)}`)} /><Panel title="Stock bajo" rows={(lowStock ?? []).map((product) => `${product.sku} · ${product.name} · stock ${Number(product.current_stock)} · umbral ${Number(product.low_stock_threshold)}`)} /><Panel title="Caja por sesión" rows={(cashSessions ?? []).map((session) => `${session.status} · esperado $${Number(session.expected_amount ?? 0).toFixed(2)} · contado $${Number(session.counted_amount ?? 0).toFixed(2)} · diff $${Number(session.difference_amount ?? 0).toFixed(2)}`)} /></section>;
}
function Metric({ label, value }: Readonly<{ label: string; value: string }>) { return <div className="rounded-2xl border bg-white p-5 shadow-sm"><p className="text-sm font-semibold text-slate-500">{label}</p><p className="mt-2 text-2xl font-bold">{value}</p></div>; }
function Panel({ title, rows }: Readonly<{ title: string; rows: string[] }>) { return <div className="rounded-2xl border bg-white p-6 shadow-sm"><h3 className="text-lg font-bold">{title}</h3>{rows.length ? <ul className="mt-3 divide-y text-sm">{rows.map((row) => <li className="py-2" key={row}>{row}</li>)}</ul> : <p className="mt-3 text-sm text-slate-600">Sin datos disponibles.</p>}</div>; }
