-- MVP operations: products, inventory, POS sales, cash, customers and reports foundation.
-- This migration does not implement SAT invoicing, online payments, e-commerce, mobile app or advanced accounting.

create type public.inventory_movement_type as enum ('initial', 'purchase', 'sale', 'adjustment', 'return', 'correction');
create type public.cash_session_status as enum ('open', 'closed');
create type public.cash_movement_type as enum ('cash_in', 'cash_out');
create type public.sale_status as enum ('completed', 'voided');

create table public.product_categories (
  id uuid primary key default gen_random_uuid(),
  store_id uuid not null references public.stores(id) on delete cascade,
  name text not null check (char_length(trim(name)) between 2 and 120),
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (store_id, id)
);

create table public.products (
  id uuid primary key default gen_random_uuid(),
  store_id uuid not null references public.stores(id) on delete cascade,
  category_id uuid,
  sku text not null check (sku ~ '^[A-Za-z0-9._-]{1,64}$'),
  barcode text check (barcode is null or char_length(trim(barcode)) between 1 and 64),
  name text not null check (char_length(trim(name)) between 2 and 180),
  description text check (description is null or char_length(description) <= 1000),
  unit text not null default 'pieza' check (char_length(trim(unit)) between 1 and 24),
  sale_price numeric(14,2) not null check (sale_price >= 0),
  cost numeric(14,2) not null default 0 check (cost >= 0),
  current_stock numeric(14,3) not null default 0,
  low_stock_threshold numeric(14,3) not null default 0 check (low_stock_threshold >= 0),
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (store_id, sku),
  unique (store_id, barcode),
  check (barcode is null or barcode <> ''),
  check (current_stock >= 0),
  unique (store_id, id),
  foreign key (store_id, category_id) references public.product_categories(store_id, id) on delete set null
);

create table public.customers (
  id uuid primary key default gen_random_uuid(),
  store_id uuid not null references public.stores(id) on delete cascade,
  name text not null check (char_length(trim(name)) between 2 and 180),
  phone text check (phone is null or char_length(trim(phone)) <= 40),
  email text check (email is null or email ~* '^[^@\s]+@[^@\s]+\.[^@\s]+$'),
  rfc text check (rfc is null or char_length(trim(rfc)) <= 20),
  notes text check (notes is null or char_length(notes) <= 1000),
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (store_id, id)
);

create table public.cash_register_sessions (
  id uuid primary key default gen_random_uuid(),
  store_id uuid not null references public.stores(id) on delete cascade,
  opened_by uuid not null references auth.users(id) on delete restrict,
  closed_by uuid references auth.users(id) on delete restrict,
  status public.cash_session_status not null default 'open',
  opening_amount numeric(14,2) not null check (opening_amount >= 0),
  expected_amount numeric(14,2),
  counted_amount numeric(14,2),
  difference_amount numeric(14,2),
  notes text check (notes is null or char_length(notes) <= 500),
  opened_at timestamptz not null default now(),
  closed_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check ((status = 'open' and closed_at is null) or (status = 'closed' and closed_at is not null)),
  unique (store_id, id)
);

create unique index cash_register_sessions_one_open_per_store_idx on public.cash_register_sessions(store_id) where status = 'open';

create table public.sales (
  id uuid primary key default gen_random_uuid(),
  store_id uuid not null references public.stores(id) on delete cascade,
  cash_session_id uuid,
  customer_id uuid,
  cashier_id uuid not null references auth.users(id) on delete restrict,
  sale_number bigint generated always as identity,
  status public.sale_status not null default 'completed',
  subtotal_amount numeric(14,2) not null check (subtotal_amount >= 0),
  discount_amount numeric(14,2) not null default 0 check (discount_amount >= 0),
  total_amount numeric(14,2) not null check (total_amount >= 0),
  gross_margin numeric(14,2) not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (store_id, sale_number),
  unique (store_id, id),
  foreign key (store_id, cash_session_id) references public.cash_register_sessions(store_id, id) on delete restrict,
  foreign key (store_id, customer_id) references public.customers(store_id, id) on delete set null
);

