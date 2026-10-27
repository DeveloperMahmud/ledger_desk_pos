-- Workspace-isolated money tracker. This ledger is intentionally separate from business accounting.

create type public.money_book_type as enum ('personal','family','freelancing','agency','custom');
create type public.tracker_account_type as enum ('cash','bank','bkash','nagad','rocket','online_bank','savings','credit_card','loan','investment','custom');
create type public.tracker_transaction_type as enum ('income','expense','transfer');
create type public.tracker_transaction_status as enum ('pending','cleared');
create type public.tracker_source as enum ('manual','csv','xlsx','provider');

create table public.money_books (
  id uuid primary key default gen_random_uuid(), workspace_id uuid not null references public.workspaces(id) on delete cascade,
  name text not null, book_type public.money_book_type not null default 'personal', default_currency text not null default 'BDT',
  is_active boolean not null default true, created_by uuid not null references auth.users(id), created_at timestamptz not null default now(), updated_at timestamptz not null default now(), unique(workspace_id,id)
);
create table public.money_book_memberships (
  book_id uuid not null references public.money_books(id) on delete cascade, user_id uuid not null references auth.users(id) on delete cascade,
  role text not null default 'editor' check(role in ('owner','editor','viewer')), created_at timestamptz not null default now(), primary key(book_id,user_id)
);
create table public.tracker_accounts (
  id uuid primary key default gen_random_uuid(), workspace_id uuid not null references public.workspaces(id) on delete cascade, book_id uuid not null references public.money_books(id) on delete cascade,
  name text not null, account_type public.tracker_account_type not null, opening_balance numeric(16,2) not null default 0, currency text not null default 'BDT', color text not null default '#246BFD', icon text,
  include_in_total boolean not null default true, allow_negative boolean not null default true, is_active boolean not null default true,
  created_by uuid not null references auth.users(id), created_at timestamptz not null default now(), updated_at timestamptz not null default now(), unique(workspace_id,id)
);
create table public.tracker_categories (
  id uuid primary key default gen_random_uuid(), workspace_id uuid not null references public.workspaces(id) on delete cascade, book_id uuid not null references public.money_books(id) on delete cascade,
  parent_id uuid references public.tracker_categories(id) on delete set null, category_type text not null check(category_type in ('income','expense')),
  name text not null, color text not null default '#6D8DFF', icon text, is_system boolean not null default false, is_active boolean not null default true,
  created_by uuid references auth.users(id), created_at timestamptz not null default now(), unique(book_id,category_type,name), unique(workspace_id,id)
);
create table public.tracker_import_batches (
  id uuid primary key default gen_random_uuid(), workspace_id uuid not null references public.workspaces(id) on delete cascade, book_id uuid not null references public.money_books(id) on delete cascade,
  source public.tracker_source not null, file_name text, status text not null default 'preview' check(status in ('preview','imported','rolled_back','failed')),
  row_count integer not null default 0, imported_count integer not null default 0, duplicate_count integer not null default 0,
  mapping jsonb not null default '{}'::jsonb, created_by uuid not null references auth.users(id), created_at timestamptz not null default now(), rolled_back_at timestamptz
);
create table public.tracker_transfer_groups (id uuid primary key default gen_random_uuid(), workspace_id uuid not null references public.workspaces(id) on delete cascade, book_id uuid not null references public.money_books(id) on delete cascade, created_at timestamptz not null default now(), unique(workspace_id,id));
create table public.tracker_transactions (
  id uuid primary key default gen_random_uuid(), workspace_id uuid not null references public.workspaces(id) on delete cascade, book_id uuid not null references public.money_books(id) on delete cascade,
  account_id uuid not null references public.tracker_accounts(id) on delete restrict, category_id uuid references public.tracker_categories(id) on delete set null,
  transaction_type public.tracker_transaction_type not null, transfer_direction text check(transfer_direction in ('in','out') or transfer_direction is null), transfer_group_id uuid references public.tracker_transfer_groups(id) on delete cascade,
  amount numeric(16,2) not null check(amount>0), currency text not null default 'BDT', occurred_at timestamptz not null default now(), status public.tracker_transaction_status not null default 'cleared',
  payee text, note text, tags text[] not null default '{}', reference text, source public.tracker_source not null default 'manual', external_id text,
  import_batch_id uuid references public.tracker_import_batches(id) on delete set null, import_hash text, accounting_reference text,
  created_by uuid not null references auth.users(id), created_at timestamptz not null default now(), updated_at timestamptz not null default now(),
  check((transaction_type='transfer' and transfer_group_id is not null and transfer_direction is not null and category_id is null) or (transaction_type<>'transfer' and transfer_group_id is null and transfer_direction is null)), unique(workspace_id,id)
);
create unique index tracker_import_hash_unique on public.tracker_transactions(book_id,import_hash) where import_hash is not null;
create index tracker_transactions_book_date on public.tracker_transactions(book_id,occurred_at desc);
create table public.tracker_budgets (
  id uuid primary key default gen_random_uuid(), workspace_id uuid not null references public.workspaces(id) on delete cascade, book_id uuid not null references public.money_books(id) on delete cascade,
  category_id uuid not null references public.tracker_categories(id), period text not null check(period in ('weekly','monthly','yearly')), amount numeric(16,2) not null check(amount>0), starts_on date not null, ends_on date, active boolean not null default true, created_by uuid not null references auth.users(id), created_at timestamptz not null default now()
);
create table public.tracker_goals (
  id uuid primary key default gen_random_uuid(), workspace_id uuid not null references public.workspaces(id) on delete cascade, book_id uuid not null references public.money_books(id) on delete cascade,
  name text not null, target_amount numeric(16,2) not null check(target_amount>0), current_amount numeric(16,2) not null default 0, target_date date, color text not null default '#12A06A', completed_at timestamptz, created_by uuid not null references auth.users(id), created_at timestamptz not null default now()
);
create table public.tracker_recurring_rules (
  id uuid primary key default gen_random_uuid(), workspace_id uuid not null references public.workspaces(id) on delete cascade, book_id uuid not null references public.money_books(id) on delete cascade,
  account_id uuid not null references public.tracker_accounts(id), category_id uuid references public.tracker_categories(id), transaction_type public.tracker_transaction_type not null check(transaction_type<>'transfer'), amount numeric(16,2) not null check(amount>0),
  frequency text not null check(frequency in ('weekly','monthly','quarterly','yearly')), next_run_on date not null, payee text, note text, active boolean not null default true, created_by uuid not null references auth.users(id), created_at timestamptz not null default now()
);
create table public.tracker_attachments (
  id uuid primary key default gen_random_uuid(), workspace_id uuid not null references public.workspaces(id) on delete cascade, transaction_id uuid not null references public.tracker_transactions(id) on delete cascade,
  storage_path text not null, file_name text not null, mime_type text not null, size_bytes bigint not null check(size_bytes between 1 and 10485760), uploaded_by uuid not null references auth.users(id), created_at timestamptz not null default now()
);

