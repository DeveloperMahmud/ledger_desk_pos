-- Phase 4: professional invoices, stock reconciliation, public links and payments.

create type public.invoice_status as enum ('draft', 'issued', 'partially_paid', 'paid', 'overdue', 'cancelled');
create type public.payment_method as enum ('cash', 'bank', 'online_bank', 'mobile_banking', 'other');

create table public.invoice_sequences (
  workspace_id uuid primary key references public.workspaces(id) on delete cascade,
  prefix text not null default 'INV',
  next_number bigint not null default 1 check (next_number > 0),
  reset_yearly boolean not null default true,
  sequence_year integer not null default extract(year from current_date)::integer,
  updated_at timestamptz not null default now()
);

create table public.invoice_templates (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references public.workspaces(id) on delete cascade,
  name text not null,
  style_key text not null check (style_key in ('modern', 'classic', 'minimal')),
  settings jsonb not null default '{}'::jsonb,
  is_default boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (workspace_id, id)
);

create table public.invoices (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references public.workspaces(id) on delete cascade,
  invoice_number text not null,
  client_id uuid not null references public.crm_clients(id) on delete restrict,
  project_id uuid references public.projects(id) on delete set null,
  template_id uuid references public.invoice_templates(id) on delete set null,
  title text not null,
  status public.invoice_status not null default 'draft',
  currency text not null default 'BDT',
  issue_date date,
  due_date date,
  notes text,
  terms text,
  subtotal numeric(14,2) not null default 0,
  discount_total numeric(14,2) not null default 0,
  tax_total numeric(14,2) not null default 0,
  grand_total numeric(14,2) not null default 0,
  paid_total numeric(14,2) not null default 0,
  issued_at timestamptz,
  cancelled_at timestamptz,
  created_by uuid not null references auth.users(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (workspace_id, invoice_number),
  unique (workspace_id, id),
  check (grand_total >= 0 and paid_total >= 0 and paid_total <= grand_total)
);

create table public.invoice_items (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references public.workspaces(id) on delete cascade,
  invoice_id uuid not null references public.invoices(id) on delete cascade,
  catalog_item_id uuid references public.catalog_items(id) on delete restrict,
  kind public.catalog_kind not null,
  description text not null,
  quantity numeric(12,2) not null check (quantity > 0),
  unit text not null,
  unit_price numeric(14,2) not null check (unit_price >= 0),
  discount numeric(14,2) not null default 0 check (discount >= 0),
  tax_rate numeric(7,4) not null default 0 check (tax_rate >= 0),
  line_total numeric(14,2) generated always as (greatest(quantity * unit_price - discount, 0) * (1 + tax_rate / 100)) stored,
  sort_order integer not null default 0,
  created_at timestamptz not null default now(),
  check ((kind = 'service') or (catalog_item_id is not null))
);

create table public.invoice_payments (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references public.workspaces(id) on delete cascade,
  invoice_id uuid not null references public.invoices(id) on delete restrict,
  amount numeric(14,2) not null check (amount > 0),
  method public.payment_method not null,
  account_label text not null,
  reference text,
  proof_path text,
  paid_at timestamptz not null default now(),
  recorded_by uuid not null references auth.users(id),
  created_at timestamptz not null default now(),
  unique (workspace_id, id)
);

create table public.invoice_public_links (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references public.workspaces(id) on delete cascade,
  invoice_id uuid not null references public.invoices(id) on delete cascade,
  token_hash text not null unique,
  expires_at timestamptz not null,
  revoked_at timestamptz,
  created_by uuid not null references auth.users(id),
  created_at timestamptz not null default now(),
  unique (workspace_id, invoice_id)
);

create table public.invoice_public_views (
  id bigint generated always as identity primary key,
  workspace_id uuid not null references public.workspaces(id) on delete cascade,
  public_link_id uuid not null references public.invoice_public_links(id) on delete cascade,
  viewed_at timestamptz not null default now(),
  user_agent text,
  ip_hash text
);

alter table public.invoices add constraint invoices_workspace_client_fk foreign key (workspace_id, client_id) references public.crm_clients(workspace_id, id);
alter table public.invoices add constraint invoices_workspace_project_fk foreign key (workspace_id, project_id) references public.projects(workspace_id, id);
alter table public.invoices add constraint invoices_workspace_template_fk foreign key (workspace_id, template_id) references public.invoice_templates(workspace_id, id);
alter table public.invoice_items add constraint invoice_items_workspace_invoice_fk foreign key (workspace_id, invoice_id) references public.invoices(workspace_id, id);
alter table public.invoice_payments add constraint invoice_payments_workspace_invoice_fk foreign key (workspace_id, invoice_id) references public.invoices(workspace_id, id);
alter table public.invoice_public_links add constraint invoice_links_workspace_invoice_fk foreign key (workspace_id, invoice_id) references public.invoices(workspace_id, id);

create index invoices_workspace_status_idx on public.invoices(workspace_id, status, due_date);
create index invoice_items_invoice_idx on public.invoice_items(invoice_id, sort_order);
create index invoice_payments_invoice_idx on public.invoice_payments(invoice_id, paid_at desc);
create index invoice_views_link_idx on public.invoice_public_views(public_link_id, viewed_at desc);

create trigger invoice_templates_set_updated_at before update on public.invoice_templates for each row execute function public.set_updated_at();
create trigger invoices_set_updated_at before update on public.invoices for each row execute function public.set_updated_at();

create or replace function public.recalculate_invoice(target_invoice_id uuid)
returns void language plpgsql security definer set search_path = public as $$
declare target_workspace_id uuid; calculated_subtotal numeric; calculated_discount numeric; calculated_tax numeric; calculated_total numeric; calculated_paid numeric;
begin
  select workspace_id into target_workspace_id from public.invoices where id = target_invoice_id for update;
  if not found then raise exception 'Invoice not found'; end if;
  select coalesce(sum(quantity * unit_price),0), coalesce(sum(discount),0), coalesce(sum(greatest(quantity * unit_price - discount,0) * tax_rate / 100),0), coalesce(sum(line_total),0)
  into calculated_subtotal, calculated_discount, calculated_tax, calculated_total from public.invoice_items where invoice_id = target_invoice_id;
  select coalesce(sum(amount),0) into calculated_paid from public.invoice_payments where invoice_id = target_invoice_id;
  if calculated_paid > calculated_total then raise exception 'Payments exceed invoice total'; end if;
  update public.invoices set subtotal=calculated_subtotal, discount_total=calculated_discount, tax_total=calculated_tax, grand_total=calculated_total, paid_total=calculated_paid,
    status = case when status in ('draft','cancelled') then status when calculated_total > 0 and calculated_paid >= calculated_total then 'paid'::public.invoice_status when calculated_paid > 0 then 'partially_paid'::public.invoice_status else 'issued'::public.invoice_status end
  where id = target_invoice_id;
end; $$;

create or replace function public.issue_invoice(target_invoice_id uuid)
returns text language plpgsql security definer set search_path = public as $$
declare target public.invoices%rowtype; line public.invoice_items%rowtype;
begin
  select * into target from public.invoices where id=target_invoice_id for update;
  if not found then raise exception 'Invoice not found'; end if;
  if not public.has_workspace_role(target.workspace_id, array['owner','manager','accountant','staff']::public.workspace_role[]) then raise exception 'Not authorized'; end if;
  if target.status <> 'draft' then raise exception 'Only draft invoices can be issued'; end if;
  perform public.recalculate_invoice(target.id);
  select * into target from public.invoices where id=target_invoice_id;
  if target.grand_total <= 0 then raise exception 'Invoice total must be greater than zero'; end if;
  for line in select * from public.invoice_items where invoice_id=target.id and kind='product'
  loop
    perform public.post_stock_movement(target.workspace_id, line.catalog_item_id, 'sale', line.quantity, target.invoice_number, 'Issued invoice stock deduction', 'invoice:'||target.id||':line:'||line.id, 'invoice', target.id);
  end loop;
  update public.invoices set status='issued', issue_date=coalesce(issue_date,current_date), issued_at=now() where id=target.id;
  insert into public.audit_logs(workspace_id,actor_id,action,entity_type,entity_id,new_values) values(target.workspace_id,auth.uid(),'invoice.issued','invoice',target.id::text,jsonb_build_object('invoice_number',target.invoice_number,'total',target.grand_total));
  return target.invoice_number;
end; $$;

create or replace function public.record_invoice_payment(target_invoice_id uuid, payment_amount numeric, payment_method_value public.payment_method, payment_account text, payment_reference text default null, payment_proof_path text default null)
returns uuid language plpgsql security definer set search_path = public as $$
declare target public.invoices%rowtype; created_payment_id uuid;
begin
  select * into target from public.invoices where id=target_invoice_id for update;
  if not found then raise exception 'Invoice not found'; end if;
  if not public.has_workspace_role(target.workspace_id, array['owner','manager','accountant','staff']::public.workspace_role[]) then raise exception 'Not authorized'; end if;
  if target.status in ('draft','cancelled') then raise exception 'Payment cannot be recorded for this invoice'; end if;
  if payment_amount <= 0 or target.paid_total + payment_amount > target.grand_total then raise exception 'Invalid payment amount'; end if;
  insert into public.invoice_payments(workspace_id,invoice_id,amount,method,account_label,reference,proof_path,recorded_by) values(target.workspace_id,target.id,payment_amount,payment_method_value,payment_account,payment_reference,payment_proof_path,auth.uid()) returning id into created_payment_id;
  perform public.recalculate_invoice(target.id);
  insert into public.audit_logs(workspace_id,actor_id,action,entity_type,entity_id,new_values) values(target.workspace_id,auth.uid(),'invoice.payment_recorded','invoice_payment',created_payment_id::text,jsonb_build_object('invoice_id',target.id,'amount',payment_amount,'method',payment_method_value));
  return created_payment_id;
end; $$;

create or replace function public.create_invoice_public_link(target_invoice_id uuid, valid_for_days integer default 30)
returns text language plpgsql security definer set search_path = public as $$
declare target public.invoices%rowtype; raw_token text;
begin
  select * into target from public.invoices where id=target_invoice_id;
  if not found or not public.has_workspace_role(target.workspace_id,array['owner','manager','accountant','staff']::public.workspace_role[]) then raise exception 'Not authorized'; end if;
  if target.status='draft' then raise exception 'Issue invoice before sharing'; end if;
  raw_token := encode(gen_random_bytes(24),'hex');
  insert into public.invoice_public_links(workspace_id,invoice_id,token_hash,expires_at,created_by) values(target.workspace_id,target.id,encode(digest(raw_token,'sha256'),'hex'),now()+make_interval(days=>greatest(valid_for_days,1)),auth.uid())
  on conflict(workspace_id,invoice_id) do update set token_hash=excluded.token_hash,expires_at=excluded.expires_at,revoked_at=null,created_by=auth.uid(),created_at=now();
  return raw_token;
end; $$;

create or replace function public.get_public_invoice(raw_token text, request_user_agent text default null, request_ip text default null)
returns jsonb language plpgsql security definer set search_path = public as $$
declare link_row public.invoice_public_links%rowtype; result jsonb;
begin
  select * into link_row from public.invoice_public_links where token_hash=encode(digest(raw_token,'sha256'),'hex') and revoked_at is null and expires_at>=now();
  if not found then return null; end if;
  insert into public.invoice_public_views(workspace_id,public_link_id,user_agent,ip_hash) values(link_row.workspace_id,link_row.id,left(request_user_agent,500),case when request_ip is null then null else encode(digest(request_ip,'sha256'),'hex') end);
  select jsonb_build_object('invoice',to_jsonb(i)-'created_by','client',to_jsonb(c),'items',coalesce((select jsonb_agg(to_jsonb(ii) order by ii.sort_order) from public.invoice_items ii where ii.invoice_id=i.id),'[]'::jsonb),'payments',coalesce((select jsonb_agg(to_jsonb(p)-'proof_path' order by p.paid_at) from public.invoice_payments p where p.invoice_id=i.id),'[]'::jsonb),'workspace',jsonb_build_object('name',w.name,'settings',to_jsonb(ws))) into result
  from public.invoices i join public.crm_clients c on c.id=i.client_id join public.workspaces w on w.id=i.workspace_id join public.workspace_settings ws on ws.workspace_id=w.id where i.id=link_row.invoice_id;
  return result;
end; $$;

revoke all on function public.issue_invoice(uuid) from public;
grant execute on function public.issue_invoice(uuid) to authenticated;
revoke all on function public.record_invoice_payment(uuid,numeric,public.payment_method,text,text,text) from public;
grant execute on function public.record_invoice_payment(uuid,numeric,public.payment_method,text,text,text) to authenticated;
revoke all on function public.create_invoice_public_link(uuid,integer) from public;
grant execute on function public.create_invoice_public_link(uuid,integer) to authenticated;
revoke all on function public.get_public_invoice(text,text,text) from public;
grant execute on function public.get_public_invoice(text,text,text) to anon, authenticated;

alter table public.invoice_sequences enable row level security;
alter table public.invoice_templates enable row level security;
alter table public.invoices enable row level security;
alter table public.invoice_items enable row level security;
alter table public.invoice_payments enable row level security;
alter table public.invoice_public_links enable row level security;
alter table public.invoice_public_views enable row level security;

do $$ declare table_name text; begin
  foreach table_name in array array['invoice_sequences','invoice_templates','invoices','invoice_items'] loop
    execute format('create policy %I on public.%I for select to authenticated using (public.is_workspace_member(workspace_id) or public.is_platform_admin())',table_name||'_read',table_name);
    execute format('create policy %I on public.%I for all to authenticated using (public.has_workspace_role(workspace_id,array[''owner'',''manager'',''accountant'',''staff'']::public.workspace_role[])) with check (public.has_workspace_role(workspace_id,array[''owner'',''manager'',''accountant'',''staff'']::public.workspace_role[]))',table_name||'_manage',table_name);
  end loop;
end $$;
create policy invoice_payments_read on public.invoice_payments for select to authenticated using(public.is_workspace_member(workspace_id));
create policy invoice_links_read on public.invoice_public_links for select to authenticated using(public.is_workspace_member(workspace_id));
create policy invoice_views_read on public.invoice_public_views for select to authenticated using(public.has_workspace_role(workspace_id,array['owner','manager','accountant']::public.workspace_role[]));
-- Payments, public links and view logs are written through trusted functions only.
