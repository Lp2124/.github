-- Phase 1: Multi-tenant foundation for LIORA COMMERCE PLATFORM
create extension if not exists pgcrypto;

create table if not exists public.stores (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  slug text not null unique,
  logo_url text,
  primary_color text,
  whatsapp text,
  email text,
  address text,
  subscription_status text not null default 'active' check (subscription_status in ('active','suspended','past_due','canceled')),
  created_at timestamptz not null default now()
);

create table if not exists public.store_users (
  store_id uuid not null references public.stores(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  role text not null check (role in ('owner','admin','staff')),
  created_at timestamptz not null default now(),
  primary key (store_id, user_id)
);

create table if not exists public.categories (
  id uuid primary key default gen_random_uuid(),
  store_id uuid not null references public.stores(id) on delete cascade,
  name text not null,
  slug text not null,
  created_at timestamptz not null default now(),
  unique(store_id, slug)
);

create table if not exists public.products (
  id uuid primary key default gen_random_uuid(),
  store_id uuid not null references public.stores(id) on delete cascade,
  category_id uuid references public.categories(id) on delete set null,
  name text not null,
  slug text not null,
  description text,
  price numeric(12,2) not null check (price >= 0),
  stock integer not null default 0 check (stock >= 0),
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  unique(store_id, slug)
);

alter table public.stores enable row level security;
alter table public.store_users enable row level security;
alter table public.categories enable row level security;
alter table public.products enable row level security;

create or replace function public.is_store_member(target_store uuid)
returns boolean
language sql
stable
as $$
  select exists (
    select 1
    from public.store_users su
    where su.store_id = target_store
      and su.user_id = auth.uid()
  );
$$;

create policy "stores_select_member"
on public.stores for select
using (public.is_store_member(id));

create policy "stores_insert_owner"
on public.stores for insert
with check (auth.uid() is not null);

create policy "store_users_member_read"
on public.store_users for select
using (user_id = auth.uid() or public.is_store_member(store_id));

create policy "categories_tenant_isolation"
on public.categories for all
using (public.is_store_member(store_id))
with check (public.is_store_member(store_id));

create policy "products_tenant_isolation"
on public.products for all
using (public.is_store_member(store_id))
with check (public.is_store_member(store_id));