-- Composite tenant keys prevent a valid row in one workspace from referencing another workspace.
alter table public.tracker_import_batches add constraint tracker_import_batches_workspace_id_unique unique(workspace_id,id);
alter table public.money_books add constraint money_books_workspace_id_unique unique(workspace_id,id);
alter table public.tracker_accounts add constraint tracker_accounts_book_workspace_fk foreign key(workspace_id,book_id) references public.money_books(workspace_id,id) on delete cascade;
alter table public.tracker_categories add constraint tracker_categories_book_workspace_fk foreign key(workspace_id,book_id) references public.money_books(workspace_id,id) on delete cascade;
alter table public.tracker_categories add constraint tracker_categories_parent_workspace_fk foreign key(workspace_id,parent_id) references public.tracker_categories(workspace_id,id) on delete restrict;
alter table public.tracker_import_batches add constraint tracker_import_batches_book_workspace_fk foreign key(workspace_id,book_id) references public.money_books(workspace_id,id) on delete cascade;
alter table public.tracker_transfer_groups add constraint tracker_transfer_groups_book_workspace_fk foreign key(workspace_id,book_id) references public.money_books(workspace_id,id) on delete cascade;
alter table public.tracker_transactions add constraint tracker_transactions_book_workspace_fk foreign key(workspace_id,book_id) references public.money_books(workspace_id,id) on delete cascade;
alter table public.tracker_transactions add constraint tracker_transactions_account_workspace_fk foreign key(workspace_id,account_id) references public.tracker_accounts(workspace_id,id) on delete restrict;
alter table public.tracker_transactions add constraint tracker_transactions_category_workspace_fk foreign key(workspace_id,category_id) references public.tracker_categories(workspace_id,id) on delete restrict;
alter table public.tracker_transactions add constraint tracker_transactions_transfer_workspace_fk foreign key(workspace_id,transfer_group_id) references public.tracker_transfer_groups(workspace_id,id) on delete cascade;
alter table public.tracker_transactions add constraint tracker_transactions_import_workspace_fk foreign key(workspace_id,import_batch_id) references public.tracker_import_batches(workspace_id,id) on delete restrict;
alter table public.tracker_budgets add constraint tracker_budgets_book_workspace_fk foreign key(workspace_id,book_id) references public.money_books(workspace_id,id) on delete cascade;
alter table public.tracker_budgets add constraint tracker_budgets_category_workspace_fk foreign key(workspace_id,category_id) references public.tracker_categories(workspace_id,id) on delete restrict;
alter table public.tracker_goals add constraint tracker_goals_book_workspace_fk foreign key(workspace_id,book_id) references public.money_books(workspace_id,id) on delete cascade;
alter table public.tracker_recurring_rules add constraint tracker_recurring_book_workspace_fk foreign key(workspace_id,book_id) references public.money_books(workspace_id,id) on delete cascade;
alter table public.tracker_recurring_rules add constraint tracker_recurring_account_workspace_fk foreign key(workspace_id,account_id) references public.tracker_accounts(workspace_id,id) on delete restrict;
alter table public.tracker_recurring_rules add constraint tracker_recurring_category_workspace_fk foreign key(workspace_id,category_id) references public.tracker_categories(workspace_id,id) on delete restrict;
alter table public.tracker_attachments add constraint tracker_attachments_transaction_workspace_fk foreign key(workspace_id,transaction_id) references public.tracker_transactions(workspace_id,id) on delete cascade;

