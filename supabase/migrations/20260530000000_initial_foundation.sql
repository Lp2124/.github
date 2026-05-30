set check_function_bodies = off;

create extension if not exists pgcrypto with schema extensions;
create extension if not exists citext with schema extensions;

create type public.user_status as enum ('active', 'disabled');
create table public.companies (
  id uuid primary key default extensions.gen_random_uuid(),
  legal_name text not null check (char_length(trim(legal_name)) between 1 and 250),
  trade_name text not null check (char_length(trim(trade_name)) between 1 and 160),
  tax_id text not null check (tax_id ~ '^[A-ZÑ&]{3,4}[0-9]{6}[A-Z0-9]{3}$'),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (tax_id)
);

create table public.branches (
  id uuid primary key default extensions.gen_random_uuid(),
  company_id uuid not null references public.companies(id) on delete restrict,
  name text not null check (char_length(trim(name)) between 1 and 160),
  code text not null check (code ~ '^[A-Z0-9_-]{2,32}$'),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (company_id, code)
);

create table public.warehouses (
  id uuid primary key default extensions.gen_random_uuid(),
  branch_id uuid not null references public.branches(id) on delete restrict,
  name text not null check (char_length(trim(name)) between 1 and 160),
  code text not null check (code ~ '^[A-Z0-9_-]{2,32}$'),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (branch_id, code)
);

create table public.cash_registers (
  id uuid primary key default extensions.gen_random_uuid(),
  branch_id uuid not null references public.branches(id) on delete restrict,
  name text not null check (char_length(trim(name)) between 1 and 160),
  code text not null check (code ~ '^[A-Z0-9_-]{2,32}$'),
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (branch_id, code)
);

create table public.user_profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  email extensions.citext not null unique,
  full_name text check (full_name is null or char_length(trim(full_name)) between 1 and 160),
  status public.user_status not null default 'active',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.permissions (
  id uuid primary key default extensions.gen_random_uuid(),
  code text not null unique check (code ~ '^[a-z]+(\.[a-z_]+)+$'),
  description text,
  created_at timestamptz not null default now()
);

