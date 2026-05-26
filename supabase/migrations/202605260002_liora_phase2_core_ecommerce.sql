-- LIORA COMMERCE PLATFORM
-- Phase 2: Core ecommerce multi-tenant schema + RLS + storage policies

create extension if not exists pgcrypto;

-- ---------- Enums ----------
do $$ begin
  create type public.subscription_status as enum ('active','suspended','past_due','canceled');
exception when duplicate_object then null; end $$;

do $$ begin
  create type public.app_role as enum ('super_admin','store_owner','employee','customer');
exception when duplicate_object then null; end $$;

do $$ begin
  create type public.order_status as enum ('pending','confirmed','preparing','ready','delivered','cancelled');
exception when duplicate_object then null; end $$;

do $$ begin
  create type public.inventory_movement_type as enum ('in','out','adjustment','return','sale');
exception when duplicate_object then null; end $$;

-- ---------- Core tables ----------
create table if not exists public.stores (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  slug text not null unique,
  logo_url text,
  banner_url text,
  primary_color text,
  secondary_color text,
  whatsapp text,
  email text,
  address text,
  domain text unique,
  subscription_status public.subscription_status not null default 'active',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  deleted_at timestamptz
);

create table if not exists public.user_store_roles (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  store_id uuid not null references public.stores(id) on delete cascade,
  role public.app_role not null,
  created_at timestamptz not null default now(),
  unique(user_id, store_id, role)
);

