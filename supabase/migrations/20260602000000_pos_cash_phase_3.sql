set check_function_bodies = off;

do $$
begin
  if not exists (select 1 from pg_type where typname = 'cash_shift_status') then
    create type public.cash_shift_status as enum ('open', 'closed', 'cancelled');
  end if;
  if not exists (select 1 from pg_type where typname = 'sale_status') then
    create type public.sale_status as enum ('completed', 'voided', 'refunded');
  end if;
  if not exists (select 1 from pg_type where typname = 'payment_method_type') then
    create type public.payment_method_type as enum ('efectivo', 'tarjeta', 'transferencia');
  end if;
  if not exists (select 1 from pg_type where typname = 'cash_movement_type') then
    create type public.cash_movement_type as enum ('entrada', 'salida');
  end if;
end $$;

create table public.cash_shifts (
  id uuid primary key default extensions.gen_random_uuid(),
  company_id uuid not null references public.companies(id) on delete restrict,
  branch_id uuid not null references public.branches(id) on delete restrict,
  cash_register_id uuid not null references public.cash_registers(id) on delete restrict,
  opened_by_user_id uuid not null references auth.users(id) on delete restrict,
  closed_by_user_id uuid references auth.users(id) on delete restrict,
  status public.cash_shift_status not null default 'open',
  opening_float numeric(18, 6) not null check (opening_float >= 0),
  expected_cash numeric(18, 6) not null default 0 check (expected_cash >= 0),
  counted_cash numeric(18, 6) check (counted_cash is null or counted_cash >= 0),
  cash_difference numeric(18, 6),
  opened_at timestamptz not null default now(),
  closed_at timestamptz,
  closing_notes text check (closing_notes is null or char_length(trim(closing_notes)) <= 1000),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint cash_shift_closed_fields_check check (
    (status = 'open' and closed_at is null and counted_cash is null)
    or (status in ('closed', 'cancelled'))
  )
);

create unique index cash_shifts_one_open_register_idx on public.cash_shifts(cash_register_id) where status = 'open';
create unique index cash_shifts_one_open_cashier_idx on public.cash_shifts(opened_by_user_id) where status = 'open';
create index cash_shifts_branch_opened_idx on public.cash_shifts(branch_id, opened_at desc);
create index cash_shifts_cashier_opened_idx on public.cash_shifts(opened_by_user_id, opened_at desc);

create table public.sales (
  id uuid primary key default extensions.gen_random_uuid(),
  company_id uuid not null references public.companies(id) on delete restrict,
  branch_id uuid not null references public.branches(id) on delete restrict,
  warehouse_id uuid not null references public.warehouses(id) on delete restrict,
  cash_shift_id uuid not null references public.cash_shifts(id) on delete restrict,
  cashier_user_id uuid not null references auth.users(id) on delete restrict,
  ticket_number bigint not null,
  status public.sale_status not null default 'completed',
  subtotal numeric(18, 6) not null check (subtotal >= 0),
  discount_total numeric(18, 6) not null default 0 check (discount_total >= 0),
  tax_total numeric(18, 6) not null default 0 check (tax_total >= 0),
  total numeric(18, 6) not null check (total >= 0),
  void_reason text check (void_reason is null or char_length(trim(void_reason)) between 3 and 500),
  voided_by_user_id uuid references auth.users(id) on delete restrict,
  voided_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (company_id, ticket_number)
);

create sequence if not exists public.sales_ticket_number_seq as bigint start with 1 increment by 1;

create table public.sale_lines (
  id uuid primary key default extensions.gen_random_uuid(),
  sale_id uuid not null references public.sales(id) on delete cascade,
  product_id uuid not null references public.products(id) on delete restrict,
  sku text not null,
  product_name text not null,
  quantity numeric(18, 6) not null check (quantity > 0),
  unit_price numeric(18, 6) not null check (unit_price >= 0),
  discount_amount numeric(18, 6) not null default 0 check (discount_amount >= 0),
  line_total numeric(18, 6) not null check (line_total >= 0),
  created_at timestamptz not null default now()
);

