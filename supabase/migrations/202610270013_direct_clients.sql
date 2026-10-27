-- Direct CRM client creation, editing and lifecycle controls.

alter table public.crm_clients
  add column if not exists client_type text not null default 'company' check (client_type in ('individual','company')),
  add column if not exists default_currency text not null default 'BDT',
  add column if not exists payment_terms_days integer not null default 14 check (payment_terms_days between 0 and 365);

create index if not exists crm_clients_workspace_email_idx
  on public.crm_clients(workspace_id,lower(email)) where email is not null and trim(email)<>'' and status='active';
create index if not exists crm_clients_workspace_phone_idx
  on public.crm_clients(workspace_id,regexp_replace(phone,'[^0-9+]','','g')) where phone is not null and trim(phone)<>'' and status='active';

create or replace function public.create_crm_client(
  target_workspace_id uuid, client_name text, client_company text, client_email text,
  client_phone text, client_kind text, client_billing_address text,
  client_currency text, client_payment_terms integer
) returns uuid language plpgsql security definer set search_path=public as $$
declare created_id uuid; duplicate_id uuid;
begin
  if not public.has_workspace_role(target_workspace_id,array['owner','manager','staff']::public.workspace_role[]) then raise exception 'Not authorized'; end if;
  if char_length(trim(coalesce(client_name,'')))<2 then raise exception 'Client name is required'; end if;
  if client_kind not in ('individual','company') then raise exception 'Invalid client type'; end if;
  perform pg_advisory_xact_lock(hashtextextended(target_workspace_id::text||':crm-client-contact',0));
  select id into duplicate_id from public.crm_clients where workspace_id=target_workspace_id and status='active' and (
    (nullif(trim(client_email),'') is not null and lower(email)=lower(trim(client_email))) or
    (nullif(trim(client_phone),'') is not null and regexp_replace(phone,'[^0-9+]','','g')=regexp_replace(trim(client_phone),'[^0-9+]','','g'))
  ) limit 1;
  if duplicate_id is not null then raise exception 'A client with this email or phone already exists' using detail=duplicate_id::text, errcode='23505'; end if;
  insert into public.crm_clients(workspace_id,name,company,email,phone,billing_address,client_type,default_currency,payment_terms_days,created_by)
  values(target_workspace_id,trim(client_name),nullif(trim(client_company),''),nullif(lower(trim(client_email)),''),nullif(trim(client_phone),''),nullif(trim(client_billing_address),''),client_kind,upper(coalesce(nullif(trim(client_currency),''),'BDT')),coalesce(client_payment_terms,14),auth.uid()) returning id into created_id;
  insert into public.audit_logs(workspace_id,actor_id,action,entity_type,entity_id,new_values) values(target_workspace_id,auth.uid(),'crm.client_created','crm_client',created_id::text,jsonb_build_object('name',trim(client_name),'client_type',client_kind));
  return created_id;
end; $$;

create or replace function public.update_crm_client(
  target_client_id uuid, client_name text, client_company text, client_email text,
  client_phone text, client_kind text, client_billing_address text,
  client_currency text, client_payment_terms integer, client_status text
) returns void language plpgsql security definer set search_path=public as $$
declare target public.crm_clients%rowtype; old_snapshot jsonb; duplicate_id uuid;
begin
  select * into target from public.crm_clients where id=target_client_id for update;
  if not found or not public.has_workspace_role(target.workspace_id,array['owner','manager','staff']::public.workspace_role[]) then raise exception 'Not authorized'; end if;
  if client_status not in ('active','inactive') or client_kind not in ('individual','company') then raise exception 'Invalid client values'; end if;
  perform pg_advisory_xact_lock(hashtextextended(target.workspace_id::text||':crm-client-contact',0));
  if client_status='active' then
    select id into duplicate_id from public.crm_clients where workspace_id=target.workspace_id and id<>target_client_id and status='active' and ((nullif(trim(client_email),'') is not null and lower(email)=lower(trim(client_email))) or (nullif(trim(client_phone),'') is not null and regexp_replace(phone,'[^0-9+]','','g')=regexp_replace(trim(client_phone),'[^0-9+]','','g'))) limit 1;
    if duplicate_id is not null then raise exception 'A client with this email or phone already exists' using detail=duplicate_id::text, errcode='23505'; end if;
  end if;
  old_snapshot:=jsonb_build_object('name',target.name,'email',target.email,'phone',target.phone,'status',target.status);
  update public.crm_clients set name=trim(client_name),company=nullif(trim(client_company),''),email=nullif(lower(trim(client_email)),''),phone=nullif(trim(client_phone),''),billing_address=nullif(trim(client_billing_address),''),client_type=client_kind,default_currency=upper(coalesce(nullif(trim(client_currency),''),'BDT')),payment_terms_days=coalesce(client_payment_terms,14),status=client_status where id=target_client_id;
  insert into public.audit_logs(workspace_id,actor_id,action,entity_type,entity_id,old_values,new_values) values(target.workspace_id,auth.uid(),'crm.client_updated','crm_client',target_client_id::text,old_snapshot,jsonb_build_object('name',trim(client_name),'email',client_email,'phone',client_phone,'status',client_status));
end; $$;

revoke all on function public.create_crm_client(uuid,text,text,text,text,text,text,text,integer) from public;
revoke all on function public.update_crm_client(uuid,text,text,text,text,text,text,text,integer,text) from public;
grant execute on function public.create_crm_client(uuid,text,text,text,text,text,text,text,integer) to authenticated;
grant execute on function public.update_crm_client(uuid,text,text,text,text,text,text,text,integer,text) to authenticated;
