import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';

const migration = readFileSync(join(process.cwd(), '../../supabase/migrations/202605300001_phase1_auth_roles_tenant.sql'), 'utf8');

describe('phase 1 migration', () => {
  it('defines the required multi-tenant phase 1 tables', () => {
    for (const table of ['profiles', 'stores', 'store_memberships', 'store_settings', 'audit_logs']) {
      expect(migration).toContain(`create table public.${table}`);
    }
  });

  it('enables RLS and blocks owner escalation through membership policies', () => {
    expect(migration).toContain('alter table public.store_memberships enable row level security');
    expect(migration).toContain("and role <> 'owner'");
    expect(migration).toContain('create policy memberships_update_owner_admin');
  });
});