create table public.sale_payments (
  id uuid primary key default extensions.gen_random_uuid(),
  sale_id uuid not null references public.sales(id) on delete cascade,
  payment_method public.payment_method_type not null,
  amount numeric(18, 6) not null check (amount > 0),
  reference text check (reference is null or char_length(trim(reference)) <= 120),
  created_at timestamptz not null default now()
);

create table public.sale_returns (
  id uuid primary key default extensions.gen_random_uuid(),
  original_sale_id uuid not null references public.sales(id) on delete restrict,
  company_id uuid not null references public.companies(id) on delete restrict,
  branch_id uuid not null references public.branches(id) on delete restrict,
  warehouse_id uuid not null references public.warehouses(id) on delete restrict,
  cash_shift_id uuid not null references public.cash_shifts(id) on delete restrict,
  returned_by_user_id uuid not null references auth.users(id) on delete restrict,
  reason text not null check (char_length(trim(reason)) between 3 and 500),
  total_refund numeric(18, 6) not null check (total_refund >= 0),
  created_at timestamptz not null default now()
);

create table public.sale_return_lines (
  id uuid primary key default extensions.gen_random_uuid(),
  sale_return_id uuid not null references public.sale_returns(id) on delete cascade,
  sale_line_id uuid not null references public.sale_lines(id) on delete restrict,
  product_id uuid not null references public.products(id) on delete restrict,
  quantity numeric(18, 6) not null check (quantity > 0),
  refund_amount numeric(18, 6) not null check (refund_amount >= 0),
  created_at timestamptz not null default now()
);

create table public.cash_shift_movements (
  id uuid primary key default extensions.gen_random_uuid(),
  cash_shift_id uuid not null references public.cash_shifts(id) on delete restrict,
  movement_type public.cash_movement_type not null,
  amount numeric(18, 6) not null check (amount > 0),
  reason text not null check (char_length(trim(reason)) between 3 and 500),
  created_by_user_id uuid not null references auth.users(id) on delete restrict,
  created_at timestamptz not null default now()
);

create index sales_shift_created_idx on public.sales(cash_shift_id, created_at desc);
create index sales_cashier_created_idx on public.sales(cashier_user_id, created_at desc);
create index sale_lines_sale_id_idx on public.sale_lines(sale_id);
create index sale_lines_product_id_idx on public.sale_lines(product_id);
create index sale_payments_sale_id_idx on public.sale_payments(sale_id);
create index sale_returns_original_sale_id_idx on public.sale_returns(original_sale_id);
create index cash_shift_movements_shift_created_idx on public.cash_shift_movements(cash_shift_id, created_at desc);

create trigger cash_shifts_set_updated_at before update on public.cash_shifts for each row execute function public.set_updated_at();
create trigger sales_set_updated_at before update on public.sales for each row execute function public.set_updated_at();

create or replace function public.get_active_cash_shift()
returns uuid
language sql
security definer
stable
set search_path = public
as $$
  select cs.id
  from public.cash_shifts cs
  where cs.opened_by_user_id = auth.uid()
    and cs.status = 'open'
  order by cs.opened_at desc
  limit 1;
$$;

create or replace function public.open_cash_shift(
  p_cash_register_id uuid,
  p_opening_float numeric
)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  register_branch_id uuid;
  register_company_id uuid;
  shift_id uuid;
