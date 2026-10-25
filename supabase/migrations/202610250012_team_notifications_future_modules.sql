-- Phase 9: team administration, notifications and future business module foundations.

create type public.invitation_status as enum ('pending','accepted','revoked','expired');
create table public.workspace_invitations (
  id uuid primary key default gen_random_uuid(), workspace_id uuid not null references public.workspaces(id) on delete cascade,
  email text not null, role public.workspace_role not null default 'staff', token_hash text not null unique,
  status public.invitation_status not null default 'pending', expires_at timestamptz not null default now()+interval '7 days',
  invited_by uuid not null references auth.users(id), accepted_by uuid references auth.users(id), accepted_at timestamptz, created_at timestamptz not null default now()
);
create unique index workspace_pending_invite_idx on public.workspace_invitations(workspace_id,lower(email)) where status='pending';

create table public.notifications (
  id uuid primary key default gen_random_uuid(), workspace_id uuid not null references public.workspaces(id) on delete cascade,
  user_id uuid references auth.users(id) on delete cascade, title text not null, message text not null, kind text not null default 'info',
  action_url text, read_at timestamptz, created_at timestamptz not null default now()
);
create index notifications_inbox_idx on public.notifications(workspace_id,user_id,created_at desc);

create table public.branches (
  id uuid primary key default gen_random_uuid(), workspace_id uuid not null references public.workspaces(id) on delete cascade,
  code text not null, name text not null, address text, is_active boolean not null default true, created_at timestamptz not null default now(), unique(workspace_id,code), unique(workspace_id,id)
);
create table public.inventory_locations (
  id uuid primary key default gen_random_uuid(), workspace_id uuid not null references public.workspaces(id) on delete cascade,
  branch_id uuid references public.branches(id) on delete cascade, code text not null, name text not null,
  location_type text not null default 'store' check(location_type in ('store','warehouse','factory','virtual')),
  is_active boolean not null default true, created_at timestamptz not null default now(), unique(workspace_id,code), unique(workspace_id,id)
);
create table public.suppliers (
  id uuid primary key default gen_random_uuid(), workspace_id uuid not null references public.workspaces(id) on delete cascade,
  name text not null, contact_name text, email text, phone text, address text, status text not null default 'active' check(status in ('active','inactive')),
  created_at timestamptz not null default now(), updated_at timestamptz not null default now(), unique(workspace_id,id)
);
create table public.purchase_orders (
  id uuid primary key default gen_random_uuid(), workspace_id uuid not null references public.workspaces(id) on delete cascade,
  supplier_id uuid not null references public.suppliers(id) on delete restrict, branch_id uuid references public.branches(id) on delete restrict,
  order_number text not null, status text not null default 'draft' check(status in ('draft','ordered','partially_received','received','cancelled')),
  ordered_on date, expected_on date, subtotal numeric(14,2) not null default 0, tax_total numeric(14,2) not null default 0, grand_total numeric(14,2) not null default 0,
  notes text, created_by uuid not null references auth.users(id), created_at timestamptz not null default now(), updated_at timestamptz not null default now(), unique(workspace_id,order_number), unique(workspace_id,id)
);
create table public.purchase_order_items (
  id uuid primary key default gen_random_uuid(), workspace_id uuid not null references public.workspaces(id) on delete cascade,
  purchase_order_id uuid not null references public.purchase_orders(id) on delete cascade, inventory_item_id uuid references public.catalog_items(id) on delete restrict,
  description text not null, quantity numeric(14,3) not null check(quantity>0), received_quantity numeric(14,3) not null default 0 check(received_quantity>=0), unit_cost numeric(14,2) not null check(unit_cost>=0), line_total numeric(14,2) generated always as (quantity*unit_cost) stored
);
create table public.stock_transfers (
  id uuid primary key default gen_random_uuid(), workspace_id uuid not null references public.workspaces(id) on delete cascade,
  from_location_id uuid not null references public.inventory_locations(id), to_location_id uuid not null references public.inventory_locations(id),
  status text not null default 'draft' check(status in ('draft','in_transit','completed','cancelled')), reference text, notes text,
  created_by uuid not null references auth.users(id), created_at timestamptz not null default now(), completed_at timestamptz, check(from_location_id<>to_location_id), unique(workspace_id,id)
);
create table public.stock_transfer_items (
  id uuid primary key default gen_random_uuid(), workspace_id uuid not null references public.workspaces(id) on delete cascade,
  transfer_id uuid not null references public.stock_transfers(id) on delete cascade, inventory_item_id uuid not null references public.catalog_items(id), quantity numeric(14,3) not null check(quantity>0)
);
create table public.bills_of_materials (
  id uuid primary key default gen_random_uuid(), workspace_id uuid not null references public.workspaces(id) on delete cascade,
  output_item_id uuid not null references public.catalog_items(id), name text not null, output_quantity numeric(14,3) not null default 1 check(output_quantity>0), version integer not null default 1, is_active boolean not null default true, created_at timestamptz not null default now(), unique(workspace_id,output_item_id,version), unique(workspace_id,id)
);
create table public.bill_of_material_items (
  id uuid primary key default gen_random_uuid(), workspace_id uuid not null references public.workspaces(id) on delete cascade,
  bill_of_material_id uuid not null references public.bills_of_materials(id) on delete cascade, input_item_id uuid not null references public.catalog_items(id), quantity numeric(14,3) not null check(quantity>0)
);
create table public.production_orders (
  id uuid primary key default gen_random_uuid(), workspace_id uuid not null references public.workspaces(id) on delete cascade,
  bill_of_material_id uuid not null references public.bills_of_materials(id), location_id uuid not null references public.inventory_locations(id),
  order_number text not null, planned_quantity numeric(14,3) not null check(planned_quantity>0), completed_quantity numeric(14,3) not null default 0,
  status text not null default 'planned' check(status in ('planned','in_progress','completed','cancelled')), planned_on date, completed_at timestamptz,
  created_by uuid not null references auth.users(id), created_at timestamptz not null default now(), unique(workspace_id,order_number), unique(workspace_id,id)
);
create table public.recurring_invoice_profiles (
  id uuid primary key default gen_random_uuid(), workspace_id uuid not null references public.workspaces(id) on delete cascade,
  client_id uuid not null references public.crm_clients(id), title text not null, frequency text not null check(frequency in ('weekly','monthly','quarterly','yearly')),
  next_run_on date not null, currency text not null default 'BDT', template_id uuid references public.invoice_templates(id), items jsonb not null default '[]', active boolean not null default true,
  created_by uuid not null references auth.users(id), created_at timestamptz not null default now(), updated_at timestamptz not null default now()
);