create table if not exists public.store_settings (
  id uuid primary key default gen_random_uuid(),
  store_id uuid not null unique references public.stores(id) on delete cascade,
  currency_code text not null default 'MXN',
  timezone text not null default 'America/Mexico_City',
  low_stock_threshold integer not null default 5 check (low_stock_threshold >= 0),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.categories (
  id uuid primary key default gen_random_uuid(),
  store_id uuid not null references public.stores(id) on delete cascade,
  name text not null,
  slug text not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  deleted_at timestamptz,
  unique (store_id, slug)
);

create table if not exists public.products (
  id uuid primary key default gen_random_uuid(),
  store_id uuid not null references public.stores(id) on delete cascade,
  category_id uuid references public.categories(id) on delete set null,
  name text not null,
  slug text not null,
  description text,
  price numeric(12,2) not null check (price >= 0),
  sku text,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  deleted_at timestamptz,
  unique (store_id, slug),
  unique (store_id, sku)
);

create table if not exists public.product_images (
  id uuid primary key default gen_random_uuid(),
  store_id uuid not null references public.stores(id) on delete cascade,
  product_id uuid not null references public.products(id) on delete cascade,
  storage_path text not null,
  alt_text text,
  position integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique(product_id, storage_path)
);

create table if not exists public.customers (
  id uuid primary key default gen_random_uuid(),
  store_id uuid not null references public.stores(id) on delete cascade,
  full_name text not null,
  email text,
  phone text,
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  deleted_at timestamptz
);

create table if not exists public.orders (
  id uuid primary key default gen_random_uuid(),
  store_id uuid not null references public.stores(id) on delete cascade,
  customer_id uuid references public.customers(id) on delete set null,
  status public.order_status not null default 'pending',
  subtotal numeric(12,2) not null check (subtotal >= 0),
  discount_total numeric(12,2) not null default 0 check (discount_total >= 0),
  total numeric(12,2) not null check (total >= 0),
  checkout_channel text not null default 'whatsapp',
  whatsapp_phone text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  deleted_at timestamptz
);

create table if not exists public.order_items (
  id uuid primary key default gen_random_uuid(),
  store_id uuid not null references public.stores(id) on delete cascade,
  order_id uuid not null references public.orders(id) on delete cascade,
  product_id uuid references public.products(id) on delete set null,
  quantity integer not null check (quantity > 0),
  unit_price numeric(12,2) not null check (unit_price >= 0),
  line_total numeric(12,2) not null check (line_total >= 0),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.inventory_movements (
  id uuid primary key default gen_random_uuid(),
  store_id uuid not null references public.stores(id) on delete cascade,
  product_id uuid not null references public.products(id) on delete cascade,
  movement_type public.inventory_movement_type not null,
  quantity integer not null check (quantity > 0),
  reason text,
  reference_order_id uuid references public.orders(id) on delete set null,
  created_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.expenses (
  id uuid primary key default gen_random_uuid(),
  store_id uuid not null references public.stores(id) on delete cascade,
  description text not null,
  amount numeric(12,2) not null check (amount >= 0),
  expense_date date not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  deleted_at timestamptz
);

create table if not exists public.payments (
  id uuid primary key default gen_random_uuid(),
  store_id uuid not null references public.stores(id) on delete cascade,
  order_id uuid references public.orders(id) on delete set null,
  amount numeric(12,2) not null check (amount >= 0),
  method text not null,
  status text not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.coupons (
  id uuid primary key default gen_random_uuid(),
  store_id uuid not null references public.stores(id) on delete cascade,
  code text not null,
  discount_type text not null check (discount_type in ('fixed','percentage')),
  discount_value numeric(12,2) not null check (discount_value >= 0),
  active boolean not null default true,
  starts_at timestamptz,
  ends_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  deleted_at timestamptz,
  unique (store_id, code)
);

create table if not exists public.activity_logs (
  id uuid primary key default gen_random_uuid(),
  store_id uuid not null references public.stores(id) on delete cascade,
  actor_user_id uuid references auth.users(id) on delete set null,
  action text not null,
  entity_type text not null,
  entity_id uuid,
  metadata jsonb,
  created_at timestamptz not null default now()
);

create table if not exists public.subscriptions (
  id uuid primary key default gen_random_uuid(),
  store_id uuid not null unique references public.stores(id) on delete cascade,
  plan_code text not null,
  monthly_price numeric(12,2) not null check (monthly_price >= 0),
  status public.subscription_status not null default 'active',
  current_period_start timestamptz,
  current_period_end timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- ---------- Indexes ----------
create index if not exists idx_user_store_roles_user on public.user_store_roles(user_id);
create index if not exists idx_user_store_roles_store on public.user_store_roles(store_id);
create index if not exists idx_products_store_active on public.products(store_id, is_active);
create index if not exists idx_orders_store_created on public.orders(store_id, created_at desc);
create index if not exists idx_inventory_movements_store_product on public.inventory_movements(store_id, product_id, created_at desc);

-- ---------- Helpers ----------
create or replace function public.current_user_is_super_admin()
returns boolean
language sql
stable
as $$
  select exists (
    select 1
    from public.user_store_roles usr
    where usr.user_id = auth.uid()
      and usr.role = 'super_admin'
  );
$$;

create or replace function public.user_has_store_access(target_store uuid)
returns boolean
language sql
stable
as $$
  select exists (
    select 1
    from public.user_store_roles usr
    where usr.user_id = auth.uid()
      and usr.store_id = target_store
  )
  or public.current_user_is_super_admin();
$$;

create or replace function public.get_store_by_slug(target_slug text)
returns public.stores
language sql
stable
security definer
set search_path = public
as $$
  select s.*
  from public.stores s
  where s.slug = lower(target_slug)
    and s.deleted_at is null
    and s.subscription_status = 'active'
  limit 1;
$$;

create or replace view public.product_stock as
select
  p.id as product_id,
  p.store_id,
  coalesce(sum(
    case
      when im.movement_type in ('in','return') then im.quantity
      when im.movement_type in ('out','sale') then -im.quantity
      when im.movement_type = 'adjustment' then im.quantity
      else 0
    end
  ), 0) as stock
from public.products p
left join public.inventory_movements im on im.product_id = p.id and im.store_id = p.store_id
group by p.id, p.store_id;

-- ---------- RLS ----------
alter table public.stores enable row level security;
alter table public.user_store_roles enable row level security;
alter table public.store_settings enable row level security;
alter table public.categories enable row level security;
alter table public.products enable row level security;
alter table public.product_images enable row level security;
alter table public.customers enable row level security;
alter table public.orders enable row level security;
alter table public.order_items enable row level security;
alter table public.inventory_movements enable row level security;
alter table public.expenses enable row level security;
alter table public.payments enable row level security;
alter table public.coupons enable row level security;
alter table public.activity_logs enable row level security;
alter table public.subscriptions enable row level security;

create policy if not exists stores_select_policy on public.stores for select using (public.user_has_store_access(id));
create policy if not exists stores_update_policy on public.stores for update using (public.user_has_store_access(id));
create policy if not exists user_store_roles_select_policy on public.user_store_roles for select using (user_id = auth.uid() or public.current_user_is_super_admin());

-- tenant-wide policies
create policy if not exists store_settings_policy on public.store_settings for all using (public.user_has_store_access(store_id)) with check (public.user_has_store_access(store_id));
create policy if not exists categories_policy on public.categories for all using (public.user_has_store_access(store_id)) with check (public.user_has_store_access(store_id));
create policy if not exists products_policy on public.products for all using (public.user_has_store_access(store_id)) with check (public.user_has_store_access(store_id));
create policy if not exists product_images_policy on public.product_images for all using (public.user_has_store_access(store_id)) with check (public.user_has_store_access(store_id));
create policy if not exists customers_policy on public.customers for all using (public.user_has_store_access(store_id)) with check (public.user_has_store_access(store_id));
create policy if not exists orders_policy on public.orders for all using (public.user_has_store_access(store_id)) with check (public.user_has_store_access(store_id));
create policy if not exists order_items_policy on public.order_items for all using (public.user_has_store_access(store_id)) with check (public.user_has_store_access(store_id));
create policy if not exists inventory_movements_policy on public.inventory_movements for all using (public.user_has_store_access(store_id)) with check (public.user_has_store_access(store_id));
create policy if not exists expenses_policy on public.expenses for all using (public.user_has_store_access(store_id)) with check (public.user_has_store_access(store_id));
create policy if not exists payments_policy on public.payments for all using (public.user_has_store_access(store_id)) with check (public.user_has_store_access(store_id));
create policy if not exists coupons_policy on public.coupons for all using (public.user_has_store_access(store_id)) with check (public.user_has_store_access(store_id));
create policy if not exists activity_logs_policy on public.activity_logs for all using (public.user_has_store_access(store_id)) with check (public.user_has_store_access(store_id));
create policy if not exists subscriptions_policy on public.subscriptions for all using (public.user_has_store_access(store_id)) with check (public.user_has_store_access(store_id));

-- ---------- Storage buckets and policies ----------
insert into storage.buckets (id, name, public)
values ('store-assets', 'store-assets', false)
on conflict (id) do nothing;

insert into storage.buckets (id, name, public)
values ('product-images', 'product-images', false)
on conflict (id) do nothing;

create policy if not exists "store assets read"
on storage.objects for select
using (
  bucket_id = 'store-assets'
  and public.user_has_store_access((storage.foldername(name))[1]::uuid)
);

create policy if not exists "store assets write"
on storage.objects for insert
with check (
  bucket_id = 'store-assets'
  and public.user_has_store_access((storage.foldername(name))[1]::uuid)
);

create policy if not exists "product images read"
on storage.objects for select
using (
  bucket_id = 'product-images'
  and public.user_has_store_access((storage.foldername(name))[1]::uuid)
);

create policy if not exists "product images write"
on storage.objects for insert
with check (
  bucket_id = 'product-images'
  and public.user_has_store_access((storage.foldername(name))[1]::uuid)
);