create trigger money_books_set_updated_at before update on public.money_books for each row execute function public.set_updated_at();
create trigger tracker_accounts_set_updated_at before update on public.tracker_accounts for each row execute function public.set_updated_at();
create trigger tracker_transactions_set_updated_at before update on public.tracker_transactions for each row execute function public.set_updated_at();

create or replace function public.create_money_book(target_workspace_id uuid,book_name text,book_kind public.money_book_type,book_currency text)
returns uuid language plpgsql security definer set search_path=public as $$
declare created_id uuid;
begin
 if not public.has_workspace_role(target_workspace_id,array['owner','manager','accountant','staff']::public.workspace_role[]) then raise exception 'Not authorized'; end if;
 insert into public.money_books(workspace_id,name,book_type,default_currency,created_by) values(target_workspace_id,trim(book_name),book_kind,upper(book_currency),auth.uid()) returning id into created_id;
 insert into public.money_book_memberships(book_id,user_id,role) values(created_id,auth.uid(),'owner');
 insert into public.tracker_categories(workspace_id,book_id,category_type,name,color,is_system,created_by) values
 (target_workspace_id,created_id,'income','Client payment','#12A06A',true,auth.uid()),(target_workspace_id,created_id,'income','Other income','#3B82F6',true,auth.uid()),
 (target_workspace_id,created_id,'expense','Food','#F59E0B',true,auth.uid()),(target_workspace_id,created_id,'expense','Transport','#8B5CF6',true,auth.uid()),
 (target_workspace_id,created_id,'expense','Software & tools','#EF4444',true,auth.uid()),(target_workspace_id,created_id,'expense','Office','#64748B',true,auth.uid());
 insert into public.audit_logs(workspace_id,actor_id,action,entity_type,entity_id,new_values) values(target_workspace_id,auth.uid(),'tracker.book_created','money_book',created_id::text,jsonb_build_object('name',trim(book_name),'type',book_kind));
 return created_id;
end; $$;

