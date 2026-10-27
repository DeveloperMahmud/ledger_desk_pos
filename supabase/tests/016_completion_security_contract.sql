-- Run with Supabase SQL testing after migrations 001-016.
-- These assertions fail loudly when tenant/security contracts are missing.
do $$
begin
 if not exists(select 1 from pg_constraint where conname='crm_clients_workspace_id_id_key') then raise exception 'crm_clients composite tenant key is missing'; end if;
 if not exists(select 1 from pg_constraint where conname='tracker_transactions_account_workspace_fk') then raise exception 'tracker transaction/account tenant FK is missing'; end if;
 if not exists(select 1 from pg_constraint where conname='tracker_recurring_destination_workspace_fk') then raise exception 'recurring destination tenant FK is missing'; end if;
 if not exists(select 1 from pg_policies where schemaname='public' and tablename='tracker_transactions' and policyname='tracker_transactions_read') then raise exception 'tracker transaction read policy is missing'; end if;
 if exists(select 1 from pg_policies where schemaname='public' and tablename='tracker_transactions' and cmd in ('INSERT','UPDATE','DELETE','ALL')) then raise exception 'tracker transaction direct-write policy must not exist'; end if;
 if not exists(select 1 from pg_proc where proname='update_tracker_transaction' and prosecdef) then raise exception 'trusted tracker update RPC is missing'; end if;
 if not exists(select 1 from pg_proc where proname='is_platform_admin' and prosecdef) then raise exception 'platform admin authority function is missing'; end if;
end $$;