create table public.roles (
  id uuid primary key default extensions.gen_random_uuid(),
  code text not null unique check (code ~ '^[a-z][a-z0-9_]{2,63}$'),
  name text not null check (char_length(trim(name)) between 1 and 120),
  description text,
  is_system boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.role_permissions (
  role_id uuid not null references public.roles(id) on delete cascade,
  permission_id uuid not null references public.permissions(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (role_id, permission_id)
);

create table public.user_roles (
  id uuid primary key default extensions.gen_random_uuid(),
  user_id uuid not null references public.user_profiles(id) on delete cascade,
  role_id uuid not null references public.roles(id) on delete restrict,
  company_id uuid references public.companies(id) on delete cascade,
  branch_id uuid references public.branches(id) on delete cascade,
  created_at timestamptz not null default now(),
  check (company_id is not null or branch_id is not null),
  unique nulls not distinct (user_id, role_id, company_id, branch_id)
);

create table public.categories (
  id uuid primary key default extensions.gen_random_uuid(),
  company_id uuid not null references public.companies(id) on delete cascade,
  parent_id uuid references public.categories(id) on delete restrict,
  name text not null check (char_length(trim(name)) between 1 and 160),
  slug text not null check (slug ~ '^[a-z0-9]+(?:-[a-z0-9]+)*$'),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (company_id, slug)
);

create table public.products (
  id uuid primary key default extensions.gen_random_uuid(),
  company_id uuid not null references public.companies(id) on delete cascade,
  category_id uuid references public.categories(id) on delete restrict,
  sku text not null check (char_length(trim(sku)) between 1 and 64),
  name text not null check (char_length(trim(name)) between 1 and 240),
  description text,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (company_id, sku)
);

create table public.inventory_balances (
  id uuid primary key default extensions.gen_random_uuid(),
  warehouse_id uuid not null references public.warehouses(id) on delete cascade,
  product_id uuid not null references public.products(id) on delete cascade,
  quantity numeric(18, 6) not null default 0 check (quantity >= 0),
  reserved_quantity numeric(18, 6) not null default 0 check (reserved_quantity >= 0),
  updated_at timestamptz not null default now(),
  unique (warehouse_id, product_id),
  check (reserved_quantity <= quantity)
);

create table public.audit_log (
  id uuid primary key default extensions.gen_random_uuid(),
  actor_user_id uuid references auth.users(id) on delete set null,
  action text not null check (char_length(trim(action)) between 1 and 80),
  entity_table text not null check (char_length(trim(entity_table)) between 1 and 120),
  entity_id uuid,
  metadata jsonb not null default '{}'::jsonb,
  occurred_at timestamptz not null default now()
);

create table public.auth_rate_limits (
  identifier_hash text not null check (identifier_hash ~ '^[a-f0-9]{64}$'),
  action text not null check (action in ('auth.sign_in', 'auth.password_reset', 'auth.password_update')),
  window_start timestamptz not null default now(),
  attempt_count integer not null default 0 check (attempt_count >= 0),
  blocked_until timestamptz,
  updated_at timestamptz not null default now(),
  primary key (identifier_hash, action)
);

create index branches_company_id_idx on public.branches(company_id);
create index warehouses_branch_id_idx on public.warehouses(branch_id);
create index cash_registers_branch_id_idx on public.cash_registers(branch_id);
create index user_roles_user_id_idx on public.user_roles(user_id);
create index user_roles_role_id_idx on public.user_roles(role_id);
create index user_roles_company_id_idx on public.user_roles(company_id);
create index user_roles_branch_id_idx on public.user_roles(branch_id);
create index categories_company_id_idx on public.categories(company_id);
create index products_company_id_idx on public.products(company_id);
create index products_category_id_idx on public.products(category_id);
create index inventory_balances_product_id_idx on public.inventory_balances(product_id);
create index audit_log_actor_occurred_at_idx on public.audit_log(actor_user_id, occurred_at desc);
create index audit_log_entity_idx on public.audit_log(entity_table, entity_id);
create index auth_rate_limits_blocked_until_idx on public.auth_rate_limits(blocked_until) where blocked_until is not null;

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger companies_set_updated_at before update on public.companies for each row execute function public.set_updated_at();
create trigger branches_set_updated_at before update on public.branches for each row execute function public.set_updated_at();
create trigger warehouses_set_updated_at before update on public.warehouses for each row execute function public.set_updated_at();
create trigger cash_registers_set_updated_at before update on public.cash_registers for each row execute function public.set_updated_at();
create trigger user_profiles_set_updated_at before update on public.user_profiles for each row execute function public.set_updated_at();
create trigger roles_set_updated_at before update on public.roles for each row execute function public.set_updated_at();
create trigger categories_set_updated_at before update on public.categories for each row execute function public.set_updated_at();
create trigger products_set_updated_at before update on public.products for each row execute function public.set_updated_at();
create trigger auth_rate_limits_set_updated_at before update on public.auth_rate_limits for each row execute function public.set_updated_at();

create or replace function public.handle_new_auth_user()
returns trigger
language plpgsql
security definer
set search_path = public, extensions
as $$
begin
  insert into public.user_profiles (id, email, full_name)
  values (
    new.id,
    new.email,
    nullif(trim(coalesce(new.raw_user_meta_data ->> 'full_name', '')), '')
  )
  on conflict (id) do update
    set email = excluded.email,
        full_name = coalesce(public.user_profiles.full_name, excluded.full_name),
        updated_at = now();

  insert into public.audit_log (actor_user_id, action, entity_table, entity_id, metadata)
  values (new.id, 'auth.user_created', 'auth.users', new.id, '{}'::jsonb);

  return new;
end;
$$;

create trigger on_auth_user_created
after insert on auth.users
for each row execute function public.handle_new_auth_user();


insert into public.permissions (code, description)
values
  ('users.read', 'Consultar usuarios internos.'),
  ('users.create', 'Crear usuarios internos.'),
  ('users.update', 'Actualizar usuarios internos.'),
  ('users.disable', 'Deshabilitar usuarios internos.'),
  ('roles.assign', 'Asignar roles a usuarios.'),
  ('roles.manage', 'Administrar roles y permisos.'),
  ('catalog.read', 'Consultar catálogo.'),
  ('catalog.create', 'Crear productos y categorías.'),
  ('catalog.update', 'Actualizar productos y categorías.'),
  ('pricing.read', 'Consultar precios.'),
  ('pricing.update', 'Actualizar precios.'),
  ('inventory.read', 'Consultar inventario.'),
  ('inventory.adjust', 'Registrar ajustes de inventario.'),
  ('inventory.transfer', 'Registrar transferencias de inventario.'),
  ('inventory.count', 'Ejecutar conteos físicos.'),
  ('inventory.receive', 'Registrar recepciones de mercancía.'),
  ('purchasing.read', 'Consultar compras.'),
  ('purchasing.create', 'Crear órdenes de compra.'),
  ('purchasing.approve', 'Aprobar órdenes de compra.'),
  ('pos.sell', 'Registrar ventas POS.'),
  ('pos.discount', 'Aplicar descuentos POS autorizados.'),
  ('pos.void', 'Cancelar ventas POS.'),
  ('pos.return', 'Procesar devoluciones POS.'),
  ('cash.open_shift', 'Abrir turno de caja.'),
  ('cash.move', 'Registrar movimientos de caja.'),
  ('cash.count', 'Registrar arqueos de caja.'),
  ('cash.close', 'Cerrar turno de caja.'),
  ('cash.approve_difference', 'Aprobar diferencias de caja.'),
  ('cfdi.issue', 'Emitir CFDI.'),
  ('cfdi.cancel', 'Cancelar CFDI.'),
  ('cfdi.global_invoice', 'Emitir factura global.'),
  ('orders.read', 'Consultar pedidos e-commerce.'),
  ('orders.update', 'Actualizar pedidos e-commerce.'),
  ('orders.fulfill', 'Preparar y surtir pedidos.'),
  ('reports.sales', 'Consultar reportes de ventas.'),
  ('reports.inventory', 'Consultar reportes de inventario.'),
  ('reports.cash', 'Consultar reportes de caja.'),
  ('reports.fiscal', 'Consultar reportes fiscales.'),
  ('reports.audit', 'Consultar reportes de auditoría.'),
  ('settings.manage', 'Administrar configuración del negocio.'),
  ('security.manage', 'Administrar configuración de seguridad.'),
  ('audit.read', 'Consultar bitácoras de auditoría.')
on conflict (code) do nothing;

insert into public.roles (code, name, description, is_system)
values
  ('super_admin', 'Super Administrador', 'Administración total de empresa, seguridad y configuración crítica.', true),
  ('director_general', 'Director General', 'Consulta ejecutiva de operación, márgenes y reportes.', true),
  ('gerente_sucursal', 'Gerente de Sucursal', 'Operación de sucursal, autorizaciones, caja e inventario local.', true),
  ('jefe_inventario', 'Jefe de Inventario', 'Control de existencias, conteos, recepciones y transferencias.', true),
  ('compras', 'Compras', 'Gestión de proveedores, órdenes de compra y recepciones.', true),
  ('cajero', 'Cajero', 'Operación POS, cobros y corte de caja propio.', true),
  ('vendedor', 'Vendedor', 'Consulta de catálogo, precios e inventario para atención a cliente.', true),
  ('facturacion', 'Facturación', 'Emisión, cancelación y seguimiento de CFDI.', true),
  ('ecommerce_manager', 'E-commerce Manager', 'Gestión de pedidos, fulfillment y catálogo online.', true),
  ('auditor', 'Auditor', 'Consulta de reportes y bitácoras sin modificación operativa.', true)
on conflict (code) do update
set name = excluded.name,
    description = excluded.description,
    is_system = true;

insert into public.role_permissions (role_id, permission_id)
select r.id, p.id
from public.roles r
cross join public.permissions p
where r.code = 'super_admin'
on conflict do nothing;

insert into public.role_permissions (role_id, permission_id)
select r.id, p.id
from public.roles r
join public.permissions p on p.code in (
  'catalog.read', 'pricing.read', 'inventory.read', 'inventory.adjust', 'inventory.transfer',
  'inventory.count', 'inventory.receive', 'pos.discount', 'pos.void', 'pos.return',
  'cash.open_shift', 'cash.move', 'cash.count', 'cash.close', 'cash.approve_difference',
  'orders.read', 'orders.update', 'orders.fulfill', 'reports.sales', 'reports.inventory',
  'reports.cash', 'audit.read'
)
where r.code = 'gerente_sucursal'
on conflict do nothing;

insert into public.role_permissions (role_id, permission_id)
select r.id, p.id
from public.roles r
join public.permissions p on p.code in (
  'catalog.read', 'inventory.read', 'inventory.adjust', 'inventory.transfer',
  'inventory.count', 'inventory.receive', 'reports.inventory'
)
where r.code = 'jefe_inventario'
on conflict do nothing;

insert into public.role_permissions (role_id, permission_id)
select r.id, p.id
from public.roles r
join public.permissions p on p.code in (
  'purchasing.read', 'purchasing.create', 'purchasing.approve', 'inventory.receive',
  'catalog.read', 'inventory.read', 'reports.inventory'
)
where r.code = 'compras'
on conflict do nothing;

insert into public.role_permissions (role_id, permission_id)
select r.id, p.id
from public.roles r
join public.permissions p on p.code in (
  'catalog.read', 'pricing.read', 'inventory.read', 'pos.sell', 'pos.return',
  'cash.open_shift', 'cash.move', 'cash.count', 'cash.close'
)
where r.code = 'cajero'
on conflict do nothing;

insert into public.role_permissions (role_id, permission_id)
select r.id, p.id
from public.roles r
join public.permissions p on p.code in ('catalog.read', 'pricing.read', 'inventory.read')
where r.code = 'vendedor'
on conflict do nothing;

insert into public.role_permissions (role_id, permission_id)
select r.id, p.id
from public.roles r
join public.permissions p on p.code in ('cfdi.issue', 'cfdi.cancel', 'cfdi.global_invoice', 'reports.fiscal')
where r.code = 'facturacion'
on conflict do nothing;

insert into public.role_permissions (role_id, permission_id)
select r.id, p.id
from public.roles r
join public.permissions p on p.code in (
  'catalog.read', 'pricing.read', 'inventory.read', 'orders.read', 'orders.update', 'orders.fulfill'
)
where r.code = 'ecommerce_manager'
on conflict do nothing;

insert into public.role_permissions (role_id, permission_id)
select r.id, p.id
from public.roles r
join public.permissions p on p.code in (
  'reports.sales', 'reports.inventory', 'reports.cash', 'reports.fiscal', 'reports.audit', 'audit.read'
)
where r.code in ('director_general', 'auditor')
on conflict do nothing;


create or replace function public.consume_auth_rate_limit(
  p_identifier_hash text,
  p_rate_limit_action text,
  p_max_attempts integer,
  p_window_seconds integer
)
returns boolean
language plpgsql
security definer
set search_path = public
as $$
declare
  current_attempt_count integer;
  current_blocked_until timestamptz;
begin
  if p_identifier_hash !~ '^[a-f0-9]{64}$' then
    raise exception 'invalid rate limit identifier';
  end if;

  if p_rate_limit_action not in ('auth.sign_in', 'auth.password_reset', 'auth.password_update') then
    raise exception 'invalid rate limit action';
  end if;

  if p_max_attempts < 1 or p_window_seconds < 60 or p_window_seconds > 86400 then
    raise exception 'invalid rate limit policy';
  end if;

  insert into public.auth_rate_limits as arl (
    identifier_hash,
    action,
    window_start,
    attempt_count,
    blocked_until
  )
  values (p_identifier_hash, p_rate_limit_action, now(), 1, null)
  on conflict (identifier_hash, action) do update
  set window_start = case
        when arl.window_start <= now() - make_interval(secs => p_window_seconds) then now()
        else arl.window_start
      end,
      attempt_count = case
        when arl.window_start <= now() - make_interval(secs => p_window_seconds) then 1
        else arl.attempt_count + 1
      end,
      blocked_until = case
        when arl.window_start <= now() - make_interval(secs => p_window_seconds) then null
        when arl.attempt_count + 1 > p_max_attempts then now() + make_interval(secs => p_window_seconds)
        else arl.blocked_until
      end,
      updated_at = now()
  returning attempt_count, blocked_until into current_attempt_count, current_blocked_until;

  return current_blocked_until is null or current_blocked_until <= now();
end;
$$;

revoke all on function public.consume_auth_rate_limit(text, text, integer, integer) from public;
grant execute on function public.consume_auth_rate_limit(text, text, integer, integer) to anon, authenticated;

create or replace function public.current_user_has_role(role_code text)
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
    join public.user_profiles up on up.id = ur.user_id
    where ur.user_id = auth.uid()
      and up.status = 'active'
      and r.code = role_code
  );
$$;

create or replace function public.current_user_company_ids()
returns setof uuid
language sql
security definer
stable
set search_path = public
as $$
  select distinct coalesce(ur.company_id, b.company_id)
  from public.user_roles ur
  left join public.branches b on b.id = ur.branch_id
  join public.user_profiles up on up.id = ur.user_id
  where ur.user_id = auth.uid()
    and up.status = 'active'
    and coalesce(ur.company_id, b.company_id) is not null;
$$;

create or replace view public.user_role_assignments
with (security_invoker = true) as
select
  up.id as user_id,
  up.email::text as email,
  r.code as role_code,
  r.name as role_name,
  ur.company_id,
  ur.branch_id
from public.user_profiles up
join public.user_roles ur on ur.user_id = up.id
join public.roles r on r.id = ur.role_id;

alter table public.companies enable row level security;
alter table public.branches enable row level security;
alter table public.warehouses enable row level security;
alter table public.cash_registers enable row level security;
alter table public.user_profiles enable row level security;
alter table public.permissions enable row level security;
alter table public.roles enable row level security;
alter table public.role_permissions enable row level security;
alter table public.user_roles enable row level security;
alter table public.categories enable row level security;
alter table public.products enable row level security;
alter table public.inventory_balances enable row level security;
alter table public.audit_log enable row level security;
alter table public.auth_rate_limits enable row level security;

create policy "profiles_select_own_or_admin" on public.user_profiles
for select to authenticated
using (id = auth.uid() or public.current_user_has_role('super_admin'));

create policy "profiles_update_own_name" on public.user_profiles
for update to authenticated
using (id = auth.uid())
with check (id = auth.uid() and status = 'active');

create policy "roles_select_authenticated" on public.roles
for select to authenticated
using (true);

create policy "permissions_select_authenticated" on public.permissions
for select to authenticated
using (true);

create policy "role_permissions_select_authenticated" on public.role_permissions
for select to authenticated
using (true);

create policy "user_roles_select_own_or_admin" on public.user_roles
for select to authenticated
using (user_id = auth.uid() or public.current_user_has_role('super_admin'));

create policy "companies_select_scoped" on public.companies
for select to authenticated
using (public.current_user_has_role('super_admin') or id in (select public.current_user_company_ids()));

create policy "branches_select_scoped" on public.branches
for select to authenticated
using (public.current_user_has_role('super_admin') or company_id in (select public.current_user_company_ids()));

create policy "warehouses_select_scoped" on public.warehouses
for select to authenticated
using (
  public.current_user_has_role('super_admin')
  or branch_id in (
    select b.id from public.branches b where b.company_id in (select public.current_user_company_ids())
  )
);

create policy "cash_registers_select_scoped" on public.cash_registers
for select to authenticated
using (
  public.current_user_has_role('super_admin')
  or branch_id in (
    select b.id from public.branches b where b.company_id in (select public.current_user_company_ids())
  )
);

create policy "categories_select_scoped" on public.categories
for select to authenticated
using (public.current_user_has_role('super_admin') or company_id in (select public.current_user_company_ids()));

create policy "products_select_scoped" on public.products
for select to authenticated
using (public.current_user_has_role('super_admin') or company_id in (select public.current_user_company_ids()));

create policy "inventory_balances_select_scoped" on public.inventory_balances
for select to authenticated
using (
  public.current_user_has_role('super_admin')
  or warehouse_id in (
    select w.id
    from public.warehouses w
    join public.branches b on b.id = w.branch_id
    where b.company_id in (select public.current_user_company_ids())
  )
);

create policy "audit_log_select_admin" on public.audit_log
for select to authenticated
using (public.current_user_has_role('super_admin'));

revoke all on public.audit_log from anon, authenticated;
grant select on public.audit_log to authenticated;
revoke all on public.auth_rate_limits from anon, authenticated;