create or replace function public.create_tracker_transaction(target_book_id uuid,target_account_id uuid,target_category_id uuid,entry_type public.tracker_transaction_type,entry_amount numeric,entry_currency text,entry_occurred_at timestamptz,entry_status public.tracker_transaction_status,entry_payee text,entry_note text,entry_tags text[],entry_reference text,entry_source public.tracker_source default 'manual')
returns uuid language plpgsql security definer set search_path=public as $$
declare book public.money_books%rowtype; created_id uuid; available_balance numeric;
begin
 select * into book from public.money_books where id=target_book_id and is_active;
 if not found or not public.has_workspace_role(book.workspace_id,array['owner','manager','accountant','staff']::public.workspace_role[]) then raise exception 'Not authorized'; end if;
 if entry_type='transfer' then raise exception 'Use create_tracker_transfer for transfers'; end if;
 if not exists(select 1 from public.tracker_accounts where id=target_account_id and book_id=target_book_id and workspace_id=book.workspace_id) then raise exception 'Invalid account'; end if;
 if target_category_id is not null and not exists(select 1 from public.tracker_categories where id=target_category_id and book_id=target_book_id and category_type=entry_type::text) then raise exception 'Invalid category'; end if;
 if entry_type='expense' and entry_status='cleared' and exists(select 1 from public.tracker_accounts where id=target_account_id and not allow_negative) then
   select a.opening_balance+coalesce(sum(case when t.status='cleared' and (t.transaction_type='income' or t.transfer_direction='in') then t.amount when t.status='cleared' and (t.transaction_type='expense' or t.transfer_direction='out') then -t.amount else 0 end),0) into available_balance from public.tracker_accounts a left join public.tracker_transactions t on t.account_id=a.id where a.id=target_account_id group by a.opening_balance;
   if available_balance<entry_amount then raise exception 'Insufficient account balance'; end if;
 end if;
 insert into public.tracker_transactions(workspace_id,book_id,account_id,category_id,transaction_type,amount,currency,occurred_at,status,payee,note,tags,reference,source,created_by)
 values(book.workspace_id,target_book_id,target_account_id,target_category_id,entry_type,entry_amount,upper(entry_currency),entry_occurred_at,entry_status,nullif(trim(entry_payee),''),nullif(trim(entry_note),''),coalesce(entry_tags,'{}'),nullif(trim(entry_reference),''),entry_source,auth.uid()) returning id into created_id;
 insert into public.audit_logs(workspace_id,actor_id,action,entity_type,entity_id,new_values) values(book.workspace_id,auth.uid(),'tracker.transaction_created','tracker_transaction',created_id::text,jsonb_build_object('type',entry_type,'amount',entry_amount));
 return created_id;
end; $$;

create or replace function public.create_tracker_transfer(target_book_id uuid,source_account_id uuid,destination_account_id uuid,entry_amount numeric,entry_occurred_at timestamptz,entry_note text)
returns uuid language plpgsql security definer set search_path=public as $$
declare book public.money_books%rowtype; group_id uuid:=gen_random_uuid(); currency_code text; available_balance numeric; negative_allowed boolean;
begin
 select * into book from public.money_books where id=target_book_id and is_active;
 if not found or not public.has_workspace_role(book.workspace_id,array['owner','manager','accountant','staff']::public.workspace_role[]) then raise exception 'Not authorized'; end if;
 if source_account_id=destination_account_id or entry_amount<=0 then raise exception 'Invalid transfer'; end if;
 select currency into currency_code from public.tracker_accounts where id=source_account_id and book_id=target_book_id and is_active;
 if currency_code is null or not exists(select 1 from public.tracker_accounts where id=destination_account_id and book_id=target_book_id and is_active and currency=currency_code) then raise exception 'Accounts must exist and use the same currency'; end if;
 select a.allow_negative,a.opening_balance+coalesce(sum(case when t.status='cleared' and (t.transaction_type='income' or t.transfer_direction='in') then t.amount when t.status='cleared' and (t.transaction_type='expense' or t.transfer_direction='out') then -t.amount else 0 end),0) into negative_allowed,available_balance from public.tracker_accounts a left join public.tracker_transactions t on t.account_id=a.id where a.id=source_account_id group by a.allow_negative,a.opening_balance;
 if not negative_allowed and available_balance<entry_amount then raise exception 'Insufficient account balance'; end if;
 insert into public.tracker_transfer_groups(id,workspace_id,book_id) values(group_id,book.workspace_id,target_book_id);
 insert into public.tracker_transactions(workspace_id,book_id,account_id,transaction_type,transfer_direction,transfer_group_id,amount,currency,occurred_at,note,created_by) values
 (book.workspace_id,target_book_id,source_account_id,'transfer','out',group_id,entry_amount,currency_code,entry_occurred_at,nullif(trim(entry_note),''),auth.uid()),
 (book.workspace_id,target_book_id,destination_account_id,'transfer','in',group_id,entry_amount,currency_code,entry_occurred_at,nullif(trim(entry_note),''),auth.uid());
 insert into public.audit_logs(workspace_id,actor_id,action,entity_type,entity_id,new_values) values(book.workspace_id,auth.uid(),'tracker.transfer_created','tracker_transfer',group_id::text,jsonb_build_object('amount',entry_amount,'from',source_account_id,'to',destination_account_id));
 return group_id;
