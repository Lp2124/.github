import type { StoreRole } from '@/lib/supabase/database.types';

const roleRank: Record<StoreRole, number> = {
  owner: 50,
  admin: 40,
  manager: 30,
  staff: 20,
  viewer: 10,
};

export function hasRoleAtLeast(current: StoreRole, required: StoreRole) {
  return roleRank[current] >= roleRank[required];
}

export function canAccessAdmin(role: StoreRole) {
  return hasRoleAtLeast(role, 'manager');
}

export function isOwnerOrAdmin(role: StoreRole) {
  return hasRoleAtLeast(role, 'admin');
}

export function canManageProducts(role: StoreRole) {
  return hasRoleAtLeast(role, 'manager');
}
