-- Products module: catalog categories and products only.
-- No inventory, POS, cash register, payments, customers, reports, invoicing or ecommerce objects are created here.

create table public.product_categories (
  id uuid primary key default gen_random_uuid(),
  store_id uuid not null references public.stores(id) on delete cascade,
  name text not null check (char_length(trim(name)) between 2 and 120),
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (store_id, id)
);

create unique index product_categories_store_name_unique_idx
  on public.product_categories(store_id, lower(trim(name)));
create index product_categories_store_active_idx
  on public.product_categories(store_id, is_active, name);

create table public.products (
  id uuid primary key default gen_random_uuid(),
  store_id uuid not null references public.stores(id) on delete cascade,
  category_id uuid references public.product_categories(id) on delete restrict,
  sku text check (sku is null or char_length(trim(sku)) between 1 and 80),
  name text not null check (char_length(trim(name)) between 2 and 180),
  description text check (description is null or char_length(description) <= 2000),
  unit text not null default 'pieza' check (unit ~ '^[[:alnum:] ._/-]{1,40}$'),
  sale_price numeric(12,2) not null default 0 check (sale_price >= 0),
  cost_price numeric(12,2) check (cost_price is null or cost_price >= 0),
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (store_id, id),
  constraint products_category_store_fkey
    foreign key (store_id, category_id)
    references public.product_categories(store_id, id)
    on delete restrict
);

create unique index products_store_sku_unique_idx
  on public.products(store_id, lower(trim(sku)))
  where sku is not null;
create index products_store_active_name_idx
  on public.products(store_id, is_active, name);
create index products_store_category_idx
  on public.products(store_id, category_id);
create index products_store_created_idx
  on public.products(store_id, created_at desc);

create trigger product_categories_set_updated_at
  before update on public.product_categories
  for each row execute function public.set_updated_at();

create trigger products_set_updated_at
  before update on public.products
  for each row execute function public.set_updated_at();

alter table public.product_categories enable row level security;
alter table public.products enable row level security;

create policy product_categories_select_store_member
  on public.product_categories
  for select to authenticated
  using (public.is_store_member(store_id));

create policy product_categories_insert_catalog_manager
  on public.product_categories
  for insert to authenticated
  with check (public.is_store_member(store_id, array['owner','admin','manager']::public.store_role[]));

create policy product_categories_update_catalog_manager
  on public.product_categories
  for update to authenticated
  using (public.is_store_member(store_id, array['owner','admin','manager']::public.store_role[]))
  with check (public.is_store_member(store_id, array['owner','admin','manager']::public.store_role[]));

create policy products_select_store_member
  on public.products
  for select to authenticated
  using (public.is_store_member(store_id));

create policy products_insert_catalog_manager
  on public.products
  for insert to authenticated
  with check (public.is_store_member(store_id, array['owner','admin','manager']::public.store_role[]));

create policy products_update_catalog_manager
  on public.products
  for update to authenticated
  using (public.is_store_member(store_id, array['owner','admin','manager']::public.store_role[]))
  with check (public.is_store_member(store_id, array['owner','admin','manager']::public.store_role[]));

grant select, insert, update on public.product_categories to authenticated;
grant select, insert, update on public.products to authenticated;