begin
  if auth.uid() is null then raise exception 'authentication required'; end if;
  if p_opening_float < 0 then raise exception 'opening float must be non-negative'; end if;
  if not public.current_user_has_permission('cash.open_shift') and not public.current_user_has_role('super_admin') then
    raise exception 'insufficient cash permissions';
  end if;

  select cr.branch_id, b.company_id into register_branch_id, register_company_id
  from public.cash_registers cr
  join public.branches b on b.id = cr.branch_id
  where cr.id = p_cash_register_id and cr.is_active = true;

  if register_company_id is null then raise exception 'cash register not found'; end if;
  if not public.current_user_has_role('super_admin') and register_company_id not in (select public.current_user_company_ids()) then
    raise exception 'cash register outside user scope';
  end if;

  insert into public.cash_shifts (company_id, branch_id, cash_register_id, opened_by_user_id, opening_float, expected_cash)
  values (register_company_id, register_branch_id, p_cash_register_id, auth.uid(), p_opening_float, p_opening_float)
  returning id into shift_id;

  insert into public.audit_log (actor_user_id, action, entity_table, entity_id, metadata)
  values (auth.uid(), 'cash.shift_opened', 'cash_shifts', shift_id, jsonb_build_object('cash_register_id', p_cash_register_id));

  return shift_id;
end;
$$;

create or replace function public.record_cash_shift_movement(
  p_cash_shift_id uuid,
  p_movement_type public.cash_movement_type,
  p_amount numeric,
  p_reason text
)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  shift_record public.cash_shifts%rowtype;
  movement_id uuid;
begin
  if auth.uid() is null then raise exception 'authentication required'; end if;
  if p_amount <= 0 then raise exception 'amount must be positive'; end if;
  if char_length(trim(p_reason)) < 3 then raise exception 'reason is required'; end if;
  if not public.current_user_has_permission('cash.move') and not public.current_user_has_role('super_admin') then
    raise exception 'insufficient cash permissions';
  end if;

  select * into shift_record from public.cash_shifts where id = p_cash_shift_id and status = 'open' for update;
  if shift_record.id is null then raise exception 'open cash shift not found'; end if;
  if shift_record.opened_by_user_id <> auth.uid() and not public.current_user_has_role('super_admin') then
    raise exception 'cash shift belongs to another cashier';
  end if;

  insert into public.cash_shift_movements (cash_shift_id, movement_type, amount, reason, created_by_user_id)
  values (p_cash_shift_id, p_movement_type, p_amount, trim(p_reason), auth.uid())
  returning id into movement_id;

  update public.cash_shifts
  set expected_cash = case when p_movement_type = 'entrada' then expected_cash + p_amount else expected_cash - p_amount end,
      updated_at = now()
  where id = p_cash_shift_id;

  insert into public.audit_log (actor_user_id, action, entity_table, entity_id, metadata)
  values (auth.uid(), 'cash.movement_registered', 'cash_shift_movements', movement_id, jsonb_build_object('cash_shift_id', p_cash_shift_id, 'movement_type', p_movement_type));

  return movement_id;
end;
$$;

create or replace function public.create_pos_sale(
  p_warehouse_id uuid,
  p_items jsonb,
  p_payments jsonb,
  p_discount_total numeric default 0
)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  shift_record public.cash_shifts%rowtype;
  warehouse_branch_id uuid;
  warehouse_company_id uuid;
  sale_id uuid;
  item jsonb;
  payment jsonb;
  product_record public.products%rowtype;
  balance_record public.inventory_balances%rowtype;
  item_quantity numeric;
  item_unit_price numeric;
  item_discount numeric;
  item_line_total numeric;
  sale_subtotal numeric := 0;
  sale_total numeric := 0;
  payment_total numeric := 0;
  payment_method text;
  cash_payment_total numeric := 0;
