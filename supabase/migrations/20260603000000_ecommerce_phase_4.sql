set check_function_bodies = off;

do $$
begin
  if not exists (select 1 from pg_type where typname = 'ecommerce_order_status') then
    create type public.ecommerce_order_status as enum ('pending_payment', 'paid', 'preparing', 'ready_for_pickup', 'shipped', 'delivered', 'cancelled');
  end if;
  if not exists (select 1 from pg_type where typname = 'payment_preference_status') then
    create type public.payment_preference_status as enum ('created', 'failed', 'paid', 'expired');
  end if;
end $$;

create table public.customer_profiles (
  id uuid primary key default extensions.gen_random_uuid(),
  user_id uuid not null unique references auth.users(id) on delete cascade,
  full_name text not null check (char_length(trim(full_name)) between 1 and 180),
  phone text check (phone is null or phone ~ '^[0-9 +().-]{7,32}$'),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.customer_addresses (
  id uuid primary key default extensions.gen_random_uuid(),
  customer_profile_id uuid not null references public.customer_profiles(id) on delete cascade,
  label text not null check (char_length(trim(label)) between 1 and 80),
  street text not null check (char_length(trim(street)) between 1 and 180),
  exterior_number text not null check (char_length(trim(exterior_number)) between 1 and 40),
  interior_number text check (interior_number is null or char_length(trim(interior_number)) <= 40),
  neighborhood text not null check (char_length(trim(neighborhood)) between 1 and 140),
  city text not null check (char_length(trim(city)) between 1 and 140),
  state text not null check (char_length(trim(state)) between 1 and 140),
  postal_code text not null check (postal_code ~ '^[0-9]{5}$'),
  is_default boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.customer_favorites (
  customer_profile_id uuid not null references public.customer_profiles(id) on delete cascade,
  product_id uuid not null references public.products(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (customer_profile_id, product_id)
);

create table public.ecommerce_orders (
  id uuid primary key default extensions.gen_random_uuid(),
  company_id uuid not null references public.companies(id) on delete restrict,
  customer_profile_id uuid not null references public.customer_profiles(id) on delete restrict,
  status public.ecommerce_order_status not null default 'pending_payment',
  subtotal numeric(18, 6) not null check (subtotal >= 0),
  tax_total numeric(18, 6) not null check (tax_total >= 0),
  total numeric(18, 6) not null check (total >= 0),
  delivery_method text not null default 'pickup' check (delivery_method in ('pickup')),
  mercado_pago_preference_id text,
  mercado_pago_init_point text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.ecommerce_order_lines (
  id uuid primary key default extensions.gen_random_uuid(),
  order_id uuid not null references public.ecommerce_orders(id) on delete cascade,
  product_id uuid not null references public.products(id) on delete restrict,
  sku text not null,
  product_name text not null,
  quantity numeric(18, 6) not null check (quantity > 0),
  unit_price numeric(18, 6) not null check (unit_price >= 0),
  tax_amount numeric(18, 6) not null check (tax_amount >= 0),
  line_total numeric(18, 6) not null check (line_total >= 0),
  created_at timestamptz not null default now()
);

create table public.ecommerce_stock_reservations (
  id uuid primary key default extensions.gen_random_uuid(),
  order_id uuid not null references public.ecommerce_orders(id) on delete cascade,
  product_id uuid not null references public.products(id) on delete restrict,
  warehouse_id uuid not null references public.warehouses(id) on delete restrict,
  quantity numeric(18, 6) not null check (quantity > 0),
  expires_at timestamptz not null default now() + interval '30 minutes',
  released_at timestamptz,
  created_at timestamptz not null default now()
);

create table public.ecommerce_payment_preferences (
  id uuid primary key default extensions.gen_random_uuid(),
  order_id uuid not null references public.ecommerce_orders(id) on delete cascade,
  provider text not null check (provider = 'mercado_pago'),
  provider_preference_id text,
  init_point text,
  status public.payment_preference_status not null default 'created',
  error_message text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index customer_addresses_profile_idx on public.customer_addresses(customer_profile_id);
create index customer_favorites_product_idx on public.customer_favorites(product_id);
create index ecommerce_orders_customer_created_idx on public.ecommerce_orders(customer_profile_id, created_at desc);
create index ecommerce_order_lines_order_idx on public.ecommerce_order_lines(order_id);
create index ecommerce_reservations_product_active_idx on public.ecommerce_stock_reservations(product_id, warehouse_id) where released_at is null;

create trigger customer_profiles_set_updated_at before update on public.customer_profiles for each row execute function public.set_updated_at();
create trigger customer_addresses_set_updated_at before update on public.customer_addresses for each row execute function public.set_updated_at();
create trigger ecommerce_orders_set_updated_at before update on public.ecommerce_orders for each row execute function public.set_updated_at();
create trigger ecommerce_payment_preferences_set_updated_at before update on public.ecommerce_payment_preferences for each row execute function public.set_updated_at();

create or replace function public.create_ecommerce_order(
  p_full_name text,
  p_phone text,
  p_items jsonb
)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  customer_id uuid;
  order_id uuid;
  item jsonb;
  product_record public.products%rowtype;
  balance_record public.inventory_balances%rowtype;
  item_quantity numeric;
  subtotal numeric := 0;
  tax_total numeric := 0;
  order_total numeric := 0;
  tax_rate numeric := 0.16;
  order_company_id uuid;
begin
  if auth.uid() is null then raise exception 'authentication required'; end if;
  if char_length(trim(p_full_name)) < 1 then raise exception 'customer name is required'; end if;
  if jsonb_typeof(p_items) <> 'array' or jsonb_array_length(p_items) = 0 then raise exception 'order items are required'; end if;

  insert into public.customer_profiles (user_id, full_name, phone)
  values (auth.uid(), trim(p_full_name), nullif(trim(coalesce(p_phone, '')), ''))
  on conflict (user_id) do update set full_name = excluded.full_name, phone = excluded.phone, updated_at = now()
  returning id into customer_id;

  for item in select * from jsonb_array_elements(p_items) loop
    item_quantity := (item ->> 'quantity')::numeric;
    if item_quantity <= 0 then raise exception 'invalid item quantity'; end if;
    select * into product_record from public.products where id = (item ->> 'product_id')::uuid and is_active = true;
    if product_record.id is null then raise exception 'product not found'; end if;
    if order_company_id is null then
      order_company_id := product_record.company_id;
    elsif order_company_id <> product_record.company_id then
      raise exception 'all products must belong to the same company';
    end if;
    select ib.* into balance_record
    from public.inventory_balances ib
    where ib.product_id = product_record.id
      and ib.quantity - ib.reserved_quantity >= item_quantity
    order by ib.quantity desc
    limit 1
    for update;
    if balance_record.id is null then raise exception 'insufficient stock for product %', product_record.sku; end if;
    subtotal := subtotal + (product_record.sale_price * item_quantity);
  end loop;

  tax_total := round(subtotal * tax_rate, 6);
  order_total := subtotal + tax_total;

  insert into public.ecommerce_orders (company_id, customer_profile_id, subtotal, tax_total, total)
  values (order_company_id, customer_id, subtotal, tax_total, order_total)
  returning id into order_id;

  for item in select * from jsonb_array_elements(p_items) loop
    item_quantity := (item ->> 'quantity')::numeric;
    select * into product_record from public.products where id = (item ->> 'product_id')::uuid and is_active = true;
    select ib.* into balance_record
    from public.inventory_balances ib
    where ib.product_id = product_record.id
      and ib.quantity - ib.reserved_quantity >= item_quantity
    order by ib.quantity desc
    limit 1
    for update;

    update public.inventory_balances
    set reserved_quantity = reserved_quantity + item_quantity,
        updated_at = now()
    where id = balance_record.id;

    insert into public.ecommerce_stock_reservations (order_id, product_id, warehouse_id, quantity)
    values (order_id, product_record.id, balance_record.warehouse_id, item_quantity);

    insert into public.ecommerce_order_lines (order_id, product_id, sku, product_name, quantity, unit_price, tax_amount, line_total)
    values (order_id, product_record.id, product_record.sku, product_record.name, item_quantity, product_record.sale_price, round(product_record.sale_price * item_quantity * tax_rate, 6), product_record.sale_price * item_quantity);
  end loop;

  insert into public.audit_log (actor_user_id, action, entity_table, entity_id, metadata)
  values (auth.uid(), 'ecommerce.order_created', 'ecommerce_orders', order_id, jsonb_build_object('total', order_total));

  return order_id;
end;
$$;

revoke all on function public.create_ecommerce_order(text, text, jsonb) from public;
grant execute on function public.create_ecommerce_order(text, text, jsonb) to authenticated;

alter table public.customer_profiles enable row level security;
alter table public.customer_addresses enable row level security;
alter table public.customer_favorites enable row level security;
alter table public.ecommerce_orders enable row level security;
alter table public.ecommerce_order_lines enable row level security;
alter table public.ecommerce_stock_reservations enable row level security;
alter table public.ecommerce_payment_preferences enable row level security;

create policy "public_categories_read" on public.categories for select to anon using (true);
create policy "public_brands_read" on public.brands for select to anon using (true);
create policy "public_products_read" on public.products for select to anon using (is_active = true);
create policy "public_barcodes_read" on public.product_barcodes for select to anon using (true);
create policy "public_images_read" on public.product_images for select to anon using (true);
create policy "public_inventory_balances_read" on public.inventory_balances for select to anon using (exists (select 1 from public.products p where p.id = product_id and p.is_active = true));

create policy "customer_profiles_own" on public.customer_profiles for all to authenticated using (user_id = auth.uid()) with check (user_id = auth.uid());
create policy "customer_addresses_own" on public.customer_addresses for all to authenticated using (exists (select 1 from public.customer_profiles cp where cp.id = customer_profile_id and cp.user_id = auth.uid())) with check (exists (select 1 from public.customer_profiles cp where cp.id = customer_profile_id and cp.user_id = auth.uid()));
create policy "customer_favorites_own" on public.customer_favorites for all to authenticated using (exists (select 1 from public.customer_profiles cp where cp.id = customer_profile_id and cp.user_id = auth.uid())) with check (exists (select 1 from public.customer_profiles cp where cp.id = customer_profile_id and cp.user_id = auth.uid()));
create policy "ecommerce_orders_own" on public.ecommerce_orders for all to authenticated using (exists (select 1 from public.customer_profiles cp where cp.id = customer_profile_id and cp.user_id = auth.uid())) with check (exists (select 1 from public.customer_profiles cp where cp.id = customer_profile_id and cp.user_id = auth.uid()));
create policy "ecommerce_order_lines_own" on public.ecommerce_order_lines for select to authenticated using (exists (select 1 from public.ecommerce_orders eo join public.customer_profiles cp on cp.id = eo.customer_profile_id where eo.id = order_id and cp.user_id = auth.uid()));
create policy "ecommerce_reservations_own" on public.ecommerce_stock_reservations for select to authenticated using (exists (select 1 from public.ecommerce_orders eo join public.customer_profiles cp on cp.id = eo.customer_profile_id where eo.id = order_id and cp.user_id = auth.uid()));
create policy "ecommerce_payment_preferences_own" on public.ecommerce_payment_preferences for all to authenticated using (exists (select 1 from public.ecommerce_orders eo join public.customer_profiles cp on cp.id = eo.customer_profile_id where eo.id = order_id and cp.user_id = auth.uid())) with check (exists (select 1 from public.ecommerce_orders eo join public.customer_profiles cp on cp.id = eo.customer_profile_id where eo.id = order_id and cp.user_id = auth.uid()));
