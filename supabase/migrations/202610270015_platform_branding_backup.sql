-- Global product appearance and auditable backup/import operations.

-- Suspended/archived workspaces are blocked centrally without rewriting member states.
create or replace function public.is_workspace_member(target_workspace_id uuid)
returns boolean language sql stable security definer set search_path=public as $$
  select exists(select 1 from public.workspace_memberships m join public.workspaces w on w.id=m.workspace_id where m.workspace_id=target_workspace_id and m.user_id=auth.uid() and m.is_active and w.status in ('onboarding','active'));
$$;
create or replace function public.has_workspace_role(target_workspace_id uuid,allowed_roles public.workspace_role[])
returns boolean language sql stable security definer set search_path=public as $$
  select exists(select 1 from public.workspace_memberships m join public.workspaces w on w.id=m.workspace_id where m.workspace_id=target_workspace_id and m.user_id=auth.uid() and m.is_active and m.role=any(allowed_roles) and w.status in ('onboarding','active'));
$$;

create table public.platform_settings (
  singleton boolean primary key default true check(singleton), app_name text not null default 'LedgerDesk', app_tagline text not null default 'Business OS', logo_url text, favicon_url text,
  primary_color text not null default '#246BFD', accent_color text not null default '#17263F', canvas_color text not null default '#F5F7FA', updated_by uuid references auth.users(id), updated_at timestamptz not null default now()
);
insert into public.platform_settings(singleton) values(true) on conflict do nothing;
alter table public.platform_settings enable row level security;
create policy platform_settings_public_read on public.platform_settings for select to anon,authenticated using(true);
create policy platform_settings_admin_write on public.platform_settings for all to authenticated using(public.is_platform_admin()) with check(public.is_platform_admin());

create table public.workspace_backup_runs (
  id uuid primary key default gen_random_uuid(), workspace_id uuid not null references public.workspaces(id) on delete cascade,
  operation text not null check(operation in ('export','restore')), format_version integer not null default 1, status text not null check(status in ('started','completed','failed')),
  manifest jsonb not null default '{}'::jsonb, error_message text, created_by uuid not null references auth.users(id), created_at timestamptz not null default now(), completed_at timestamptz
);
alter table public.workspace_backup_runs enable row level security;
create policy workspace_backup_runs_read on public.workspace_backup_runs for select to authenticated using(public.has_workspace_role(workspace_id,array['owner','manager']::public.workspace_role[]) or public.is_platform_admin());
create policy workspace_backup_runs_write on public.workspace_backup_runs for insert to authenticated with check(public.has_workspace_role(workspace_id,array['owner']::public.workspace_role[]) or public.is_platform_admin());

create or replace function public.get_platform_branding() returns jsonb language sql stable security definer set search_path=public as $$
 select jsonb_build_object('appName',app_name,'tagline',app_tagline,'logoUrl',logo_url,'faviconUrl',favicon_url,'primaryColor',primary_color,'accentColor',accent_color,'canvasColor',canvas_color) from public.platform_settings where singleton=true;
$$;
grant execute on function public.get_platform_branding() to anon,authenticated;