begin
  if auth.uid() is null then raise exception 'authentication required'; end if;
  if not public.current_user_has_permission('pos.sell') and not public.current_user_has_role('super_admin') then
    raise exception 'insufficient pos permissions';
  end if;
  if jsonb_typeof(p_items) <> 'array' or jsonb_array_length(p_items) = 0 then raise exception 'sale items are required'; end if;
  if jsonb_typeof(p_payments) <> 'array' or jsonb_array_length(p_payments) = 0 then raise exception 'sale payments are required'; end if;
  if p_discount_total < 0 then raise exception 'discount cannot be negative'; end if;
  if p_discount_total > 0 and not public.current_user_has_permission('pos.discount') and not public.current_user_has_role('super_admin') then
    raise exception 'discount permission required';
  end if;

  select * into shift_record from public.cash_shifts where id = public.get_active_cash_shift() and status = 'open' for update;
  if shift_record.id is null then raise exception 'open cash shift is required'; end if;

  select b.id, b.company_id into warehouse_branch_id, warehouse_company_id
  from public.warehouses w join public.branches b on b.id = w.branch_id where w.id = p_warehouse_id;
  if warehouse_company_id is null or warehouse_company_id <> shift_record.company_id then raise exception 'warehouse outside cash shift company'; end if;

  for item in select * from jsonb_array_elements(p_items) loop
    item_quantity := (item ->> 'quantity')::numeric;
    item_unit_price := (item ->> 'unit_price')::numeric;
    item_discount := coalesce((item ->> 'discount_amount')::numeric, 0);
    if item_quantity <= 0 or item_unit_price < 0 or item_discount < 0 then raise exception 'invalid sale item'; end if;

    select * into product_record from public.products where id = (item ->> 'product_id')::uuid and is_active = true;
    if product_record.id is null or product_record.company_id <> shift_record.company_id then raise exception 'invalid product in sale'; end if;

    item_line_total := (item_quantity * item_unit_price) - item_discount;
    if item_line_total < 0 then raise exception 'line total cannot be negative'; end if;
    sale_subtotal := sale_subtotal + (item_quantity * item_unit_price);
    sale_total := sale_total + item_line_total;
  end loop;

  sale_total := sale_total - p_discount_total;
  if sale_total < 0 then raise exception 'sale total cannot be negative'; end if;

  for payment in select * from jsonb_array_elements(p_payments) loop
    payment_method := payment ->> 'payment_method';
    if payment_method not in ('efectivo', 'tarjeta', 'transferencia') then raise exception 'invalid payment method'; end if;
    payment_total := payment_total + (payment ->> 'amount')::numeric;
    if payment_method = 'efectivo' then cash_payment_total := cash_payment_total + (payment ->> 'amount')::numeric; end if;
  end loop;

  if payment_total <> sale_total then raise exception 'payments must match sale total'; end if;

  insert into public.sales (company_id, branch_id, warehouse_id, cash_shift_id, cashier_user_id, ticket_number, subtotal, discount_total, total)
  values (shift_record.company_id, shift_record.branch_id, p_warehouse_id, shift_record.id, auth.uid(), nextval('public.sales_ticket_number_seq'), sale_subtotal, p_discount_total, sale_total)
  returning id into sale_id;

  for item in select * from jsonb_array_elements(p_items) loop
    item_quantity := (item ->> 'quantity')::numeric;
    item_unit_price := (item ->> 'unit_price')::numeric;
    item_discount := coalesce((item ->> 'discount_amount')::numeric, 0);
    select * into product_record from public.products where id = (item ->> 'product_id')::uuid;

    insert into public.inventory_balances (warehouse_id, product_id, quantity)
    values (p_warehouse_id, product_record.id, 0)
    on conflict (warehouse_id, product_id) do nothing;

    select * into balance_record from public.inventory_balances where warehouse_id = p_warehouse_id and product_id = product_record.id for update;
    if product_record.track_inventory and balance_record.quantity < item_quantity then raise exception 'insufficient stock for product %', product_record.sku; end if;

    if product_record.track_inventory then
      update public.inventory_balances set quantity = balance_record.quantity - item_quantity, updated_at = now() where id = balance_record.id;
      insert into public.inventory_movements (company_id, branch_id, warehouse_id, product_id, movement_type, quantity_delta, previous_quantity, new_quantity, reason, reference_document, created_by_user_id)
      values (shift_record.company_id, shift_record.branch_id, p_warehouse_id, product_record.id, 'salida', -item_quantity, balance_record.quantity, balance_record.quantity - item_quantity, 'Venta POS', sale_id::text, auth.uid());
    end if;

    insert into public.sale_lines (sale_id, product_id, sku, product_name, quantity, unit_price, discount_amount, line_total)
    values (sale_id, product_record.id, product_record.sku, product_record.name, item_quantity, item_unit_price, item_discount, (item_quantity * item_unit_price) - item_discount);
  end loop;

  for payment in select * from jsonb_array_elements(p_payments) loop
    insert into public.sale_payments (sale_id, payment_method, amount, reference)
    values (sale_id, (payment ->> 'payment_method')::public.payment_method_type, (payment ->> 'amount')::numeric, nullif(trim(coalesce(payment ->> 'reference', '')), ''));
  end loop;

  update public.cash_shifts set expected_cash = expected_cash + cash_payment_total, updated_at = now() where id = shift_record.id;

  insert into public.audit_log (actor_user_id, action, entity_table, entity_id, metadata)
  values (auth.uid(), 'pos.sale_completed', 'sales', sale_id, jsonb_build_object('total', sale_total, 'cash_shift_id', shift_record.id));

  return sale_id;
