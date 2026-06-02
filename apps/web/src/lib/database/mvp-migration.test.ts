import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';

const migration = readFileSync(join(process.cwd(), '..', '..', 'supabase', 'migrations', '202606020001_mvp_operations.sql'), 'utf8');

describe('MVP operations migration', () => {
  it('creates required multi-tenant tables with RLS', () => {
    for (const table of ['product_categories', 'products', 'inventory_movements', 'sales', 'sale_items', 'cash_register_sessions', 'cash_movements', 'customers']) {
      expect(migration).toContain(`create table public.${table}`);
      expect(migration).toContain('store_id uuid not null');
      expect(migration).toContain(`alter table public.${table} enable row level security`);
    }
  });

  it('protects POS sale completion with role, actor and cash checks', () => {
    expect(migration).toContain('create or replace function public.complete_pos_sale');
    expect(migration).toContain("auth.uid() <> p_actor_id");
    expect(migration).toContain("array['owner','admin','manager','staff']::public.store_role[]");
    expect(migration).toContain("status = 'open'");
    expect(migration).toContain('for update');
  });

  it('does not implement excluded online or fiscal scope', () => {
    expect(migration).not.toMatch(/mercado_pago|sat_|invoice|factura/i);
  });
});
