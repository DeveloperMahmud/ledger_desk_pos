-- Phases 5-6: email outbox, cash/bank operations and double-entry accounting.

create type public.ledger_account_type as enum ('asset','liability','equity','income','expense');
create type public.journal_status as enum ('draft','posted','reversed');
create type public.email_delivery_status as enum ('queued','sending','sent','failed','cancelled');

create table public.money_accounts (
  id uuid primary key default gen_random_uuid(), workspace_id uuid not null references public.workspaces(id) on delete cascade,
  name text not null, kind text not null check(kind in ('cash','bank','online_bank')), currency text not null default 'BDT', opening_balance numeric(14,2) not null default 0,
  is_active boolean not null default true, created_at timestamptz not null default now(), updated_at timestamptz not null default now(), unique(workspace_id,id)
);
create table public.ledger_accounts (
  id uuid primary key default gen_random_uuid(), workspace_id uuid not null references public.workspaces(id) on delete cascade,
  code text not null, name text not null, account_type public.ledger_account_type not null, parent_id uuid references public.ledger_accounts(id) on delete restrict,
  system_key text, is_system boolean not null default false, is_active boolean not null default true, created_at timestamptz not null default now(), updated_at timestamptz not null default now(),
  unique(workspace_id,code), unique(workspace_id,system_key), unique(workspace_id,id)
);
create table public.accounting_periods (
  id uuid primary key default gen_random_uuid(), workspace_id uuid not null references public.workspaces(id) on delete cascade,
  name text not null, starts_on date not null, ends_on date not null, locked_at timestamptz, locked_by uuid references auth.users(id), created_at timestamptz not null default now(),
  unique(workspace_id,starts_on,ends_on), check(ends_on>=starts_on)
);
create table public.journal_entries (
  id uuid primary key default gen_random_uuid(), workspace_id uuid not null references public.workspaces(id) on delete cascade,
  entry_number text not null, entry_date date not null, memo text not null, status public.journal_status not null default 'draft', source_type text, source_id uuid,
  reversal_of_id uuid references public.journal_entries(id) on delete restrict, posted_at timestamptz, posted_by uuid references auth.users(id), created_by uuid not null references auth.users(id), created_at timestamptz not null default now(), updated_at timestamptz not null default now(),
  unique(workspace_id,entry_number), unique(workspace_id,source_type,source_id), unique(workspace_id,id)
);
create table public.journal_lines (
  id uuid primary key default gen_random_uuid(), workspace_id uuid not null references public.workspaces(id) on delete cascade,
  journal_entry_id uuid not null references public.journal_entries(id) on delete cascade, account_id uuid not null references public.ledger_accounts(id) on delete restrict,
  description text, debit numeric(14,2) not null default 0 check(debit>=0), credit numeric(14,2) not null default 0 check(credit>=0), created_at timestamptz not null default now(),
  check((debit>0 and credit=0) or (credit>0 and debit=0))
);
create table public.financial_transactions (
  id uuid primary key default gen_random_uuid(), workspace_id uuid not null references public.workspaces(id) on delete cascade,
  money_account_id uuid not null references public.money_accounts(id) on delete restrict, category_account_id uuid not null references public.ledger_accounts(id) on delete restrict,
  journal_entry_id uuid references public.journal_entries(id) on delete restrict, transaction_type text not null check(transaction_type in ('income','expense','transfer')),
  transaction_date date not null, description text not null, amount numeric(14,2) not null check(amount>0), reference text, attachment_path text,
  created_by uuid not null references auth.users(id), created_at timestamptz not null default now(), unique(workspace_id,id)
);
create table public.email_templates (
  id uuid primary key default gen_random_uuid(), workspace_id uuid not null references public.workspaces(id) on delete cascade,
  template_key text not null, name text not null, subject_template text not null, html_template text not null, text_template text,
  is_active boolean not null default true, created_at timestamptz not null default now(), updated_at timestamptz not null default now(), unique(workspace_id,template_key), unique(workspace_id,id)
);
create table public.email_outbox (
  id uuid primary key default gen_random_uuid(), workspace_id uuid not null references public.workspaces(id) on delete cascade,
  template_id uuid references public.email_templates(id) on delete restrict, related_type text, related_id uuid, recipient_email text not null,
  subject text not null, html_body text not null, attachment_paths text[] not null default '{}', status public.email_delivery_status not null default 'queued',
  provider_message_id text, attempt_count integer not null default 0, last_error text, scheduled_at timestamptz not null default now(), sent_at timestamptz,
  created_by uuid not null references auth.users(id), created_at timestamptz not null default now()
);