end;
$$;

create or replace function public.void_pos_sale(
  p_sale_id uuid,
  p_reason text
)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  sale_record public.sales%rowtype;
  line_record public.sale_lines%rowtype;
  balance_record public.inventory_balances%rowtype;
  cash_refund numeric := 0;
begin
  if auth.uid() is null then raise exception 'authentication required'; end if;
  if not public.current_user_has_permission('pos.void') and not public.current_user_has_role('super_admin') then raise exception 'void permission required'; end if;
  if char_length(trim(p_reason)) < 3 then raise exception 'reason is required'; end if;

  select * into sale_record from public.sales where id = p_sale_id for update;
  if sale_record.id is null or sale_record.status <> 'completed' then raise exception 'completed sale not found'; end if;

  for line_record in select * from public.sale_lines where sale_id = p_sale_id loop
    insert into public.inventory_balances (warehouse_id, product_id, quantity)
    values (sale_record.warehouse_id, line_record.product_id, 0)
    on conflict (warehouse_id, product_id) do nothing;
    select * into balance_record from public.inventory_balances where warehouse_id = sale_record.warehouse_id and product_id = line_record.product_id for update;
    update public.inventory_balances set quantity = balance_record.quantity + line_record.quantity, updated_at = now() where id = balance_record.id;
    insert into public.inventory_movements (company_id, branch_id, warehouse_id, product_id, movement_type, quantity_delta, previous_quantity, new_quantity, reason, reference_document, created_by_user_id)
    values (sale_record.company_id, sale_record.branch_id, sale_record.warehouse_id, line_record.product_id, 'devolucion', line_record.quantity, balance_record.quantity, balance_record.quantity + line_record.quantity, 'Cancelación POS: ' || trim(p_reason), p_sale_id::text, auth.uid());
  end loop;

  select coalesce(sum(amount), 0) into cash_refund from public.sale_payments where sale_id = p_sale_id and payment_method = 'efectivo';
  update public.cash_shifts set expected_cash = greatest(expected_cash - cash_refund, 0), updated_at = now() where id = sale_record.cash_shift_id and status = 'open';
  update public.sales set status = 'voided', void_reason = trim(p_reason), voided_by_user_id = auth.uid(), voided_at = now(), updated_at = now() where id = p_sale_id;

  insert into public.audit_log (actor_user_id, action, entity_table, entity_id, metadata)
  values (auth.uid(), 'pos.sale_voided', 'sales', p_sale_id, jsonb_build_object('reason', trim(p_reason)));

  return p_sale_id;
end;
$$;