create table public.sale_items (
  id uuid primary key default gen_random_uuid(),
  store_id uuid not null references public.stores(id) on delete cascade,
  sale_id uuid not null,
  product_id uuid not null,
  quantity numeric(14,3) not null check (quantity > 0),
  unit_price numeric(14,2) not null check (unit_price >= 0),
  unit_cost numeric(14,2) not null check (unit_cost >= 0),
  discount_amount numeric(14,2) not null default 0 check (discount_amount >= 0),
  line_total numeric(14,2) not null check (line_total >= 0),
  created_at timestamptz not null default now(),
  foreign key (store_id, sale_id) references public.sales(store_id, id) on delete cascade,
  foreign key (store_id, product_id) references public.products(store_id, id) on delete restrict
);

create table public.inventory_movements (
  id uuid primary key default gen_random_uuid(),
  store_id uuid not null references public.stores(id) on delete cascade,
  product_id uuid not null,
  actor_id uuid references auth.users(id) on delete set null,
  movement_type public.inventory_movement_type not null,
  quantity_delta numeric(14,3) not null check (quantity_delta <> 0),
  stock_after numeric(14,3) not null check (stock_after >= 0),
  reason text not null check (char_length(trim(reason)) between 5 and 240),
  reference text check (reference is null or char_length(trim(reference)) <= 120),
  sale_id uuid,
  created_at timestamptz not null default now(),
  foreign key (store_id, product_id) references public.products(store_id, id) on delete restrict,
  foreign key (store_id, sale_id) references public.sales(store_id, id) on delete set null
);

create table public.cash_movements (
  id uuid primary key default gen_random_uuid(),
  store_id uuid not null references public.stores(id) on delete cascade,
  cash_session_id uuid not null,
  actor_id uuid references auth.users(id) on delete set null,
  movement_type public.cash_movement_type not null,
  amount numeric(14,2) not null check (amount > 0),
  reason text not null check (char_length(trim(reason)) between 5 and 240),
  created_at timestamptz not null default now(),
  foreign key (store_id, cash_session_id) references public.cash_register_sessions(store_id, id) on delete restrict
);

create unique index product_categories_store_id_unique_idx on public.product_categories(store_id, id);
create unique index product_categories_store_name_unique_idx on public.product_categories(store_id, lower(name));
create index product_categories_store_idx on public.product_categories(store_id, is_active);
create index products_store_search_idx on public.products(store_id, is_active, sku, name);
create index products_store_stock_idx on public.products(store_id, current_stock);
create index customers_store_idx on public.customers(store_id, is_active, name);
create index sales_store_created_idx on public.sales(store_id, created_at desc);
create index sale_items_store_product_idx on public.sale_items(store_id, product_id);
create index inventory_movements_store_product_idx on public.inventory_movements(store_id, product_id, created_at desc);
create index cash_movements_store_session_idx on public.cash_movements(store_id, cash_session_id, created_at desc);

create trigger product_categories_set_updated_at before update on public.product_categories for each row execute function public.set_updated_at();
create trigger products_set_updated_at before update on public.products for each row execute function public.set_updated_at();
create trigger customers_set_updated_at before update on public.customers for each row execute function public.set_updated_at();
create trigger cash_register_sessions_set_updated_at before update on public.cash_register_sessions for each row execute function public.set_updated_at();
create trigger sales_set_updated_at before update on public.sales for each row execute function public.set_updated_at();

alter table public.product_categories enable row level security;
alter table public.products enable row level security;
alter table public.customers enable row level security;
alter table public.cash_register_sessions enable row level security;
alter table public.sales enable row level security;
alter table public.sale_items enable row level security;
alter table public.inventory_movements enable row level security;
alter table public.cash_movements enable row level security;

create policy product_categories_select_member on public.product_categories for select to authenticated using (public.is_store_member(store_id));
create policy product_categories_insert_manager on public.product_categories for insert to authenticated with check (public.is_store_member(store_id, array['owner','admin','manager']::public.store_role[]));
create policy product_categories_update_manager on public.product_categories for update to authenticated using (public.is_store_member(store_id, array['owner','admin','manager']::public.store_role[])) with check (public.is_store_member(store_id, array['owner','admin','manager']::public.store_role[]));

