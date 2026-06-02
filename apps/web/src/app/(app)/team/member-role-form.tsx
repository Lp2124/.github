'use client';

import { useActionState } from 'react';
import { deactivateMemberAction, updateMemberRoleAction, type RoleActionState } from '@/app/actions/roles';
import type { StoreRole } from '@/lib/supabase/database.types';

const roleState: RoleActionState = {};
const editableRoles: StoreRole[] = ['admin', 'manager', 'staff', 'viewer'];

export function MemberRoleForm({
  membershipId,
  currentRole,
  canEdit,
  isCurrentUser,
}: Readonly<{ membershipId: string; currentRole: StoreRole; canEdit: boolean; isCurrentUser: boolean }>) {
  const [updateState, updateAction, updating] = useActionState(updateMemberRoleAction, roleState);
  const [deactivateState, deactivateAction, deactivating] = useActionState(deactivateMemberAction, roleState);
  const owner = currentRole === 'owner';
  const disabled = !canEdit || owner || isCurrentUser || updating || deactivating;

  return (
    <div className="space-y-2">
      <form action={updateAction} className="flex flex-col gap-2 sm:flex-row">
        <input type="hidden" name="membershipId" value={membershipId} />
        <select className="rounded-lg border border-slate-300 px-3 py-2 text-sm disabled:bg-slate-100" name="role" defaultValue={currentRole} disabled={disabled}>
          {owner ? <option value="owner">owner</option> : editableRoles.map((role) => <option key={role} value={role}>{role}</option>)}
        </select>
        <button className="rounded-lg border border-slate-300 px-3 py-2 text-sm font-semibold hover:bg-slate-100" type="submit" disabled={disabled}>
          Actualizar rol
        </button>
      </form>
      <form action={deactivateAction}>
        <input type="hidden" name="membershipId" value={membershipId} />
        <button className="rounded-lg border border-red-200 px-3 py-2 text-sm font-semibold text-red-700 hover:bg-red-50" type="submit" disabled={disabled}>
          Desactivar
        </button>
      </form>
      {updateState.error || deactivateState.error ? <p className="text-sm text-red-700">{updateState.error ?? deactivateState.error}</p> : null}
      {updateState.success || deactivateState.success ? <p className="text-sm text-green-800">{updateState.success ?? deactivateState.success}</p> : null}
    </div>
  );
}
