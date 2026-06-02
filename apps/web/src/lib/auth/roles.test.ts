import { describe, expect, it } from 'vitest';
import { canAccessAdmin, hasRoleAtLeast } from './roles';

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
});
