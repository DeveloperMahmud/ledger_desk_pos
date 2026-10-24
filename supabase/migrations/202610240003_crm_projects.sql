-- Phase 3: CRM, proposals and project delivery.
-- Requires 202610240001_foundation.sql and 202610240002_inventory.sql.

create type public.lead_stage as enum ('new', 'contacted', 'qualified', 'proposal', 'won', 'lost');
create type public.proposal_status as enum ('draft', 'sent', 'accepted', 'rejected', 'expired');
create type public.project_status as enum ('planning', 'active', 'review', 'completed', 'on_hold', 'cancelled');
create type public.project_task_status as enum ('todo', 'in_progress', 'review', 'done');
create type public.deliverable_status as enum ('draft', 'submitted', 'approved');

create table public.crm_leads (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references public.workspaces(id) on delete cascade,
  name text not null check (char_length(trim(name)) between 2 and 120),
  company text,
  email text,
  phone text,
  service_interest text,
  source text,
  stage public.lead_stage not null default 'new',
  estimated_value numeric(14,2) not null default 0 check (estimated_value >= 0),
  next_follow_up_at timestamptz,
  notes text,
  converted_client_id uuid,
  created_by uuid not null references auth.users(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (workspace_id, id)
);

create table public.crm_clients (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references public.workspaces(id) on delete cascade,
  name text not null check (char_length(trim(name)) between 2 and 120),
  company text,
  email text,
  phone text,
  billing_address text,
  tax_id text,
  status text not null default 'active' check (status in ('active', 'inactive')),
  source_lead_id uuid references public.crm_leads(id) on delete set null,
  created_by uuid not null references auth.users(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (workspace_id, id)
);

alter table public.crm_leads
  add constraint crm_leads_converted_client_fk
  foreign key (converted_client_id) references public.crm_clients(id) on delete set null;

create table public.crm_contacts (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references public.workspaces(id) on delete cascade,
  client_id uuid not null references public.crm_clients(id) on delete cascade,
  name text not null,
  email text,
  phone text,
  role_title text,
  is_primary boolean not null default false,
  created_at timestamptz not null default now()
);

create table public.service_packages (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references public.workspaces(id) on delete cascade,
  name text not null,
  description text,
  price numeric(14,2) not null default 0 check (price >= 0),
  currency text not null default 'BDT',
  delivery_days integer check (delivery_days > 0),
  revision_limit integer check (revision_limit >= 0),
  deliverables jsonb not null default '[]'::jsonb,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (workspace_id, id)
);

create table public.proposals (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references public.workspaces(id) on delete cascade,
  proposal_number text not null,
  lead_id uuid references public.crm_leads(id) on delete set null,
  client_id uuid references public.crm_clients(id) on delete restrict,
  title text not null,
  scope text,
  status public.proposal_status not null default 'draft',
  currency text not null default 'BDT',
  discount numeric(14,2) not null default 0 check (discount >= 0),
  tax numeric(14,2) not null default 0 check (tax >= 0),
  valid_until date,
  sent_at timestamptz,
  accepted_at timestamptz,
  terms text,
  created_by uuid not null references auth.users(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (workspace_id, proposal_number),
  unique (workspace_id, id),
  check (lead_id is not null or client_id is not null)
);

create table public.proposal_items (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references public.workspaces(id) on delete cascade,
  proposal_id uuid not null references public.proposals(id) on delete cascade,
  package_id uuid references public.service_packages(id) on delete set null,
  description text not null,
  quantity numeric(12,2) not null default 1 check (quantity > 0),
  unit_price numeric(14,2) not null check (unit_price >= 0),
  sort_order integer not null default 0
);

create table public.projects (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references public.workspaces(id) on delete cascade,
  client_id uuid not null references public.crm_clients(id) on delete restrict,
  proposal_id uuid references public.proposals(id) on delete restrict,
  name text not null,
  description text,
  status public.project_status not null default 'planning',
  budget numeric(14,2) not null default 0 check (budget >= 0),
  currency text not null default 'BDT',
  start_date date,
  due_date date,
  completed_at timestamptz,
  created_by uuid not null references auth.users(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (workspace_id, proposal_id),
  unique (workspace_id, id)
);

create table public.project_milestones (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references public.workspaces(id) on delete cascade,
  project_id uuid not null references public.projects(id) on delete cascade,
  title text not null,
  due_date date,
  completed_at timestamptz,
  sort_order integer not null default 0,
  created_at timestamptz not null default now(),
  unique (workspace_id, id)
);

create table public.project_tasks (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references public.workspaces(id) on delete cascade,
  project_id uuid not null references public.projects(id) on delete cascade,
  milestone_id uuid references public.project_milestones(id) on delete set null,
  title text not null,
  description text,
  status public.project_task_status not null default 'todo',
  priority text not null default 'medium' check (priority in ('low', 'medium', 'high', 'urgent')),
  assignee_id uuid references auth.users(id) on delete set null,
  due_date date,
  sort_order integer not null default 0,
  created_by uuid not null references auth.users(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.project_deliverables (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references public.workspaces(id) on delete cascade,
  project_id uuid not null references public.projects(id) on delete cascade,
  name text not null,
  status public.deliverable_status not null default 'draft',
  version integer not null default 1 check (version > 0),
  storage_path text,
  external_url text,
  submitted_at timestamptz,
  approved_at timestamptz,
  created_by uuid not null references auth.users(id),
  created_at timestamptz not null default now(),
  unique (workspace_id, id),
  check (storage_path is not null or external_url is not null)
);

create table public.project_revisions (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references public.workspaces(id) on delete cascade,
  project_id uuid not null references public.projects(id) on delete cascade,
  deliverable_id uuid references public.project_deliverables(id) on delete set null,
  request_text text not null,
  status text not null default 'open' check (status in ('open', 'resolved')),
  requested_by text,
  resolved_at timestamptz,
  created_at timestamptz not null default now()
);

create table public.project_links (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references public.workspaces(id) on delete cascade,
  project_id uuid not null references public.projects(id) on delete cascade,
  label text not null,
  url text not null check (url ~ '^https?://'),
  created_at timestamptz not null default now()
);

-- Composite foreign keys prevent child records from linking across workspaces.
alter table public.crm_leads add constraint crm_leads_workspace_client_fk foreign key (workspace_id, converted_client_id) references public.crm_clients(workspace_id, id);
alter table public.crm_clients add constraint crm_clients_workspace_lead_fk foreign key (workspace_id, source_lead_id) references public.crm_leads(workspace_id, id);
alter table public.crm_contacts add constraint crm_contacts_workspace_client_fk foreign key (workspace_id, client_id) references public.crm_clients(workspace_id, id);
alter table public.proposals add constraint proposals_workspace_lead_fk foreign key (workspace_id, lead_id) references public.crm_leads(workspace_id, id);
alter table public.proposals add constraint proposals_workspace_client_fk foreign key (workspace_id, client_id) references public.crm_clients(workspace_id, id);
alter table public.proposal_items add constraint proposal_items_workspace_proposal_fk foreign key (workspace_id, proposal_id) references public.proposals(workspace_id, id);
alter table public.proposal_items add constraint proposal_items_workspace_package_fk foreign key (workspace_id, package_id) references public.service_packages(workspace_id, id);
alter table public.projects add constraint projects_workspace_client_fk foreign key (workspace_id, client_id) references public.crm_clients(workspace_id, id);
alter table public.projects add constraint projects_workspace_proposal_fk foreign key (workspace_id, proposal_id) references public.proposals(workspace_id, id);
alter table public.project_milestones add constraint milestones_workspace_project_fk foreign key (workspace_id, project_id) references public.projects(workspace_id, id);
alter table public.project_tasks add constraint tasks_workspace_project_fk foreign key (workspace_id, project_id) references public.projects(workspace_id, id);
alter table public.project_tasks add constraint tasks_workspace_milestone_fk foreign key (workspace_id, milestone_id) references public.project_milestones(workspace_id, id);
alter table public.project_deliverables add constraint deliverables_workspace_project_fk foreign key (workspace_id, project_id) references public.projects(workspace_id, id);
alter table public.project_revisions add constraint revisions_workspace_project_fk foreign key (workspace_id, project_id) references public.projects(workspace_id, id);
alter table public.project_revisions add constraint revisions_workspace_deliverable_fk foreign key (workspace_id, deliverable_id) references public.project_deliverables(workspace_id, id);
alter table public.project_links add constraint links_workspace_project_fk foreign key (workspace_id, project_id) references public.projects(workspace_id, id);

create index crm_leads_workspace_stage_idx on public.crm_leads(workspace_id, stage, updated_at desc);
create index crm_clients_workspace_status_idx on public.crm_clients(workspace_id, status, updated_at desc);
create index proposals_workspace_status_idx on public.proposals(workspace_id, status, updated_at desc);
create index projects_workspace_status_idx on public.projects(workspace_id, status, updated_at desc);
create index project_tasks_project_status_idx on public.project_tasks(project_id, status, sort_order);

create trigger crm_leads_set_updated_at before update on public.crm_leads for each row execute function public.set_updated_at();
create trigger crm_clients_set_updated_at before update on public.crm_clients for each row execute function public.set_updated_at();
create trigger service_packages_set_updated_at before update on public.service_packages for each row execute function public.set_updated_at();
create trigger proposals_set_updated_at before update on public.proposals for each row execute function public.set_updated_at();
create trigger projects_set_updated_at before update on public.projects for each row execute function public.set_updated_at();
create trigger project_tasks_set_updated_at before update on public.project_tasks for each row execute function public.set_updated_at();

create or replace function public.convert_proposal_to_project(target_proposal_id uuid, requested_due_date date default null)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  target public.proposals%rowtype;
  source_lead public.crm_leads%rowtype;
  resolved_client_id uuid;
  created_project_id uuid;
  proposal_total numeric(14,2);
begin
  select * into target from public.proposals where id = target_proposal_id for update;
  if not found then raise exception 'Proposal not found'; end if;
  if not public.has_workspace_role(target.workspace_id, array['owner', 'manager', 'staff']::public.workspace_role[]) then raise exception 'Not authorized'; end if;
  if target.status <> 'accepted' then raise exception 'Only accepted proposals can become projects'; end if;
  if exists (select 1 from public.projects where workspace_id = target.workspace_id and proposal_id = target.id) then raise exception 'Proposal already converted'; end if;

  resolved_client_id := target.client_id;
  if resolved_client_id is null then
    select * into source_lead from public.crm_leads where id = target.lead_id and workspace_id = target.workspace_id for update;
    if not found then raise exception 'Proposal lead not found'; end if;
    insert into public.crm_clients (workspace_id, name, company, email, phone, source_lead_id, created_by)
    values (target.workspace_id, source_lead.name, source_lead.company, source_lead.email, source_lead.phone, source_lead.id, auth.uid())
    returning id into resolved_client_id;
    update public.crm_leads set stage = 'won', converted_client_id = resolved_client_id where id = source_lead.id;
    update public.proposals set client_id = resolved_client_id where id = target.id;
  end if;

  select coalesce(sum(quantity * unit_price), 0) - target.discount + target.tax
  into proposal_total from public.proposal_items where proposal_id = target.id;

  insert into public.projects (workspace_id, client_id, proposal_id, name, description, budget, currency, start_date, due_date, created_by)
  values (target.workspace_id, resolved_client_id, target.id, target.title, target.scope, greatest(proposal_total, 0), target.currency, current_date, coalesce(requested_due_date, target.valid_until), auth.uid())
  returning id into created_project_id;

  insert into public.audit_logs (workspace_id, actor_id, action, entity_type, entity_id, new_values)
  values (target.workspace_id, auth.uid(), 'proposal.converted_to_project', 'project', created_project_id::text, jsonb_build_object('proposal_id', target.id, 'client_id', resolved_client_id));
  return created_project_id;
end;
$$;

revoke all on function public.convert_proposal_to_project(uuid, date) from public;
grant execute on function public.convert_proposal_to_project(uuid, date) to authenticated;

alter table public.crm_leads enable row level security;
alter table public.crm_clients enable row level security;
alter table public.crm_contacts enable row level security;
alter table public.service_packages enable row level security;
alter table public.proposals enable row level security;
alter table public.proposal_items enable row level security;
alter table public.projects enable row level security;
alter table public.project_milestones enable row level security;
alter table public.project_tasks enable row level security;
alter table public.project_deliverables enable row level security;
alter table public.project_revisions enable row level security;
alter table public.project_links enable row level security;

do $$
declare table_name text;
begin
  foreach table_name in array array['crm_leads','crm_clients','crm_contacts','service_packages','proposals','proposal_items','projects','project_milestones','project_tasks','project_deliverables','project_revisions','project_links']
  loop
    execute format('create policy %I on public.%I for select to authenticated using (public.is_workspace_member(workspace_id) or public.is_platform_admin())', table_name || '_read', table_name);
    execute format('create policy %I on public.%I for insert to authenticated with check (public.has_workspace_role(workspace_id, array[''owner'', ''manager'', ''staff'']::public.workspace_role[]))', table_name || '_insert', table_name);
    execute format('create policy %I on public.%I for update to authenticated using (public.has_workspace_role(workspace_id, array[''owner'', ''manager'', ''staff'']::public.workspace_role[])) with check (public.has_workspace_role(workspace_id, array[''owner'', ''manager'', ''staff'']::public.workspace_role[]))', table_name || '_update', table_name);
    execute format('create policy %I on public.%I for delete to authenticated using (public.has_workspace_role(workspace_id, array[''owner'', ''manager'']::public.workspace_role[]))', table_name || '_delete', table_name);
  end loop;
end $$;