create or replace function public.return_pos_sale(
  p_sale_id uuid,
  p_reason text
)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  sale_record public.sales%rowtype;
  line_record public.sale_lines%rowtype;
  balance_record public.inventory_balances%rowtype;
  return_id uuid;
  cash_refund numeric := 0;
begin
  if auth.uid() is null then raise exception 'authentication required'; end if;
  if not public.current_user_has_permission('pos.return') and not public.current_user_has_role('super_admin') then raise exception 'return permission required'; end if;
  if char_length(trim(p_reason)) < 3 then raise exception 'reason is required'; end if;

  select * into sale_record from public.sales where id = p_sale_id for update;
  if sale_record.id is null or sale_record.status <> 'completed' then raise exception 'completed sale not found'; end if;

  insert into public.sale_returns (original_sale_id, company_id, branch_id, warehouse_id, cash_shift_id, returned_by_user_id, reason, total_refund)
  values (p_sale_id, sale_record.company_id, sale_record.branch_id, sale_record.warehouse_id, sale_record.cash_shift_id, auth.uid(), trim(p_reason), sale_record.total)
  returning id into return_id;

  for line_record in select * from public.sale_lines where sale_id = p_sale_id loop
    insert into public.inventory_balances (warehouse_id, product_id, quantity)
    values (sale_record.warehouse_id, line_record.product_id, 0)
    on conflict (warehouse_id, product_id) do nothing;
    select * into balance_record from public.inventory_balances where warehouse_id = sale_record.warehouse_id and product_id = line_record.product_id for update;
    update public.inventory_balances set quantity = balance_record.quantity + line_record.quantity, updated_at = now() where id = balance_record.id;
    insert into public.sale_return_lines (sale_return_id, sale_line_id, product_id, quantity, refund_amount)
    values (return_id, line_record.id, line_record.product_id, line_record.quantity, line_record.line_total);
    insert into public.inventory_movements (company_id, branch_id, warehouse_id, product_id, movement_type, quantity_delta, previous_quantity, new_quantity, reason, reference_document, created_by_user_id)
    values (sale_record.company_id, sale_record.branch_id, sale_record.warehouse_id, line_record.product_id, 'devolucion', line_record.quantity, balance_record.quantity, balance_record.quantity + line_record.quantity, 'Devolución POS: ' || trim(p_reason), return_id::text, auth.uid());
  end loop;

  select coalesce(sum(amount), 0) into cash_refund from public.sale_payments where sale_id = p_sale_id and payment_method = 'efectivo';
  update public.cash_shifts set expected_cash = greatest(expected_cash - cash_refund, 0), updated_at = now() where id = sale_record.cash_shift_id and status = 'open';
  update public.sales set status = 'refunded', updated_at = now() where id = p_sale_id;

  insert into public.audit_log (actor_user_id, action, entity_table, entity_id, metadata)
  values (auth.uid(), 'pos.sale_returned', 'sale_returns', return_id, jsonb_build_object('sale_id', p_sale_id));

  return return_id;
end;
$$;

create or replace function public.close_cash_shift(
  p_cash_shift_id uuid,
  p_counted_cash numeric,
  p_closing_notes text default null
)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  shift_record public.cash_shifts%rowtype;
begin
  if auth.uid() is null then raise exception 'authentication required'; end if;
  if p_counted_cash < 0 then raise exception 'counted cash must be non-negative'; end if;
  if not public.current_user_has_permission('cash.close') and not public.current_user_has_role('super_admin') then raise exception 'cash close permission required'; end if;

  select * into shift_record from public.cash_shifts where id = p_cash_shift_id and status = 'open' for update;
  if shift_record.id is null then raise exception 'open cash shift not found'; end if;
  if shift_record.opened_by_user_id <> auth.uid() and not public.current_user_has_role('super_admin') then raise exception 'cash shift belongs to another cashier'; end if;

  update public.cash_shifts
  set status = 'closed',
      closed_by_user_id = auth.uid(),
      counted_cash = p_counted_cash,
      cash_difference = p_counted_cash - expected_cash,
      closed_at = now(),
      closing_notes = nullif(trim(coalesce(p_closing_notes, '')), ''),
      updated_at = now()
  where id = p_cash_shift_id;

  insert into public.audit_log (actor_user_id, action, entity_table, entity_id, metadata)
  values (auth.uid(), 'cash.shift_closed', 'cash_shifts', p_cash_shift_id, jsonb_build_object('counted_cash', p_counted_cash, 'expected_cash', shift_record.expected_cash));

  return p_cash_shift_id;