create trigger suppliers_set_updated_at before update on public.suppliers for each row execute function public.set_updated_at();
create trigger purchase_orders_set_updated_at before update on public.purchase_orders for each row execute function public.set_updated_at();
create trigger recurring_profiles_set_updated_at before update on public.recurring_invoice_profiles for each row execute function public.set_updated_at();

create or replace function public.create_workspace_invitation(target_workspace_id uuid,target_email text,target_role public.workspace_role)
returns text language plpgsql security definer set search_path=public as $$
declare raw_token text:=encode(gen_random_bytes(24),'hex');
begin
 if not public.has_workspace_role(target_workspace_id,array['owner','manager']::public.workspace_role[]) then raise exception 'Not authorized'; end if;
 if target_role='owner' and not public.has_workspace_role(target_workspace_id,array['owner']::public.workspace_role[]) then raise exception 'Only an owner can invite another owner'; end if;
 insert into public.workspace_invitations(workspace_id,email,role,token_hash,invited_by) values(target_workspace_id,lower(trim(target_email)),target_role,encode(digest(raw_token,'sha256'),'hex'),auth.uid());
 insert into public.audit_logs(workspace_id,actor_id,action,entity_type,new_values) values(target_workspace_id,auth.uid(),'member.invited','workspace_invitation',jsonb_build_object('email',lower(trim(target_email)),'role',target_role));
 return raw_token;
end; $$;
create or replace function public.accept_workspace_invitation(raw_token text)
returns uuid language plpgsql security definer set search_path=public as $$
declare invite public.workspace_invitations%rowtype; auth_email text;
begin
 if auth.uid() is null then raise exception 'Authentication required'; end if;
 select email into auth_email from auth.users where id=auth.uid();
 select * into invite from public.workspace_invitations where token_hash=encode(digest(raw_token,'sha256'),'hex') and status='pending' and expires_at>now() for update;
 if not found or lower(auth_email)<>lower(invite.email) then raise exception 'Invitation is invalid or expired'; end if;
 insert into public.workspace_memberships(workspace_id,user_id,role,invited_by) values(invite.workspace_id,auth.uid(),invite.role,invite.invited_by) on conflict(workspace_id,user_id) do update set role=excluded.role,is_active=true;
 update public.workspace_invitations set status='accepted',accepted_by=auth.uid(),accepted_at=now() where id=invite.id;
 return invite.workspace_id;
