set check_function_bodies = off;

do $$
begin
  if not exists (select 1 from pg_type where typname = 'inventory_movement_type') then
    create type public.inventory_movement_type as enum ('entrada', 'salida', 'ajuste', 'merma', 'devolucion', 'traspaso');
  end if;
end $$;

create table public.brands (
  id uuid primary key default extensions.gen_random_uuid(),
  company_id uuid not null references public.companies(id) on delete cascade,
  name text not null check (char_length(trim(name)) between 1 and 120),
  slug text not null check (slug ~ '^[a-z0-9]+(?:-[a-z0-9]+)*$'),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (company_id, slug),
  unique (company_id, name)
);

create table public.suppliers (
  id uuid primary key default extensions.gen_random_uuid(),
  company_id uuid not null references public.companies(id) on delete cascade,
  name text not null check (char_length(trim(name)) between 1 and 180),
  tax_id text check (tax_id is null or tax_id ~ '^[A-ZÑ&]{3,4}[0-9]{6}[A-Z0-9]{3}$'),
  contact_name text check (contact_name is null or char_length(trim(contact_name)) between 1 and 160),
  email extensions.citext check (email is null or email::text ~* '^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$'),
  phone text check (phone is null or phone ~ '^[0-9 +().-]{7,32}$'),
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (company_id, name)
);

alter table public.products
  add column if not exists brand_id uuid references public.brands(id) on delete restrict,
  add column if not exists supplier_id uuid references public.suppliers(id) on delete set null,
  add column if not exists unit_of_measure text not null default 'pieza' check (char_length(trim(unit_of_measure)) between 1 and 40),
  add column if not exists cost_price numeric(18, 6) not null default 0 check (cost_price >= 0),
  add column if not exists sale_price numeric(18, 6) not null default 0 check (sale_price >= 0),
  add column if not exists track_inventory boolean not null default true;

create table public.product_barcodes (
  id uuid primary key default extensions.gen_random_uuid(),
  company_id uuid not null references public.companies(id) on delete cascade,
  product_id uuid not null references public.products(id) on delete cascade,
  barcode text not null check (barcode ~ '^[A-Za-z0-9._-]{4,64}$'),
  created_at timestamptz not null default now(),
  unique (company_id, barcode),
  unique (product_id, barcode)
);

create table public.product_images (
  id uuid primary key default extensions.gen_random_uuid(),
  product_id uuid not null references public.products(id) on delete cascade,
  image_url text not null check (image_url ~ '^https://'),
  alt_text text not null check (char_length(trim(alt_text)) between 1 and 180),
  sort_order integer not null default 0 check (sort_order >= 0),
  created_at timestamptz not null default now(),
  unique (product_id, image_url)
);

alter table public.inventory_balances
  add column if not exists min_stock numeric(18, 6) not null default 0 check (min_stock >= 0),
  add column if not exists max_stock numeric(18, 6) not null default 0 check (max_stock >= 0),
  add constraint inventory_balances_min_max_check check (max_stock = 0 or max_stock >= min_stock);

create table public.inventory_movements (
  id uuid primary key default extensions.gen_random_uuid(),
  company_id uuid not null references public.companies(id) on delete restrict,
  branch_id uuid not null references public.branches(id) on delete restrict,
  warehouse_id uuid not null references public.warehouses(id) on delete restrict,
  destination_warehouse_id uuid references public.warehouses(id) on delete restrict,
  product_id uuid not null references public.products(id) on delete restrict,
  movement_type public.inventory_movement_type not null,
  quantity_delta numeric(18, 6) not null check (quantity_delta <> 0),
  previous_quantity numeric(18, 6) not null check (previous_quantity >= 0),
  new_quantity numeric(18, 6) not null check (new_quantity >= 0),
  reason text not null check (char_length(trim(reason)) between 3 and 500),
  reference_document text check (reference_document is null or char_length(trim(reference_document)) between 1 and 120),
  related_movement_id uuid references public.inventory_movements(id) on delete restrict,
  created_by_user_id uuid references auth.users(id) on delete set null,
  occurred_at timestamptz not null default now()
);