alter table public.journal_lines add constraint journal_lines_workspace_entry_fk foreign key(workspace_id,journal_entry_id) references public.journal_entries(workspace_id,id);
alter table public.journal_lines add constraint journal_lines_workspace_account_fk foreign key(workspace_id,account_id) references public.ledger_accounts(workspace_id,id);
alter table public.financial_transactions add constraint finance_workspace_money_fk foreign key(workspace_id,money_account_id) references public.money_accounts(workspace_id,id);
alter table public.financial_transactions add constraint finance_workspace_category_fk foreign key(workspace_id,category_account_id) references public.ledger_accounts(workspace_id,id);
alter table public.financial_transactions add constraint finance_workspace_journal_fk foreign key(workspace_id,journal_entry_id) references public.journal_entries(workspace_id,id);
alter table public.email_outbox add constraint email_outbox_workspace_template_fk foreign key(workspace_id,template_id) references public.email_templates(workspace_id,id);

create index journal_entries_workspace_date_idx on public.journal_entries(workspace_id,entry_date desc,status);
create index journal_lines_account_idx on public.journal_lines(account_id,journal_entry_id);
create index finance_workspace_date_idx on public.financial_transactions(workspace_id,transaction_date desc);
create index email_outbox_delivery_idx on public.email_outbox(status,scheduled_at) where status in ('queued','failed');
create trigger money_accounts_set_updated_at before update on public.money_accounts for each row execute function public.set_updated_at();
create trigger ledger_accounts_set_updated_at before update on public.ledger_accounts for each row execute function public.set_updated_at();
create trigger journal_entries_set_updated_at before update on public.journal_entries for each row execute function public.set_updated_at();
create trigger email_templates_set_updated_at before update on public.email_templates for each row execute function public.set_updated_at();

create or replace function public.accounting_period_is_locked(target_workspace_id uuid,target_date date)
returns boolean language sql stable security definer set search_path=public as $$ select exists(select 1 from public.accounting_periods where workspace_id=target_workspace_id and target_date between starts_on and ends_on and locked_at is not null); $$;

create or replace function public.post_journal_entry(target_entry_id uuid)
returns void language plpgsql security definer set search_path=public as $$
declare target public.journal_entries%rowtype; total_debit numeric; total_credit numeric;
begin
 select * into target from public.journal_entries where id=target_entry_id for update;
 if not found or not public.has_workspace_role(target.workspace_id,array['owner','manager','accountant']::public.workspace_role[]) then raise exception 'Not authorized'; end if;
 if target.status<>'draft' then raise exception 'Only draft entries can be posted'; end if;
 if public.accounting_period_is_locked(target.workspace_id,target.entry_date) then raise exception 'Accounting period is locked'; end if;
 select coalesce(sum(debit),0),coalesce(sum(credit),0) into total_debit,total_credit from public.journal_lines where journal_entry_id=target.id;
 if total_debit<=0 or abs(total_debit-total_credit)>=0.005 then raise exception 'Journal entry is not balanced'; end if;
 update public.journal_entries set status='posted',posted_at=now(),posted_by=auth.uid() where id=target.id;
 insert into public.audit_logs(workspace_id,actor_id,action,entity_type,entity_id,new_values) values(target.workspace_id,auth.uid(),'journal.posted','journal_entry',target.id::text,jsonb_build_object('debit',total_debit,'credit',total_credit));
end; $$;