end; $$;

create or replace function public.import_tracker_transactions(target_book_id uuid,import_source public.tracker_source,import_file_name text,import_rows jsonb)
returns jsonb language plpgsql security definer set search_path=public as $$
declare book public.money_books%rowtype; batch_id uuid; row_data jsonb; row_hash text; imported integer:=0; duplicates integer:=0; row_type public.tracker_transaction_type;
begin
 select * into book from public.money_books where id=target_book_id and is_active;
 if not found or not public.has_workspace_role(book.workspace_id,array['owner','manager','accountant','staff']::public.workspace_role[]) then raise exception 'Not authorized'; end if;
 if import_source not in ('csv','xlsx') or jsonb_typeof(import_rows)<>'array' then raise exception 'Invalid import'; end if;
 insert into public.tracker_import_batches(workspace_id,book_id,source,file_name,status,row_count,created_by) values(book.workspace_id,target_book_id,import_source,nullif(trim(import_file_name),''),'preview',jsonb_array_length(import_rows),auth.uid()) returning id into batch_id;
 for row_data in select * from jsonb_array_elements(import_rows) loop
  row_type:=(row_data->>'type')::public.tracker_transaction_type;
  if row_type='transfer' then raise exception 'Transfers must be imported as explicit reviewed entries'; end if;
  if not exists(select 1 from public.tracker_accounts where id=(row_data->>'accountId')::uuid and book_id=target_book_id) then raise exception 'Invalid import account'; end if;
  if nullif(row_data->>'categoryId','') is not null and not exists(select 1 from public.tracker_categories where id=(row_data->>'categoryId')::uuid and book_id=target_book_id and category_type=row_type::text) then raise exception 'Invalid import category'; end if;
  row_hash:=encode(digest(concat_ws('|',target_book_id,row_data->>'accountId',row_type,row_data->>'amount',row_data->>'occurredAt',lower(coalesce(row_data->>'payee','')),lower(coalesce(row_data->>'reference',''))),'sha256'),'hex');
  if exists(select 1 from public.tracker_transactions where book_id=target_book_id and import_hash=row_hash) then duplicates:=duplicates+1; continue; end if;
  insert into public.tracker_transactions(workspace_id,book_id,account_id,category_id,transaction_type,amount,currency,occurred_at,status,payee,note,tags,reference,source,import_batch_id,import_hash,created_by)
  values(book.workspace_id,target_book_id,(row_data->>'accountId')::uuid,nullif(row_data->>'categoryId','')::uuid,row_type,(row_data->>'amount')::numeric,upper(coalesce(nullif(row_data->>'currency',''),book.default_currency)),(row_data->>'occurredAt')::timestamptz,coalesce((row_data->>'status')::public.tracker_transaction_status,'cleared'),nullif(trim(row_data->>'payee'),''),nullif(trim(row_data->>'note'),''),coalesce(array(select jsonb_array_elements_text(coalesce(row_data->'tags','[]'::jsonb))),'{}'),nullif(trim(row_data->>'reference'),''),import_source,batch_id,row_hash,auth.uid());
  imported:=imported+1;
 end loop;
 update public.tracker_import_batches set status='imported',imported_count=imported,duplicate_count=duplicates where id=batch_id;
 insert into public.audit_logs(workspace_id,actor_id,action,entity_type,entity_id,new_values) values(book.workspace_id,auth.uid(),'tracker.import_completed','tracker_import_batch',batch_id::text,jsonb_build_object('imported',imported,'duplicates',duplicates,'source',import_source));
 return jsonb_build_object('batchId',batch_id,'imported',imported,'duplicates',duplicates);