create index brands_company_id_idx on public.brands(company_id);
create index suppliers_company_id_idx on public.suppliers(company_id);
create index products_brand_id_idx on public.products(brand_id);
create index products_supplier_id_idx on public.products(supplier_id);
create index product_barcodes_product_id_idx on public.product_barcodes(product_id);
create index product_images_product_id_idx on public.product_images(product_id);
create index inventory_balances_low_stock_idx on public.inventory_balances(warehouse_id, product_id) where quantity <= min_stock and min_stock > 0;
create index inventory_movements_company_occurred_idx on public.inventory_movements(company_id, occurred_at desc);
create index inventory_movements_product_occurred_idx on public.inventory_movements(product_id, occurred_at desc);
create index inventory_movements_warehouse_occurred_idx on public.inventory_movements(warehouse_id, occurred_at desc);

create trigger brands_set_updated_at before update on public.brands for each row execute function public.set_updated_at();
create trigger suppliers_set_updated_at before update on public.suppliers for each row execute function public.set_updated_at();

create or replace function public.current_user_has_permission(permission_code text)
returns boolean
language sql
security definer
stable
set search_path = public
as $$
  select exists (
    select 1
    from public.user_roles ur
    join public.roles r on r.id = ur.role_id
    join public.role_permissions rp on rp.role_id = r.id
    join public.permissions p on p.id = rp.permission_id
    join public.user_profiles up on up.id = ur.user_id
    where ur.user_id = auth.uid()
      and up.status = 'active'
      and p.code = permission_code
  );
$$;

create or replace function public.register_inventory_movement(
  p_product_id uuid,
  p_warehouse_id uuid,
  p_movement_type public.inventory_movement_type,
  p_quantity_delta numeric,
  p_reason text,
  p_reference_document text default null,
  p_destination_warehouse_id uuid default null
)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  source_balance public.inventory_balances%rowtype;
  destination_balance public.inventory_balances%rowtype;
  product_company_id uuid;
  source_branch_id uuid;
  source_company_id uuid;
  destination_branch_id uuid;
  destination_company_id uuid;
  created_movement_id uuid;
  destination_movement_id uuid;
  required_permission text;
