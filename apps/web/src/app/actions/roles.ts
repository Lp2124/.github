'use server';

import { revalidatePath } from 'next/cache';
import { writeAuditLog } from '@/lib/audit/log';
import { hasRoleAtLeast } from '@/lib/auth/roles';
import { requireUser } from '@/lib/auth/session';
import type { StoreRole } from '@/lib/supabase/database.types';
import { assertSameOriginRequest } from '@/lib/security/csrf';
import { uuidSchema } from '@/lib/security/validation';
import { createClient } from '@/lib/supabase/server';
import { requireTenantContext } from '@/lib/tenant/context';

const editableRoles = ['admin', 'manager', 'staff', 'viewer'] as const satisfies readonly StoreRole[];

type EditableRole = (typeof editableRoles)[number];

export type RoleActionState = { error?: string; success?: string };

function parseEditableRole(value: FormDataEntryValue | null): EditableRole | null {
  if (typeof value !== 'string') return null;
  return editableRoles.includes(value as EditableRole) ? (value as EditableRole) : null;
}

export async function updateMemberRoleAction(_state: RoleActionState, formData: FormData): Promise<RoleActionState> {
  await assertSameOriginRequest();
  const user = await requireUser();
  const tenant = await requireTenantContext(user.id);

  if (!hasRoleAtLeast(tenant.membership.role, 'admin')) {
    return { error: 'No tienes permisos para administrar roles.' };
  }

  const membershipId = uuidSchema.safeParse(formData.get('membershipId'));
  const role = parseEditableRole(formData.get('role'));

  if (!membershipId.success || !role) {
    return { error: 'La solicitud de cambio de rol no es válida.' };
  }

  const supabase = await createClient();
  const { data: target, error: loadError } = await supabase
    .from('store_memberships')
    .select('id, store_id, user_id, role, is_active')
    .eq('id', membershipId.data)
    .eq('store_id', tenant.store.id)
    .maybeSingle();

  if (loadError || !target) {
    return { error: 'La membresía solicitada no existe en la tienda activa.' };
  }

  if (target.role === 'owner') {
    return { error: 'El rol owner no puede modificarse desde esta pantalla.' };
  }

  if (target.user_id === user.id && role !== tenant.membership.role) {
    return { error: 'No puedes modificar tu propio rol activo.' };
  }

  const { error: updateError } = await supabase
    .from('store_memberships')
    .update({ role, updated_at: new Date().toISOString() })
    .eq('id', target.id)
    .eq('store_id', tenant.store.id);

  if (updateError) {
    return { error: `No fue posible actualizar el rol: ${updateError.message}` };
  }

  await writeAuditLog({
    storeId: tenant.store.id,
    actorId: user.id,
    action: 'store.member.role.update',
    entityType: 'store_memberships',
    entityId: target.id,
    metadata: { previousRole: target.role, nextRole: role, targetUserId: target.user_id },
  });

  revalidatePath('/team');
  revalidatePath('/dashboard');
  return { success: 'Rol actualizado correctamente.' };
}

export async function deactivateMemberAction(_state: RoleActionState, formData: FormData): Promise<RoleActionState> {
  await assertSameOriginRequest();
  const user = await requireUser();
  const tenant = await requireTenantContext(user.id);

  if (!hasRoleAtLeast(tenant.membership.role, 'admin')) {
    return { error: 'No tienes permisos para desactivar miembros.' };
  }

  const membershipId = uuidSchema.safeParse(formData.get('membershipId'));
  if (!membershipId.success) {
    return { error: 'La membresía solicitada no es válida.' };
  }

  const supabase = await createClient();
  const { data: target, error: loadError } = await supabase
    .from('store_memberships')
    .select('id, store_id, user_id, role, is_active')
    .eq('id', membershipId.data)
    .eq('store_id', tenant.store.id)
    .maybeSingle();

  if (loadError || !target) {
    return { error: 'La membresía solicitada no existe en la tienda activa.' };
  }

  if (target.role === 'owner') {
    return { error: 'No puedes desactivar al owner de la tienda.' };
  }

  if (target.user_id === user.id) {
    return { error: 'No puedes desactivar tu propia membresía activa.' };
  }

  const { error: updateError } = await supabase
    .from('store_memberships')
    .update({ is_active: false, updated_at: new Date().toISOString() })
    .eq('id', target.id)
    .eq('store_id', tenant.store.id);

  if (updateError) {
    return { error: `No fue posible desactivar la membresía: ${updateError.message}` };
  }

  await writeAuditLog({
    storeId: tenant.store.id,
    actorId: user.id,
    action: 'store.member.deactivate',
    entityType: 'store_memberships',
    entityId: target.id,
    metadata: { targetUserId: target.user_id, previousRole: target.role },
  });

  revalidatePath('/team');
  revalidatePath('/dashboard');
  return { success: 'Miembro desactivado correctamente.' };
}