end; $$;

create or replace function public.rollback_tracker_import(target_batch_id uuid)
returns integer language plpgsql security definer set search_path=public as $$
declare batch public.tracker_import_batches%rowtype; removed integer;
begin
 select * into batch from public.tracker_import_batches where id=target_batch_id for update;
 if not found or batch.status<>'imported' or not public.has_workspace_role(batch.workspace_id,array['owner','manager','accountant']::public.workspace_role[]) then raise exception 'Import cannot be rolled back'; end if;
 delete from public.tracker_transactions where import_batch_id=target_batch_id; get diagnostics removed=row_count;
 update public.tracker_import_batches set status='rolled_back',rolled_back_at=now() where id=target_batch_id;
 insert into public.audit_logs(workspace_id,actor_id,action,entity_type,entity_id,new_values) values(batch.workspace_id,auth.uid(),'tracker.import_rolled_back','tracker_import_batch',target_batch_id::text,jsonb_build_object('removed',removed));
 return removed;
end; $$;

do $$ declare table_name text; begin
 foreach table_name in array array['money_books','tracker_accounts','tracker_categories','tracker_import_batches','tracker_transfer_groups','tracker_transactions','tracker_budgets','tracker_goals','tracker_recurring_rules','tracker_attachments'] loop
  execute format('alter table public.%I enable row level security',table_name);
  execute format('create policy %I on public.%I for select to authenticated using(public.is_workspace_member(workspace_id) or public.is_platform_admin())',table_name||'_read',table_name);
  execute format('create policy %I on public.%I for all to authenticated using(public.has_workspace_role(workspace_id,array[''owner'',''manager'',''accountant'',''staff'']::public.workspace_role[]) or public.is_platform_admin()) with check(public.has_workspace_role(workspace_id,array[''owner'',''manager'',''accountant'',''staff'']::public.workspace_role[]) or public.is_platform_admin())',table_name||'_write',table_name);
 end loop;
end $$;
alter table public.money_book_memberships enable row level security;
create policy money_book_memberships_read on public.money_book_memberships for select to authenticated using(exists(select 1 from public.money_books b where b.id=book_id and (public.is_workspace_member(b.workspace_id) or public.is_platform_admin())));
create policy money_book_memberships_write on public.money_book_memberships for all to authenticated using(exists(select 1 from public.money_books b where b.id=book_id and (public.has_workspace_role(b.workspace_id,array['owner','manager']::public.workspace_role[]) or public.is_platform_admin()))) with check(exists(select 1 from public.money_books b where b.id=book_id and (public.has_workspace_role(b.workspace_id,array['owner','manager']::public.workspace_role[]) or public.is_platform_admin())));

-- Ledger integrity mutations are RPC-only; members may still read their workspace rows.
drop policy tracker_transactions_write on public.tracker_transactions;
drop policy tracker_transfer_groups_write on public.tracker_transfer_groups;

revoke all on function public.create_money_book(uuid,text,public.money_book_type,text) from public;
revoke all on function public.create_tracker_transaction(uuid,uuid,uuid,public.tracker_transaction_type,numeric,text,timestamptz,public.tracker_transaction_status,text,text,text[],text,public.tracker_source) from public;
revoke all on function public.create_tracker_transfer(uuid,uuid,uuid,numeric,timestamptz,text) from public;
revoke all on function public.import_tracker_transactions(uuid,public.tracker_source,text,jsonb) from public;
revoke all on function public.rollback_tracker_import(uuid) from public;
grant execute on function public.create_money_book(uuid,text,public.money_book_type,text) to authenticated;
grant execute on function public.create_tracker_transaction(uuid,uuid,uuid,public.tracker_transaction_type,numeric,text,timestamptz,public.tracker_transaction_status,text,text,text[],text,public.tracker_source) to authenticated;
grant execute on function public.create_tracker_transfer(uuid,uuid,uuid,numeric,timestamptz,text) to authenticated;
grant execute on function public.import_tracker_transactions(uuid,public.tracker_source,text,jsonb) to authenticated;
grant execute on function public.rollback_tracker_import(uuid) to authenticated;