begin
  if auth.uid() is null then
    raise exception 'authentication required';
  end if;

  if p_quantity_delta = 0 then
    raise exception 'quantity delta must be different from zero';
  end if;

  if char_length(trim(p_reason)) < 3 then
    raise exception 'movement reason is required';
  end if;

  select company_id into product_company_id
  from public.products
  where id = p_product_id and is_active = true;

  if product_company_id is null then
    raise exception 'product not found or inactive';
  end if;

  select b.id, b.company_id into source_branch_id, source_company_id
  from public.warehouses w
  join public.branches b on b.id = w.branch_id
  where w.id = p_warehouse_id;

  if source_company_id is null or source_company_id <> product_company_id then
    raise exception 'warehouse and product company mismatch';
  end if;

  required_permission = case
    when p_movement_type in ('entrada', 'devolucion') then 'inventory.receive'
    when p_movement_type = 'traspaso' then 'inventory.transfer'
    else 'inventory.adjust'
  end;

  if not public.current_user_has_permission(required_permission) and not public.current_user_has_role('super_admin') then
    raise exception 'insufficient inventory permissions';
  end if;

  insert into public.inventory_balances (warehouse_id, product_id, quantity)
  values (p_warehouse_id, p_product_id, 0)
  on conflict (warehouse_id, product_id) do nothing;

  select * into source_balance
  from public.inventory_balances
  where warehouse_id = p_warehouse_id and product_id = p_product_id
  for update;

  if p_movement_type in ('salida', 'merma') and p_quantity_delta >= 0 then
    raise exception 'movement type requires negative quantity delta';
  end if;

  if p_movement_type in ('entrada', 'devolucion') and p_quantity_delta <= 0 then
    raise exception 'movement type requires positive quantity delta';
  end if;

  if p_movement_type = 'traspaso' then
    if p_quantity_delta <= 0 then
      raise exception 'transfer quantity must be positive';
    end if;

    if p_destination_warehouse_id is null or p_destination_warehouse_id = p_warehouse_id then
      raise exception 'valid destination warehouse is required for transfer';
    end if;

    select b.id, b.company_id into destination_branch_id, destination_company_id
    from public.warehouses w
    join public.branches b on b.id = w.branch_id
    where w.id = p_destination_warehouse_id;

    if destination_company_id is null or destination_company_id <> product_company_id then
      raise exception 'destination warehouse and product company mismatch';
    end if;

    if source_balance.quantity < p_quantity_delta then
      raise exception 'insufficient stock for transfer';
    end if;

    insert into public.inventory_balances (warehouse_id, product_id, quantity)
    values (p_destination_warehouse_id, p_product_id, 0)
    on conflict (warehouse_id, product_id) do nothing;

    select * into destination_balance
    from public.inventory_balances
    where warehouse_id = p_destination_warehouse_id and product_id = p_product_id
    for update;

    update public.inventory_balances
    set quantity = source_balance.quantity - p_quantity_delta,
        updated_at = now()
    where id = source_balance.id;

    insert into public.inventory_movements (
      company_id, branch_id, warehouse_id, destination_warehouse_id, product_id, movement_type,
      quantity_delta, previous_quantity, new_quantity, reason, reference_document, created_by_user_id
    )
    values (
      product_company_id, source_branch_id, p_warehouse_id, p_destination_warehouse_id, p_product_id, p_movement_type,
      -p_quantity_delta, source_balance.quantity, source_balance.quantity - p_quantity_delta,
      trim(p_reason), nullif(trim(coalesce(p_reference_document, '')), ''), auth.uid()
    )
    returning id into created_movement_id;

    update public.inventory_balances
    set quantity = destination_balance.quantity + p_quantity_delta,
        updated_at = now()
    where id = destination_balance.id;

    insert into public.inventory_movements (
      company_id, branch_id, warehouse_id, destination_warehouse_id, product_id, movement_type,
      quantity_delta, previous_quantity, new_quantity, reason, reference_document, related_movement_id, created_by_user_id
    )
    values (
      product_company_id, destination_branch_id, p_destination_warehouse_id, p_warehouse_id, p_product_id, p_movement_type,
      p_quantity_delta, destination_balance.quantity, destination_balance.quantity + p_quantity_delta,
      trim(p_reason), nullif(trim(coalesce(p_reference_document, '')), ''), created_movement_id, auth.uid()
    )
    returning id into destination_movement_id;

    update public.inventory_movements
    set related_movement_id = destination_movement_id
    where id = created_movement_id;
  else
    if source_balance.quantity + p_quantity_delta < 0 then
      raise exception 'insufficient stock';
    end if;

    update public.inventory_balances
    set quantity = source_balance.quantity + p_quantity_delta,
        updated_at = now()
    where id = source_balance.id;

    insert into public.inventory_movements (
      company_id, branch_id, warehouse_id, product_id, movement_type, quantity_delta,
      previous_quantity, new_quantity, reason, reference_document, created_by_user_id
    )
    values (
      product_company_id, source_branch_id, p_warehouse_id, p_product_id, p_movement_type, p_quantity_delta,
      source_balance.quantity, source_balance.quantity + p_quantity_delta,
      trim(p_reason), nullif(trim(coalesce(p_reference_document, '')), ''), auth.uid()
    )
    returning id into created_movement_id;
  end if;

  insert into public.audit_log (actor_user_id, action, entity_table, entity_id, metadata)
  values (
    auth.uid(),
    'inventory.movement_registered',
    'inventory_movements',
    created_movement_id,
    jsonb_build_object('product_id', p_product_id, 'warehouse_id', p_warehouse_id, 'movement_type', p_movement_type)
  );

  return created_movement_id;
end;
$$;

revoke all on function public.register_inventory_movement(uuid, uuid, public.inventory_movement_type, numeric, text, text, uuid) from public;
grant execute on function public.register_inventory_movement(uuid, uuid, public.inventory_movement_type, numeric, text, text, uuid) to authenticated;

create or replace view public.low_inventory_alerts
with (security_invoker = true) as
select
  ib.id,
  p.company_id,
  b.id as branch_id,
  b.name as branch_name,
  w.id as warehouse_id,
  w.name as warehouse_name,
  p.id as product_id,
  p.sku,
  p.name as product_name,
  ib.quantity,
  ib.min_stock,
  ib.max_stock,
  greatest(ib.min_stock - ib.quantity, 0) as shortage_quantity,
  ib.updated_at
from public.inventory_balances ib
join public.products p on p.id = ib.product_id
join public.warehouses w on w.id = ib.warehouse_id
join public.branches b on b.id = w.branch_id
where ib.min_stock > 0 and ib.quantity <= ib.min_stock and p.is_active = true;