end; $$;
create or replace function public.mark_notification_read(target_notification_id uuid)
returns void language sql security definer set search_path=public as $$ update public.notifications set read_at=now() where id=target_notification_id and (user_id is null or user_id=auth.uid()) and public.is_workspace_member(workspace_id); $$;

create or replace function public.set_workspace_member_access(target_workspace_id uuid,target_user_id uuid,target_role public.workspace_role,target_active boolean)
returns void language plpgsql security definer set search_path=public as $$
declare actor_role public.workspace_role; existing_role public.workspace_role;
begin
 select role into actor_role from public.workspace_memberships where workspace_id=target_workspace_id and user_id=auth.uid() and is_active;
 select role into existing_role from public.workspace_memberships where workspace_id=target_workspace_id and user_id=target_user_id;
 if actor_role is null or existing_role is null then raise exception 'Membership not found'; end if;
 if actor_role<>'owner' and not (actor_role='manager' and existing_role not in ('owner','manager') and target_role not in ('owner','manager')) then raise exception 'Not authorized'; end if;
 if target_user_id=auth.uid() and not target_active then raise exception 'You cannot deactivate yourself'; end if;
 update public.workspace_memberships set role=target_role,is_active=target_active where workspace_id=target_workspace_id and user_id=target_user_id;
 insert into public.audit_logs(workspace_id,actor_id,action,entity_type,entity_id,new_values) values(target_workspace_id,auth.uid(),'member.access_changed','workspace_membership',target_user_id::text,jsonb_build_object('role',target_role,'active',target_active));
end; $$;

revoke all on function public.create_workspace_invitation(uuid,text,public.workspace_role) from public; grant execute on function public.create_workspace_invitation(uuid,text,public.workspace_role) to authenticated;
revoke all on function public.accept_workspace_invitation(text) from public; grant execute on function public.accept_workspace_invitation(text) to authenticated;
revoke all on function public.mark_notification_read(uuid) from public; grant execute on function public.mark_notification_read(uuid) to authenticated;
revoke all on function public.set_workspace_member_access(uuid,uuid,public.workspace_role,boolean) from public; grant execute on function public.set_workspace_member_access(uuid,uuid,public.workspace_role,boolean) to authenticated;

drop policy if exists "memberships manage by owner or manager" on public.workspace_memberships;
create policy "memberships manage by owners" on public.workspace_memberships for all to authenticated using(public.has_workspace_role(workspace_id,array['owner']::public.workspace_role[])) with check(public.has_workspace_role(workspace_id,array['owner']::public.workspace_role[]));

do $$ declare table_name text; begin foreach table_name in array array['workspace_invitations','notifications','branches','inventory_locations','suppliers','purchase_orders','purchase_order_items','stock_transfers','stock_transfer_items','bills_of_materials','bill_of_material_items','production_orders','recurring_invoice_profiles'] loop execute format('alter table public.%I enable row level security',table_name); execute format('create policy %I on public.%I for select to authenticated using(public.is_workspace_member(workspace_id) or public.is_platform_admin())',table_name||'_read',table_name); end loop; end $$;
create policy invitations_manage on public.workspace_invitations for update to authenticated using(public.has_workspace_role(workspace_id,array['owner','manager']::public.workspace_role[])) with check(public.has_workspace_role(workspace_id,array['owner','manager']::public.workspace_role[]));
create policy notifications_update on public.notifications for update to authenticated using(public.is_workspace_member(workspace_id) and (user_id is null or user_id=auth.uid())) with check(public.is_workspace_member(workspace_id) and (user_id is null or user_id=auth.uid()));
do $$ declare table_name text; begin foreach table_name in array array['branches','inventory_locations','suppliers','purchase_orders','purchase_order_items','stock_transfers','stock_transfer_items','bills_of_materials','bill_of_material_items','production_orders','recurring_invoice_profiles'] loop execute format('create policy %I on public.%I for all to authenticated using(public.has_workspace_role(workspace_id,array[''owner'',''manager'',''accountant'',''staff'']::public.workspace_role[])) with check(public.has_workspace_role(workspace_id,array[''owner'',''manager'',''accountant'',''staff'']::public.workspace_role[]))',table_name||'_manage',table_name); end loop; end $$;
