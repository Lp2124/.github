-- Phase 1: Supabase Auth SSR foundation, stores, roles, global settings and audit.
-- No POS, payments, cash register or invoicing objects are created in this migration.

create extension if not exists pgcrypto;

create type public.store_role as enum ('owner', 'admin', 'manager', 'staff', 'viewer');

create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  full_name text check (full_name is null or char_length(trim(full_name)) between 1 and 160),
  avatar_url text check (avatar_url is null or avatar_url ~* '^https://'),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.stores (
  id uuid primary key default gen_random_uuid(),
  name text not null check (char_length(trim(name)) between 2 and 140),
  slug text not null check (slug ~ '^[a-z0-9]+(?:-[a-z0-9]+)*$' and char_length(slug) between 2 and 80),
  timezone text not null default 'America/Mexico_City' check (char_length(timezone) between 3 and 80),
  currency char(3) not null default 'MXN' check (currency ~ '^[A-Z]{3}$'),
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (slug)
);

create table public.store_memberships (
  id uuid primary key default gen_random_uuid(),
  store_id uuid not null references public.stores(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  role public.store_role not null default 'viewer',
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (store_id, user_id)
);

create table public.store_settings (
  id uuid primary key default gen_random_uuid(),
  store_id uuid not null references public.stores(id) on delete cascade,
  setting_key text not null check (setting_key ~ '^[a-z0-9_.-]{2,80}$'),
  setting_value jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (store_id, setting_key)
);

create table public.audit_logs (
  id uuid primary key default gen_random_uuid(),
  store_id uuid not null references public.stores(id) on delete cascade,
  actor_id uuid references auth.users(id) on delete set null,
  action text not null check (action ~ '^[a-z0-9_.-]{2,120}$'),
  entity_type text not null check (entity_type ~ '^[a-z0-9_.-]{2,80}$'),
  entity_id uuid,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create index profiles_created_at_idx on public.profiles(created_at desc);
create index stores_active_idx on public.stores(is_active) where is_active = true;
create index store_memberships_user_active_idx on public.store_memberships(user_id, is_active, store_id);
create index store_memberships_store_role_idx on public.store_memberships(store_id, role) where is_active = true;
create index store_settings_store_idx on public.store_settings(store_id, setting_key);
create index audit_logs_store_created_idx on public.audit_logs(store_id, created_at desc);
create index audit_logs_actor_idx on public.audit_logs(actor_id, created_at desc);

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger profiles_set_updated_at before update on public.profiles for each row execute function public.set_updated_at();
create trigger stores_set_updated_at before update on public.stores for each row execute function public.set_updated_at();
create trigger store_memberships_set_updated_at before update on public.store_memberships for each row execute function public.set_updated_at();
create trigger store_settings_set_updated_at before update on public.store_settings for each row execute function public.set_updated_at();

create or replace function public.is_store_member(target_store_id uuid, allowed_roles public.store_role[] default null)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.store_memberships sm
    where sm.store_id = target_store_id
      and sm.user_id = auth.uid()
      and sm.is_active = true
      and (allowed_roles is null or sm.role = any(allowed_roles))
  );
$$;

create or replace function public.handle_new_user_profile()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, full_name, avatar_url)
  values (
    new.id,
    nullif(trim(coalesce(new.raw_user_meta_data ->> 'full_name', '')), ''),
    nullif(trim(coalesce(new.raw_user_meta_data ->> 'avatar_url', '')), '')
  )
  on conflict (id) do nothing;
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user_profile();

alter table public.profiles enable row level security;
alter table public.stores enable row level security;
alter table public.store_memberships enable row level security;
alter table public.store_settings enable row level security;
alter table public.audit_logs enable row level security;

create policy profiles_select_self on public.profiles for select to authenticated using (id = auth.uid());
create policy profiles_update_self on public.profiles for update to authenticated using (id = auth.uid()) with check (id = auth.uid());

create policy stores_select_member on public.stores for select to authenticated using (public.is_store_member(id));
create policy stores_update_admin on public.stores for update to authenticated using (public.is_store_member(id, array['owner','admin']::public.store_role[])) with check (public.is_store_member(id, array['owner','admin']::public.store_role[]));

create policy memberships_select_store_member on public.store_memberships for select to authenticated using (public.is_store_member(store_id));
create policy memberships_insert_owner_admin on public.store_memberships for insert to authenticated with check (public.is_store_member(store_id, array['owner','admin']::public.store_role[]));
create policy memberships_update_owner_admin on public.store_memberships for update to authenticated using (public.is_store_member(store_id, array['owner','admin']::public.store_role[])) with check (public.is_store_member(store_id, array['owner','admin']::public.store_role[]));

create policy settings_select_store_member on public.store_settings for select to authenticated using (public.is_store_member(store_id));
create policy settings_write_manager on public.store_settings for all to authenticated using (public.is_store_member(store_id, array['owner','admin','manager']::public.store_role[])) with check (public.is_store_member(store_id, array['owner','admin','manager']::public.store_role[]));

create policy audit_select_manager on public.audit_logs for select to authenticated using (public.is_store_member(store_id, array['owner','admin','manager']::public.store_role[]));
create policy audit_insert_store_member on public.audit_logs for insert to authenticated with check (public.is_store_member(store_id) and actor_id = auth.uid());

grant usage on schema public to authenticated;
grant select, update on public.profiles to authenticated;
grant select, update on public.stores to authenticated;
grant select, insert, update on public.store_memberships to authenticated;
grant select, insert, update, delete on public.store_settings to authenticated;
grant select, insert on public.audit_logs to authenticated;
grant execute on function public.is_store_member(uuid, public.store_role[]) to authenticated;