alter table public.brands enable row level security;
alter table public.suppliers enable row level security;
alter table public.product_barcodes enable row level security;
alter table public.product_images enable row level security;
alter table public.inventory_movements enable row level security;

create policy "brands_select_scoped" on public.brands
for select to authenticated
using (public.current_user_has_role('super_admin') or company_id in (select public.current_user_company_ids()));

create policy "brands_write_catalog" on public.brands
for all to authenticated
using (public.current_user_has_permission('catalog.update') or public.current_user_has_role('super_admin'))
with check ((public.current_user_has_permission('catalog.create') or public.current_user_has_permission('catalog.update') or public.current_user_has_role('super_admin')) and (public.current_user_has_role('super_admin') or company_id in (select public.current_user_company_ids())));

create policy "suppliers_select_scoped" on public.suppliers
for select to authenticated
using (public.current_user_has_role('super_admin') or company_id in (select public.current_user_company_ids()));

create policy "suppliers_write_purchasing" on public.suppliers
for all to authenticated
using (public.current_user_has_permission('purchasing.create') or public.current_user_has_role('super_admin'))
with check ((public.current_user_has_permission('purchasing.create') or public.current_user_has_role('super_admin')) and (public.current_user_has_role('super_admin') or company_id in (select public.current_user_company_ids())));

create policy "product_barcodes_select_scoped" on public.product_barcodes
for select to authenticated
using (public.current_user_has_role('super_admin') or company_id in (select public.current_user_company_ids()));

create policy "product_barcodes_write_catalog" on public.product_barcodes
for all to authenticated
using (public.current_user_has_permission('catalog.update') or public.current_user_has_role('super_admin'))
with check ((public.current_user_has_permission('catalog.create') or public.current_user_has_permission('catalog.update') or public.current_user_has_role('super_admin')) and (public.current_user_has_role('super_admin') or company_id in (select public.current_user_company_ids())));

create policy "product_images_select_product_scope" on public.product_images
for select to authenticated
using (exists (
  select 1 from public.products p
  where p.id = product_id
    and (public.current_user_has_role('super_admin') or p.company_id in (select public.current_user_company_ids()))
));

create policy "product_images_write_catalog" on public.product_images
for all to authenticated
using (public.current_user_has_permission('catalog.update') or public.current_user_has_role('super_admin'))
with check (exists (
  select 1 from public.products p
  where p.id = product_id
    and (public.current_user_has_permission('catalog.create') or public.current_user_has_permission('catalog.update') or public.current_user_has_role('super_admin'))
    and (public.current_user_has_role('super_admin') or p.company_id in (select public.current_user_company_ids()))
));

create policy "inventory_movements_select_scoped" on public.inventory_movements
for select to authenticated
using (public.current_user_has_role('super_admin') or company_id in (select public.current_user_company_ids()));

create policy "categories_write_catalog" on public.categories
for all to authenticated
using (public.current_user_has_permission('catalog.update') or public.current_user_has_role('super_admin'))
with check ((public.current_user_has_permission('catalog.create') or public.current_user_has_permission('catalog.update') or public.current_user_has_role('super_admin')) and (public.current_user_has_role('super_admin') or company_id in (select public.current_user_company_ids())));

create policy "products_write_catalog" on public.products
for all to authenticated
using (public.current_user_has_permission('catalog.update') or public.current_user_has_role('super_admin'))
with check ((public.current_user_has_permission('catalog.create') or public.current_user_has_permission('catalog.update') or public.current_user_has_role('super_admin')) and (public.current_user_has_role('super_admin') or company_id in (select public.current_user_company_ids())));

create policy "inventory_balances_write_inventory" on public.inventory_balances
for all to authenticated
using (
  public.current_user_has_permission('inventory.adjust')
  or public.current_user_has_permission('inventory.receive')
  or public.current_user_has_permission('inventory.transfer')
  or public.current_user_has_role('super_admin')
)
with check (
  (
    public.current_user_has_permission('inventory.adjust')
    or public.current_user_has_permission('inventory.receive')
    or public.current_user_has_permission('inventory.transfer')
    or public.current_user_has_role('super_admin')
  )
  and (public.current_user_has_role('super_admin') or warehouse_id in (
    select w.id
    from public.warehouses w
    join public.branches b on b.id = w.branch_id
    where b.company_id in (select public.current_user_company_ids())
  ))
);
