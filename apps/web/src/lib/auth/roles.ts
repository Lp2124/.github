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

export function canManageCatalog(role: StoreRole) {
  return hasRoleAtLeast(role, 'manager');
}

export function canOperatePos(role: StoreRole) {
  return hasRoleAtLeast(role, 'staff');
}

export function canApplySaleDiscount(role: StoreRole) {
  return hasRoleAtLeast(role, 'manager');
}

export function canManageCash(role: StoreRole) {
  return hasRoleAtLeast(role, 'manager');
}

export function canViewReports(role: StoreRole) {
  return hasRoleAtLeast(role, 'manager');
}

export function isOwnerOrAdmin(role: StoreRole) {
  return hasRoleAtLeast(role, 'admin');
}
