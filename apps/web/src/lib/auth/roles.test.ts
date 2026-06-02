import { describe, expect, it } from 'vitest';
import { canAccessAdmin, canManageProducts, hasRoleAtLeast, isOwnerOrAdmin } from './roles';

describe('role hierarchy', () => {
  it('allows stronger roles to satisfy lower requirements', () => {
    expect(hasRoleAtLeast('owner', 'viewer')).toBe(true);
    expect(hasRoleAtLeast('admin', 'manager')).toBe(true);
    expect(hasRoleAtLeast('manager', 'admin')).toBe(false);
  });

  it('limits admin dashboard privileges to manager and above', () => {
    expect(canAccessAdmin('manager')).toBe(true);
    expect(canAccessAdmin('staff')).toBe(false);
    expect(canAccessAdmin('viewer')).toBe(false);
  });

  it('limits sensitive administration to owner and admin', () => {
    expect(isOwnerOrAdmin('owner')).toBe(true);
    expect(isOwnerOrAdmin('admin')).toBe(true);
    expect(isOwnerOrAdmin('manager')).toBe(false);
    expect(isOwnerOrAdmin('staff')).toBe(false);
    expect(isOwnerOrAdmin('viewer')).toBe(false);
  });

  it('allows product management only for manager and above', () => {
    expect(canManageProducts('owner')).toBe(true);
    expect(canManageProducts('admin')).toBe(true);
    expect(canManageProducts('manager')).toBe(true);
    expect(canManageProducts('staff')).toBe(false);
    expect(canManageProducts('viewer')).toBe(false);
  });
});
