-- Completes the Money Tracker lifecycle, runtime theme and backup audit features.
-- This migration is additive and keeps migrations 001-015 immutable.

alter table public.tracker_budgets
  add column if not exists account_id uuid references public.tracker_accounts(id) on delete set null,
  add column if not exists rollover_enabled boolean not null default false;

alter table public.tracker_recurring_rules
  add column if not exists destination_account_id uuid references public.tracker_accounts(id) on delete set null,
  add column if not exists creation_mode text not null default 'manual' check (creation_mode in ('manual','automatic')),
  add column if not exists last_posted_at timestamptz;

alter table public.tracker_budgets add constraint tracker_budgets_account_workspace_fk foreign key(workspace_id,account_id) references public.tracker_accounts(workspace_id,id) on delete set null;
alter table public.tracker_recurring_rules add constraint tracker_recurring_destination_workspace_fk foreign key(workspace_id,destination_account_id) references public.tracker_accounts(workspace_id,id) on delete set null;

alter table public.tracker_recurring_rules drop constraint if exists tracker_recurring_rules_transaction_type_check;
alter table public.tracker_recurring_rules add constraint tracker_recurring_rules_transaction_type_check
  check(transaction_type in ('income','expense','transfer'));

alter table public.platform_settings
  add column if not exists compact_logo_url text,
  add column if not exists login_logo_url text,
  add column if not exists background_color text not null default '#F5F7FA',
  add column if not exists text_color text not null default '#17263F',
  add column if not exists theme_mode text not null default 'system' check(theme_mode in ('light','dark','system')),
  add column if not exists font_family text not null default 'Inter',
  add column if not exists login_heading text not null default 'Welcome back',
  add column if not exists support_contact text,
  add column if not exists footer_text text not null default 'LedgerDesk Business OS';

drop policy if exists workspace_backup_runs_write on public.workspace_backup_runs;
create policy workspace_backup_runs_insert on public.workspace_backup_runs for insert to authenticated
with check(public.has_workspace_role(workspace_id,array['owner']::public.workspace_role[]) or public.is_platform_admin());
create policy workspace_backup_runs_update on public.workspace_backup_runs for update to authenticated
using(public.has_workspace_role(workspace_id,array['owner']::public.workspace_role[]) or public.is_platform_admin())
with check(public.has_workspace_role(workspace_id,array['owner']::public.workspace_role[]) or public.is_platform_admin());

create or replace function public.update_tracker_transaction(
  target_transaction_id uuid,target_account_id uuid,target_category_id uuid,entry_amount numeric,
  entry_occurred_at timestamptz,entry_status public.tracker_transaction_status,entry_payee text,
  entry_note text,entry_tags text[],entry_reference text)
returns void language plpgsql security definer set search_path=public as $$
declare row_data public.tracker_transactions%rowtype;
begin
 select * into row_data from public.tracker_transactions where id=target_transaction_id for update;
 if not found or row_data.transaction_type='transfer' or not public.has_workspace_role(row_data.workspace_id,array['owner','manager','accountant','staff']::public.workspace_role[]) then raise exception 'Transaction cannot be edited'; end if;
 if entry_amount<=0 then raise exception 'Amount must be positive'; end if;
 if not exists(select 1 from public.tracker_accounts where id=target_account_id and book_id=row_data.book_id and is_active) then raise exception 'Invalid account'; end if;
 if target_category_id is not null and not exists(select 1 from public.tracker_categories where id=target_category_id and book_id=row_data.book_id and category_type=row_data.transaction_type::text) then raise exception 'Invalid category'; end if;
 update public.tracker_transactions set account_id=target_account_id,category_id=target_category_id,amount=entry_amount,occurred_at=entry_occurred_at,status=entry_status,payee=nullif(trim(entry_payee),''),note=nullif(trim(entry_note),''),tags=coalesce(entry_tags,'{}'),reference=nullif(trim(entry_reference),'') where id=target_transaction_id;
 insert into public.audit_logs(workspace_id,actor_id,action,entity_type,entity_id,new_values) values(row_data.workspace_id,auth.uid(),'tracker.transaction_updated','tracker_transaction',target_transaction_id::text,jsonb_build_object('amount',entry_amount));
end; $$;

create or replace function public.reverse_tracker_entry(target_id uuid)
returns integer language plpgsql security definer set search_path=public as $$
declare row_data public.tracker_transactions%rowtype; removed integer;
begin
 select * into row_data from public.tracker_transactions where id=target_id;
 if not found or not public.has_workspace_role(row_data.workspace_id,array['owner','manager','accountant']::public.workspace_role[]) then raise exception 'Entry cannot be reversed'; end if;
 if row_data.transfer_group_id is not null then delete from public.tracker_transfer_groups where id=row_data.transfer_group_id; else delete from public.tracker_transactions where id=target_id; end if;
 get diagnostics removed=row_count;
 insert into public.audit_logs(workspace_id,actor_id,action,entity_type,entity_id,old_values) values(row_data.workspace_id,auth.uid(),'tracker.entry_reversed','tracker_transaction',target_id::text,to_jsonb(row_data));
 return greatest(removed,1);
