import { describe, expect, it } from 'vitest';
import { canAccessAdmin, canApplySaleDiscount, canManageCash, canManageCatalog, canOperatePos, canViewReports, hasRoleAtLeast } from './roles';

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

  it('enforces operational role boundaries', () => {
    expect(canManageCatalog('manager')).toBe(true);
    expect(canManageCatalog('staff')).toBe(false);
    expect(canOperatePos('staff')).toBe(true);
    expect(canOperatePos('viewer')).toBe(false);
    expect(canApplySaleDiscount('manager')).toBe(true);
    expect(canApplySaleDiscount('staff')).toBe(false);
    expect(canManageCash('manager')).toBe(true);
    expect(canManageCash('staff')).toBe(false);
    expect(canViewReports('manager')).toBe(true);
    expect(canViewReports('viewer')).toBe(false);
  });
});