create or replace function public.reverse_journal_entry(target_entry_id uuid,reversal_date date,reversal_memo text)
returns uuid language plpgsql security definer set search_path=public as $$
declare target public.journal_entries%rowtype; created_id uuid;
begin
 select * into target from public.journal_entries where id=target_entry_id for update;
 if not found or target.status<>'posted' then raise exception 'Posted entry required'; end if;
 if not public.has_workspace_role(target.workspace_id,array['owner','accountant']::public.workspace_role[]) then raise exception 'Not authorized'; end if;
 if public.accounting_period_is_locked(target.workspace_id,reversal_date) then raise exception 'Accounting period is locked'; end if;
 insert into public.journal_entries(workspace_id,entry_number,entry_date,memo,status,source_type,source_id,reversal_of_id,posted_at,posted_by,created_by)
 values(target.workspace_id,target.entry_number||'-R',reversal_date,reversal_memo,'posted','reversal',target.id,target.id,now(),auth.uid(),auth.uid()) returning id into created_id;
 insert into public.journal_lines(workspace_id,journal_entry_id,account_id,description,debit,credit) select workspace_id,created_id,account_id,'Reversal: '||coalesce(description,''),credit,debit from public.journal_lines where journal_entry_id=target.id;
 update public.journal_entries set status='reversed' where id=target.id;
 return created_id;
end; $$;

create or replace function public.record_financial_transaction(target_workspace_id uuid,target_money_account_id uuid,target_category_account_id uuid,target_type text,target_date date,target_description text,target_amount numeric,target_reference text default null,target_attachment_path text default null)
returns uuid language plpgsql security definer set search_path=public as $$
declare cash_ledger_id uuid; created_entry_id uuid; created_transaction_id uuid; next_number text;
begin
 if not public.has_workspace_role(target_workspace_id,array['owner','manager','accountant']::public.workspace_role[]) then raise exception 'Not authorized'; end if;
 if target_type not in ('income','expense') or target_amount<=0 then raise exception 'Invalid transaction'; end if;
 if public.accounting_period_is_locked(target_workspace_id,target_date) then raise exception 'Accounting period is locked'; end if;
 select id into cash_ledger_id from public.ledger_accounts where workspace_id=target_workspace_id and system_key='cash_bank';
 if cash_ledger_id is null then raise exception 'Default chart of accounts is not configured'; end if;
 next_number:='JE-'||to_char(target_date,'YYYY')||'-'||lpad((select (count(*)+1)::text from public.journal_entries where workspace_id=target_workspace_id),5,'0');
 insert into public.journal_entries(workspace_id,entry_number,entry_date,memo,source_type,created_by) values(target_workspace_id,next_number,target_date,target_description,'basic_transaction',auth.uid()) returning id into created_entry_id;
 if target_type='income' then
  insert into public.journal_lines(workspace_id,journal_entry_id,account_id,debit,credit) values(target_workspace_id,created_entry_id,cash_ledger_id,target_description,target_amount,0),(target_workspace_id,created_entry_id,target_category_account_id,target_description,0,target_amount);
 else
  insert into public.journal_lines(workspace_id,journal_entry_id,account_id,debit,credit) values(target_workspace_id,created_entry_id,target_category_account_id,target_description,target_amount,0),(target_workspace_id,created_entry_id,cash_ledger_id,target_description,0,target_amount);
 end if;
 perform public.post_journal_entry(created_entry_id);
 insert into public.financial_transactions(workspace_id,money_account_id,category_account_id,journal_entry_id,transaction_type,transaction_date,description,amount,reference,attachment_path,created_by) values(target_workspace_id,target_money_account_id,target_category_account_id,created_entry_id,target_type,target_date,target_description,target_amount,target_reference,target_attachment_path,auth.uid()) returning id into created_transaction_id;
 update public.journal_entries set source_id=created_transaction_id where id=created_entry_id;
 return created_transaction_id;
end; $$;