create policy products_select_member on public.products for select to authenticated using (public.is_store_member(store_id));
create policy products_insert_manager on public.products for insert to authenticated with check (public.is_store_member(store_id, array['owner','admin','manager']::public.store_role[]));
create policy products_update_manager on public.products for update to authenticated using (public.is_store_member(store_id, array['owner','admin','manager']::public.store_role[])) with check (public.is_store_member(store_id, array['owner','admin','manager']::public.store_role[]));

create policy customers_select_member on public.customers for select to authenticated using (public.is_store_member(store_id));
create policy customers_insert_staff on public.customers for insert to authenticated with check (public.is_store_member(store_id, array['owner','admin','manager','staff']::public.store_role[]));
create policy customers_update_manager on public.customers for update to authenticated using (public.is_store_member(store_id, array['owner','admin','manager']::public.store_role[])) with check (public.is_store_member(store_id, array['owner','admin','manager']::public.store_role[]));

create policy cash_sessions_select_staff on public.cash_register_sessions for select to authenticated using (public.is_store_member(store_id, array['owner','admin','manager','staff']::public.store_role[]));
create policy cash_sessions_insert_manager on public.cash_register_sessions for insert to authenticated with check (public.is_store_member(store_id, array['owner','admin','manager']::public.store_role[]) and opened_by = auth.uid());
create policy cash_sessions_update_manager on public.cash_register_sessions for update to authenticated using (public.is_store_member(store_id, array['owner','admin','manager']::public.store_role[]) and status = 'open') with check (public.is_store_member(store_id, array['owner','admin','manager']::public.store_role[]));

create policy sales_select_member on public.sales for select to authenticated using (public.is_store_member(store_id));
create policy sales_insert_staff on public.sales for insert to authenticated with check (public.is_store_member(store_id, array['owner','admin','manager','staff']::public.store_role[]) and cashier_id = auth.uid());
create policy sale_items_select_member on public.sale_items for select to authenticated using (public.is_store_member(store_id));
create policy sale_items_insert_staff on public.sale_items for insert to authenticated with check (public.is_store_member(store_id, array['owner','admin','manager','staff']::public.store_role[]));

create policy inventory_movements_select_member on public.inventory_movements for select to authenticated using (public.is_store_member(store_id));
create policy inventory_movements_insert_staff on public.inventory_movements for insert to authenticated with check (public.is_store_member(store_id, array['owner','admin','manager','staff']::public.store_role[]) and actor_id = auth.uid());

create policy cash_movements_select_staff on public.cash_movements for select to authenticated using (public.is_store_member(store_id, array['owner','admin','manager','staff']::public.store_role[]));
create policy cash_movements_insert_manager on public.cash_movements for insert to authenticated with check (public.is_store_member(store_id, array['owner','admin','manager']::public.store_role[]) and actor_id = auth.uid());

create or replace function public.complete_pos_sale(
  p_store_id uuid,
  p_actor_id uuid,
  p_cash_session_id uuid,
  p_customer_id uuid,
  p_discount_amount numeric,
  p_items jsonb
)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  item jsonb;
  product_row public.products%rowtype;
  v_sale_id uuid := gen_random_uuid();
  v_subtotal numeric(14,2) := 0;
  v_total numeric(14,2) := 0;
  v_margin numeric(14,2) := 0;
  v_line_total numeric(14,2);
  v_qty numeric(14,3);
  v_discount numeric(14,2);