end; $$;

create or replace function public.post_tracker_recurring(target_rule_id uuid)
returns uuid language plpgsql security definer set search_path=public as $$
declare rule_data public.tracker_recurring_rules%rowtype; created_id uuid; next_date date;
begin
 select * into rule_data from public.tracker_recurring_rules where id=target_rule_id and active for update;
 if not found or not public.has_workspace_role(rule_data.workspace_id,array['owner','manager','accountant','staff']::public.workspace_role[]) then raise exception 'Recurring plan cannot be posted'; end if;
 if rule_data.transaction_type='transfer' then
   if rule_data.destination_account_id is null then raise exception 'Destination account is required'; end if;
   created_id:=public.create_tracker_transfer(rule_data.book_id,rule_data.account_id,rule_data.destination_account_id,rule_data.amount,now(),rule_data.note);
 else
   created_id:=public.create_tracker_transaction(rule_data.book_id,rule_data.account_id,rule_data.category_id,rule_data.transaction_type,rule_data.amount,(select default_currency from public.money_books where id=rule_data.book_id),now(),'cleared',rule_data.payee,rule_data.note,'{}',target_rule_id::text,'manual');
 end if;
 next_date:=case rule_data.frequency when 'weekly' then rule_data.next_run_on+7 when 'monthly' then (rule_data.next_run_on+interval '1 month')::date when 'quarterly' then (rule_data.next_run_on+interval '3 months')::date else (rule_data.next_run_on+interval '1 year')::date end;
 update public.tracker_recurring_rules set last_posted_at=now(),next_run_on=next_date where id=target_rule_id;
 return created_id;
end; $$;

create or replace function public.contribute_tracker_goal(target_goal_id uuid,contribution numeric)
returns numeric language plpgsql security definer set search_path=public as $$
declare goal_data public.tracker_goals%rowtype; total numeric;
begin
 select * into goal_data from public.tracker_goals where id=target_goal_id for update;
 if not found or contribution<=0 or not public.has_workspace_role(goal_data.workspace_id,array['owner','manager','accountant','staff']::public.workspace_role[]) then raise exception 'Goal cannot be updated'; end if;
 update public.tracker_goals set current_amount=least(target_amount,current_amount+contribution),completed_at=case when current_amount+contribution>=target_amount then coalesce(completed_at,now()) else null end where id=target_goal_id returning current_amount into total;
 return total;
end; $$;

create or replace function public.process_due_tracker_recurring(target_book_id uuid)
returns integer language plpgsql security definer set search_path=public as $$
declare item record; processed integer:=0;
begin
 if not exists(select 1 from public.money_books b where b.id=target_book_id and public.has_workspace_role(b.workspace_id,array['owner','manager','accountant','staff']::public.workspace_role[])) then raise exception 'Not authorized'; end if;
 for item in select id from public.tracker_recurring_rules where book_id=target_book_id and active and creation_mode='automatic' and next_run_on<=current_date order by next_run_on for update skip locked loop
   perform public.post_tracker_recurring(item.id);processed:=processed+1;
 end loop;
 return processed;
end; $$;

create or replace function public.get_platform_branding() returns jsonb language sql stable security definer set search_path=public as $$
 select jsonb_build_object('appName',app_name,'tagline',app_tagline,'logoUrl',logo_url,'compactLogoUrl',compact_logo_url,'loginLogoUrl',login_logo_url,'faviconUrl',favicon_url,'primaryColor',primary_color,'accentColor',accent_color,'canvasColor',canvas_color,'backgroundColor',background_color,'textColor',text_color,'themeMode',theme_mode,'fontFamily',font_family,'loginHeading',login_heading,'supportContact',coalesce(support_contact,''),'footerText',footer_text) from public.platform_settings where singleton=true;
$$;

insert into storage.buckets(id,name,public,file_size_limit,allowed_mime_types)
values('platform-assets','platform-assets',true,2097152,array['image/png','image/jpeg','image/webp','image/x-icon'])
on conflict(id) do update set public=true,file_size_limit=2097152,allowed_mime_types=excluded.allowed_mime_types;

revoke all on function public.update_tracker_transaction(uuid,uuid,uuid,numeric,timestamptz,public.tracker_transaction_status,text,text,text[],text) from public;
revoke all on function public.reverse_tracker_entry(uuid) from public;
revoke all on function public.post_tracker_recurring(uuid) from public;
revoke all on function public.contribute_tracker_goal(uuid,numeric) from public;
revoke all on function public.process_due_tracker_recurring(uuid) from public;
grant execute on function public.update_tracker_transaction(uuid,uuid,uuid,numeric,timestamptz,public.tracker_transaction_status,text,text,text[],text) to authenticated;
grant execute on function public.reverse_tracker_entry(uuid) to authenticated;
grant execute on function public.post_tracker_recurring(uuid) to authenticated;
grant execute on function public.contribute_tracker_goal(uuid,numeric) to authenticated;
grant execute on function public.process_due_tracker_recurring(uuid) to authenticated;