end;
$$;

revoke all on function public.open_cash_shift(uuid, numeric) from public;
revoke all on function public.record_cash_shift_movement(uuid, public.cash_movement_type, numeric, text) from public;
revoke all on function public.create_pos_sale(uuid, jsonb, jsonb, numeric) from public;
revoke all on function public.void_pos_sale(uuid, text) from public;
revoke all on function public.return_pos_sale(uuid, text) from public;
revoke all on function public.close_cash_shift(uuid, numeric, text) from public;
grant execute on function public.open_cash_shift(uuid, numeric) to authenticated;
grant execute on function public.record_cash_shift_movement(uuid, public.cash_movement_type, numeric, text) to authenticated;
grant execute on function public.create_pos_sale(uuid, jsonb, jsonb, numeric) to authenticated;
grant execute on function public.void_pos_sale(uuid, text) to authenticated;
grant execute on function public.return_pos_sale(uuid, text) to authenticated;
grant execute on function public.close_cash_shift(uuid, numeric, text) to authenticated;

alter table public.cash_shifts enable row level security;
alter table public.sales enable row level security;
alter table public.sale_lines enable row level security;
alter table public.sale_payments enable row level security;
alter table public.sale_returns enable row level security;
alter table public.sale_return_lines enable row level security;
alter table public.cash_shift_movements enable row level security;

create policy "cash_shifts_select_scoped" on public.cash_shifts
for select to authenticated
using (public.current_user_has_role('super_admin') or opened_by_user_id = auth.uid() or company_id in (select public.current_user_company_ids()));

create policy "sales_select_scoped" on public.sales
for select to authenticated
using (public.current_user_has_role('super_admin') or cashier_user_id = auth.uid() or company_id in (select public.current_user_company_ids()));

create policy "sale_lines_select_scoped" on public.sale_lines
for select to authenticated
using (exists (select 1 from public.sales s where s.id = sale_id and (public.current_user_has_role('super_admin') or s.cashier_user_id = auth.uid() or s.company_id in (select public.current_user_company_ids()))));

create policy "sale_payments_select_scoped" on public.sale_payments
for select to authenticated
using (exists (select 1 from public.sales s where s.id = sale_id and (public.current_user_has_role('super_admin') or s.cashier_user_id = auth.uid() or s.company_id in (select public.current_user_company_ids()))));

create policy "sale_returns_select_scoped" on public.sale_returns
for select to authenticated
using (public.current_user_has_role('super_admin') or returned_by_user_id = auth.uid() or company_id in (select public.current_user_company_ids()));

create policy "sale_return_lines_select_scoped" on public.sale_return_lines
for select to authenticated
using (exists (select 1 from public.sale_returns sr where sr.id = sale_return_id and (public.current_user_has_role('super_admin') or sr.returned_by_user_id = auth.uid() or sr.company_id in (select public.current_user_company_ids()))));

create policy "cash_shift_movements_select_scoped" on public.cash_shift_movements
for select to authenticated
using (exists (select 1 from public.cash_shifts cs where cs.id = cash_shift_id and (public.current_user_has_role('super_admin') or cs.opened_by_user_id = auth.uid() or cs.company_id in (select public.current_user_company_ids()))));