begin
  if auth.uid() is null or auth.uid() <> p_actor_id then raise exception 'invalid actor'; end if;
  if not public.is_store_member(p_store_id, array['owner','admin','manager','staff']::public.store_role[]) then raise exception 'insufficient role'; end if;
  if p_discount_amount > 0 and not public.is_store_member(p_store_id, array['owner','admin','manager']::public.store_role[]) then raise exception 'discount not allowed'; end if;
  if jsonb_typeof(p_items) <> 'array' or jsonb_array_length(p_items) = 0 then raise exception 'empty sale'; end if;
  perform 1 from public.cash_register_sessions where id = p_cash_session_id and store_id = p_store_id and status = 'open';
  if not found then raise exception 'cash session required'; end if;

  insert into public.sales (id, store_id, cash_session_id, customer_id, cashier_id, subtotal_amount, discount_amount, total_amount, gross_margin)
  values (v_sale_id, p_store_id, p_cash_session_id, p_customer_id, p_actor_id, 0, p_discount_amount, 0, 0);

  for item in select * from jsonb_array_elements(p_items) loop
    v_qty := (item ->> 'quantity')::numeric;
    v_discount := coalesce((item ->> 'discountAmount')::numeric, 0);
    if v_qty <= 0 or v_discount < 0 then raise exception 'invalid item'; end if;
    select * into product_row from public.products where id = (item ->> 'productId')::uuid and store_id = p_store_id and is_active = true for update;
    if not found then raise exception 'product unavailable'; end if;
    if product_row.current_stock < v_qty then raise exception 'insufficient stock'; end if;
    v_line_total := greatest(round((product_row.sale_price * v_qty) - v_discount, 2), 0);
    v_subtotal := v_subtotal + round(product_row.sale_price * v_qty, 2);
    v_total := v_total + v_line_total;
    v_margin := v_margin + round((product_row.sale_price - product_row.cost) * v_qty, 2) - v_discount;
    update public.products set current_stock = current_stock - v_qty where id = product_row.id;
    insert into public.sale_items (store_id, sale_id, product_id, quantity, unit_price, unit_cost, discount_amount, line_total)
    values (p_store_id, v_sale_id, product_row.id, v_qty, product_row.sale_price, product_row.cost, v_discount, v_line_total);
    insert into public.inventory_movements (store_id, product_id, actor_id, movement_type, quantity_delta, stock_after, reason, reference, sale_id)
    values (p_store_id, product_row.id, p_actor_id, 'sale', -v_qty, product_row.current_stock - v_qty, 'Venta POS', v_sale_id::text, v_sale_id);
  end loop;

  v_total := greatest(v_total - p_discount_amount, 0);
  update public.sales set subtotal_amount = v_subtotal, discount_amount = p_discount_amount, total_amount = v_total, gross_margin = v_margin - p_discount_amount where id = v_sale_id;
  return v_sale_id;
end;
$$;

create or replace function public.close_cash_session(p_store_id uuid, p_actor_id uuid, p_counted_amount numeric, p_notes text default null)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  session_row public.cash_register_sessions%rowtype;
  expected numeric(14,2);
begin
  if auth.uid() is null or auth.uid() <> p_actor_id then raise exception 'invalid actor'; end if;
  if not public.is_store_member(p_store_id, array['owner','admin','manager']::public.store_role[]) then raise exception 'insufficient role'; end if;
  select * into session_row from public.cash_register_sessions where store_id = p_store_id and status = 'open' for update;
  if not found then raise exception 'cash session not found'; end if;
  select session_row.opening_amount + coalesce((select sum(total_amount) from public.sales where store_id = p_store_id and cash_session_id = session_row.id and status = 'completed'), 0) + coalesce((select sum(case when movement_type = 'cash_in' then amount else -amount end) from public.cash_movements where store_id = p_store_id and cash_session_id = session_row.id), 0) into expected;
  update public.cash_register_sessions set status = 'closed', closed_by = p_actor_id, closed_at = now(), expected_amount = expected, counted_amount = p_counted_amount, difference_amount = p_counted_amount - expected, notes = coalesce(p_notes, notes) where id = session_row.id;
  return session_row.id;
end;
$$;

revoke all on function public.complete_pos_sale(uuid, uuid, uuid, uuid, numeric, jsonb) from public;
revoke all on function public.close_cash_session(uuid, uuid, numeric, text) from public;
grant execute on function public.complete_pos_sale(uuid, uuid, uuid, uuid, numeric, jsonb) to authenticated;
grant execute on function public.close_cash_session(uuid, uuid, numeric, text) to authenticated;

grant select, insert, update on public.product_categories to authenticated;
grant select, insert, update on public.products to authenticated;
grant select, insert, update on public.customers to authenticated;
grant select, insert, update on public.cash_register_sessions to authenticated;
grant select, insert on public.sales to authenticated;
grant select, insert on public.sale_items to authenticated;
grant select, insert on public.inventory_movements to authenticated;
grant select, insert on public.cash_movements to authenticated;
