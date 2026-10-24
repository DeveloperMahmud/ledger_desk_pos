-- Phase 1 foundation: identity, workspace isolation, onboarding and audit.
-- Apply with Supabase CLI only after a real project is connected.

create extension if not exists "pgcrypto";

create type public.workspace_role as enum (
  'owner',
  'manager',
  'accountant',
  'staff',
  'viewer'
);

create type public.workspace_status as enum ('onboarding', 'active', 'suspended', 'archived');
create type public.accounting_mode as enum ('basic', 'full');

create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  display_name text,
  avatar_path text,
  locale text not null default 'en-BD',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.workspaces (
  id uuid primary key default gen_random_uuid(),
  name text not null check (char_length(trim(name)) between 2 and 120),
  slug text not null unique check (slug ~ '^[a-z0-9]+(?:-[a-z0-9]+)*$'),
  business_type text not null default 'agency',
  status public.workspace_status not null default 'onboarding',
  created_by uuid not null references auth.users(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.workspace_memberships (
  workspace_id uuid not null references public.workspaces(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  role public.workspace_role not null default 'staff',
  is_active boolean not null default true,
  invited_by uuid references auth.users(id),
  joined_at timestamptz not null default now(),
  primary key (workspace_id, user_id)
);

create table public.workspace_settings (
  workspace_id uuid primary key references public.workspaces(id) on delete cascade,
  onboarding_step integer not null default 1 check (onboarding_step between 1 and 4),
  onboarding_completed_at timestamptz,
  language_mode text not null default 'both' check (language_mode in ('english', 'bangla', 'both')),
  default_currency text not null default 'BDT',
  enabled_currencies text[] not null default array['BDT', 'USD'],
  accounting_mode public.accounting_mode not null default 'basic',
  invoice_template text not null default 'modern',
  brand_primary_color text not null default '#246BFD',
  brand_accent_color text not null default '#17263F',
  logo_path text,
  business_address text,
  phone text,
  website text,
  invoice_footer text,
  payment_instructions text,
  module_flags jsonb not null default '{"inventory":true,"invoicing":true,"freelancing":true,"pos":false,"manufacturing":false,"branches":false,"fullAccounting":false}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.platform_admins (
  user_id uuid primary key references auth.users(id) on delete cascade,
  created_at timestamptz not null default now()
);

create table public.audit_logs (
  id bigint generated always as identity primary key,
  workspace_id uuid not null references public.workspaces(id) on delete cascade,
  actor_id uuid references auth.users(id) on delete set null,
  action text not null,
  entity_type text not null,
  entity_id text,
  old_values jsonb,
  new_values jsonb,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create index workspace_memberships_user_idx on public.workspace_memberships(user_id) where is_active;
create index audit_logs_workspace_created_idx on public.audit_logs(workspace_id, created_at desc);

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger profiles_set_updated_at before update on public.profiles
for each row execute function public.set_updated_at();
create trigger workspaces_set_updated_at before update on public.workspaces
for each row execute function public.set_updated_at();
create trigger workspace_settings_set_updated_at before update on public.workspace_settings
for each row execute function public.set_updated_at();

create or replace function public.handle_new_auth_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, display_name)
  values (new.id, coalesce(new.raw_user_meta_data ->> 'display_name', split_part(new.email, '@', 1)))
  on conflict (id) do nothing;
  return new;
end;
$$;

create trigger on_auth_user_created
after insert on auth.users
for each row execute function public.handle_new_auth_user();

create or replace function public.is_platform_admin()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.platform_admins where user_id = auth.uid()
  );
$$;

create or replace function public.is_workspace_member(target_workspace_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.workspace_memberships
    where workspace_id = target_workspace_id
      and user_id = auth.uid()
      and is_active
  );
$$;

create or replace function public.has_workspace_role(
  target_workspace_id uuid,
  allowed_roles public.workspace_role[]
)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.workspace_memberships
    where workspace_id = target_workspace_id
      and user_id = auth.uid()
      and is_active
      and role = any(allowed_roles)
  );
$$;

create or replace function public.create_workspace_with_owner(
  workspace_name text,
  requested_slug text,
  requested_business_type text default 'agency'
)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  new_workspace_id uuid;
  clean_slug text;
begin
  if auth.uid() is null then
    raise exception 'Authentication required';
  end if;

  if char_length(trim(workspace_name)) < 2 then
    raise exception 'Business name is required';
  end if;

  clean_slug := lower(regexp_replace(trim(requested_slug), '[^a-zA-Z0-9]+', '-', 'g'));
  clean_slug := trim(both '-' from clean_slug);
  if clean_slug = '' then
    clean_slug := 'workspace-' || substr(gen_random_uuid()::text, 1, 8);
  end if;

  insert into public.workspaces (name, slug, business_type, created_by)
  values (trim(workspace_name), clean_slug, requested_business_type, auth.uid())
  returning id into new_workspace_id;

  insert into public.workspace_memberships (workspace_id, user_id, role)
  values (new_workspace_id, auth.uid(), 'owner');

  insert into public.workspace_settings (workspace_id)
  values (new_workspace_id);

  insert into public.audit_logs (workspace_id, actor_id, action, entity_type, entity_id, new_values)
  values (
    new_workspace_id,
    auth.uid(),
    'workspace.created',
    'workspace',
    new_workspace_id::text,
    jsonb_build_object('name', trim(workspace_name), 'business_type', requested_business_type)
  );

  return new_workspace_id;
end;
$$;

revoke all on function public.create_workspace_with_owner(text, text, text) from public;
grant execute on function public.create_workspace_with_owner(text, text, text) to authenticated;

alter table public.profiles enable row level security;
alter table public.workspaces enable row level security;
alter table public.workspace_memberships enable row level security;
alter table public.workspace_settings enable row level security;
alter table public.platform_admins enable row level security;
alter table public.audit_logs enable row level security;

create policy "profiles read own or shared workspace"
on public.profiles for select to authenticated
using (
  id = auth.uid()
  or exists (
    select 1
    from public.workspace_memberships mine
    join public.workspace_memberships theirs on theirs.workspace_id = mine.workspace_id
    where mine.user_id = auth.uid() and mine.is_active and theirs.user_id = profiles.id and theirs.is_active
  )
);

create policy "profiles update own"
on public.profiles for update to authenticated
using (id = auth.uid()) with check (id = auth.uid());

create policy "workspaces read by members"
on public.workspaces for select to authenticated
using (public.is_workspace_member(id) or public.is_platform_admin());

create policy "workspaces update by owners"
on public.workspaces for update to authenticated
using (public.has_workspace_role(id, array['owner']::public.workspace_role[]))
with check (public.has_workspace_role(id, array['owner']::public.workspace_role[]));

create policy "memberships read by workspace members"
on public.workspace_memberships for select to authenticated
using (public.is_workspace_member(workspace_id) or public.is_platform_admin());

create policy "memberships manage by owner or manager"
on public.workspace_memberships for all to authenticated
using (public.has_workspace_role(workspace_id, array['owner', 'manager']::public.workspace_role[]))
with check (public.has_workspace_role(workspace_id, array['owner', 'manager']::public.workspace_role[]));

create policy "settings read by workspace members"
on public.workspace_settings for select to authenticated
using (public.is_workspace_member(workspace_id) or public.is_platform_admin());

create policy "settings update by owner or manager"
on public.workspace_settings for update to authenticated
using (public.has_workspace_role(workspace_id, array['owner', 'manager']::public.workspace_role[]))
with check (public.has_workspace_role(workspace_id, array['owner', 'manager']::public.workspace_role[]));

create policy "platform admins read own status"
on public.platform_admins for select to authenticated
using (user_id = auth.uid());

create policy "audit logs read by privileged members"
on public.audit_logs for select to authenticated
using (
  public.has_workspace_role(workspace_id, array['owner', 'manager', 'accountant']::public.workspace_role[])
  or public.is_platform_admin()
);

-- Direct audit inserts are intentionally denied to client roles.
-- Business functions will write audit rows inside trusted transactions.
