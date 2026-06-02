import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';

const migration = readFileSync(join(process.cwd(), '../../supabase/migrations/202606020001_products.sql'), 'utf8');

describe('products migration', () => {
  it('creates only product catalog tables for this checkpoint', () => {
    expect(migration).toContain('create table public.product_categories');
    expect(migration).toContain('create table public.products');
    expect(migration).not.toContain('create table public.inventory');
    expect(migration).not.toContain('create table public.sales');
    expect(migration).not.toContain('create table public.cash');
  });

  it('enforces tenant keys, constraints, indexes and RLS', () => {
    expect(migration).toContain('store_id uuid not null references public.stores(id) on delete cascade');
    expect(migration).toContain('alter table public.product_categories enable row level security');
    expect(migration).toContain('alter table public.products enable row level security');
    expect(migration).toContain('category_id uuid references public.product_categories(id) on delete restrict');
    expect(migration).toContain('products_store_sku_unique_idx');
    expect(migration).toContain('products_category_store_fkey');
  });

  it('allows reads to store members and writes only to catalog managers', () => {
    expect(migration).toContain('create policy product_categories_select_store_member');
    expect(migration).toContain('create policy products_select_store_member');
    expect(migration).toContain("array['owner','admin','manager']::public.store_role[]");
    expect(migration).not.toContain('grant select, insert, update, delete on public.products');
  });
});