create or replace function public.queue_invoice_email(target_invoice_id uuid,target_template_key text default 'invoice_send')
returns uuid language plpgsql security definer set search_path=public as $$
declare inv public.invoices%rowtype; client public.crm_clients%rowtype; tmpl public.email_templates%rowtype; created_id uuid;
begin
 select * into inv from public.invoices where id=target_invoice_id; if not found then raise exception 'Invoice not found'; end if;
 if not public.has_workspace_role(inv.workspace_id,array['owner','manager','accountant','staff']::public.workspace_role[]) then raise exception 'Not authorized'; end if;
 select * into client from public.crm_clients where id=inv.client_id;
 select * into tmpl from public.email_templates where workspace_id=inv.workspace_id and template_key=target_template_key and is_active;
 if client.email is null or tmpl.id is null then raise exception 'Recipient or email template missing'; end if;
 insert into public.email_outbox(workspace_id,template_id,related_type,related_id,recipient_email,subject,html_body,created_by)
 values(inv.workspace_id,tmpl.id,'invoice',inv.id,client.email,replace(replace(tmpl.subject_template,'{{invoice_number}}',inv.invoice_number),'{{client_name}}',client.name),replace(replace(replace(tmpl.html_template,'{{invoice_number}}',inv.invoice_number),'{{client_name}}',client.name),'{{amount_due}}',(inv.grand_total-inv.paid_total)::text),auth.uid()) returning id into created_id;
 return created_id;
end; $$;

revoke all on function public.post_journal_entry(uuid) from public; grant execute on function public.post_journal_entry(uuid) to authenticated;
revoke all on function public.reverse_journal_entry(uuid,date,text) from public; grant execute on function public.reverse_journal_entry(uuid,date,text) to authenticated;
revoke all on function public.record_financial_transaction(uuid,uuid,uuid,text,date,text,numeric,text,text) from public; grant execute on function public.record_financial_transaction(uuid,uuid,uuid,text,date,text,numeric,text,text) to authenticated;
revoke all on function public.queue_invoice_email(uuid,text) from public; grant execute on function public.queue_invoice_email(uuid,text) to authenticated;

alter table public.money_accounts enable row level security; alter table public.ledger_accounts enable row level security; alter table public.accounting_periods enable row level security;
alter table public.journal_entries enable row level security; alter table public.journal_lines enable row level security; alter table public.financial_transactions enable row level security;
alter table public.email_templates enable row level security; alter table public.email_outbox enable row level security;
do $$ declare table_name text; begin foreach table_name in array array['money_accounts','ledger_accounts','accounting_periods','journal_entries','journal_lines','financial_transactions','email_templates','email_outbox'] loop
 execute format('create policy %I on public.%I for select to authenticated using(public.has_workspace_role(workspace_id,array[''owner'',''manager'',''accountant'',''staff'',''viewer'']::public.workspace_role[]) or public.is_platform_admin())',table_name||'_read',table_name);
end loop; end $$;
create policy money_accounts_manage on public.money_accounts for all to authenticated using(public.has_workspace_role(workspace_id,array['owner','manager','accountant']::public.workspace_role[])) with check(public.has_workspace_role(workspace_id,array['owner','manager','accountant']::public.workspace_role[]));
create policy ledger_accounts_manage on public.ledger_accounts for all to authenticated using(public.has_workspace_role(workspace_id,array['owner','accountant']::public.workspace_role[])) with check(public.has_workspace_role(workspace_id,array['owner','accountant']::public.workspace_role[]));
create policy periods_manage on public.accounting_periods for all to authenticated using(public.has_workspace_role(workspace_id,array['owner','accountant']::public.workspace_role[])) with check(public.has_workspace_role(workspace_id,array['owner','accountant']::public.workspace_role[]));
create policy journals_create on public.journal_entries for insert to authenticated with check(created_by=auth.uid() and public.has_workspace_role(workspace_id,array['owner','accountant']::public.workspace_role[]));
create policy journal_lines_create on public.journal_lines for insert to authenticated with check(public.has_workspace_role(workspace_id,array['owner','accountant']::public.workspace_role[]));
create policy email_templates_manage on public.email_templates for all to authenticated using(public.has_workspace_role(workspace_id,array['owner','manager']::public.workspace_role[])) with check(public.has_workspace_role(workspace_id,array['owner','manager']::public.workspace_role[]));
-- Posted journals, financial transactions and email delivery state are mutated through trusted functions/workers.
