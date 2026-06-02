'use server';

import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { writeAuditLog } from '@/lib/audit/log';
import { canManageCash } from '@/lib/auth/roles';
import { requireUser } from '@/lib/auth/session';
import { cashCloseSchema, cashMovementSchema, cashOpenSchema } from '@/lib/operations/schemas';
import { assertSameOriginRequest } from '@/lib/security/csrf';
import { createClient } from '@/lib/supabase/server';
import { requireTenantContext } from '@/lib/tenant/context';

export type CashActionState = { error?: string; success?: string };

async function requireCashManager() {
  const user = await requireUser();
  const tenant = await requireTenantContext(user.id);
  if (!canManageCash(tenant.membership.role)) throw new Error('No tienes permisos para administrar caja.');
  return { user, tenant };
}

export async function openCashSessionAction(_state: CashActionState, formData: FormData): Promise<CashActionState> {
  await assertSameOriginRequest();
  try {
    const { user, tenant } = await requireCashManager();
    const parsed = cashOpenSchema.safeParse(Object.fromEntries(formData));
    if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? 'Apertura inválida.' };
    const supabase = await createClient();
    const { data: existing } = await supabase.from('cash_register_sessions').select('id').eq('store_id', tenant.store.id).eq('status', 'open').maybeSingle();
    if (existing) return { error: 'Ya existe una caja abierta para esta tienda.' };
    const { data, error } = await supabase.from('cash_register_sessions').insert({ store_id: tenant.store.id, opened_by: user.id, opening_amount: parsed.data.opening_amount, notes: parsed.data.notes }).select('id').single();
    if (error) return { error: 'No fue posible abrir caja.' };
    await writeAuditLog({ storeId: tenant.store.id, actorId: user.id, action: 'cash.session.open', entityType: 'cash_register_sessions', entityId: data.id, metadata: { openingAmount: parsed.data.opening_amount } });
  } catch (error) {
    return { error: error instanceof Error ? error.message : 'Error inesperado.' };
  }
  revalidatePath('/cash');
  redirect('/cash');
}

export async function createCashMovementAction(_state: CashActionState, formData: FormData): Promise<CashActionState> {
  await assertSameOriginRequest();
  try {
    const { user, tenant } = await requireCashManager();
    const parsed = cashMovementSchema.safeParse(Object.fromEntries(formData));
    if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? 'Movimiento inválido.' };
    const supabase = await createClient();
    const { data: session } = await supabase.from('cash_register_sessions').select('id').eq('store_id', tenant.store.id).eq('status', 'open').maybeSingle();
    if (!session) return { error: 'No hay caja abierta.' };
    const { data, error } = await supabase.from('cash_movements').insert({ store_id: tenant.store.id, cash_session_id: session.id, actor_id: user.id, movement_type: parsed.data.movement_type, amount: parsed.data.amount, reason: parsed.data.reason }).select('id').single();
    if (error) return { error: 'No fue posible registrar el movimiento.' };
    await writeAuditLog({ storeId: tenant.store.id, actorId: user.id, action: 'cash.movement.create', entityType: 'cash_movements', entityId: data.id, metadata: { type: parsed.data.movement_type, amount: parsed.data.amount } });
    revalidatePath('/cash');
    return { success: 'Movimiento registrado.' };
  } catch (error) {
    return { error: error instanceof Error ? error.message : 'Error inesperado.' };
  }
}

export async function closeCashSessionAction(_state: CashActionState, formData: FormData): Promise<CashActionState> {
  await assertSameOriginRequest();
  try {
    const { user, tenant } = await requireCashManager();
    const parsed = cashCloseSchema.safeParse(Object.fromEntries(formData));
    if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? 'Cierre inválido.' };
    const supabase = await createClient();
    const { data, error } = await supabase.rpc('close_cash_session', { p_store_id: tenant.store.id, p_actor_id: user.id, p_counted_amount: parsed.data.counted_amount, p_notes: parsed.data.notes });
    if (error || !data) return { error: 'No fue posible cerrar caja.' };
    await writeAuditLog({ storeId: tenant.store.id, actorId: user.id, action: 'cash.session.close', entityType: 'cash_register_sessions', entityId: data, metadata: { countedAmount: parsed.data.counted_amount } });
  } catch (error) {
    return { error: error instanceof Error ? error.message : 'Error inesperado.' };
  }
  revalidatePath('/cash');
  revalidatePath('/cash/history');
  redirect('/cash');
}
