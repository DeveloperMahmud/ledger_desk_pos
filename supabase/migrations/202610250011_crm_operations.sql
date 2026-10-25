-- Production CRM operations: audited lead creation/conversion and atomic proposal drafts.

create or replace function public.create_crm_lead(
  target_workspace_id uuid, lead_name text, lead_company text, lead_email text,
  lead_phone text, lead_service text, lead_source text, lead_value numeric,
  lead_follow_up timestamptz, lead_notes text
) returns uuid language plpgsql security definer set search_path=public as $$
declare created_id uuid;
begin
  if not public.has_workspace_role(target_workspace_id,array['owner','manager','staff']::public.workspace_role[]) then raise exception 'Not authorized'; end if;
  insert into public.crm_leads(workspace_id,name,company,email,phone,service_interest,source,estimated_value,next_follow_up_at,notes,created_by)
  values(target_workspace_id,trim(lead_name),nullif(trim(lead_company),''),nullif(trim(lead_email),''),nullif(trim(lead_phone),''),nullif(trim(lead_service),''),nullif(trim(lead_source),''),greatest(coalesce(lead_value,0),0),lead_follow_up,nullif(trim(lead_notes),''),auth.uid()) returning id into created_id;
  insert into public.audit_logs(workspace_id,actor_id,action,entity_type,entity_id,new_values) values(target_workspace_id,auth.uid(),'crm.lead_created','crm_lead',created_id::text,jsonb_build_object('name',lead_name,'company',lead_company));
  return created_id;
end; $$;

create or replace function public.convert_crm_lead(target_lead_id uuid)
returns uuid language plpgsql security definer set search_path=public as $$
declare target public.crm_leads%rowtype; created_id uuid;
begin
  select * into target from public.crm_leads where id=target_lead_id for update;
  if not found then raise exception 'Lead not found'; end if;
  if not public.has_workspace_role(target.workspace_id,array['owner','manager','staff']::public.workspace_role[]) then raise exception 'Not authorized'; end if;
  if target.converted_client_id is not null then return target.converted_client_id; end if;
  insert into public.crm_clients(workspace_id,name,company,email,phone,source_lead_id,created_by)
  values(target.workspace_id,target.name,target.company,target.email,target.phone,target.id,auth.uid()) returning id into created_id;
  update public.crm_leads set stage='won',converted_client_id=created_id where id=target.id;
  insert into public.audit_logs(workspace_id,actor_id,action,entity_type,entity_id,new_values) values(target.workspace_id,auth.uid(),'crm.lead_converted','crm_client',created_id::text,jsonb_build_object('lead_id',target.id));
  return created_id;
end; $$;

create or replace function public.create_proposal_draft(
  target_workspace_id uuid, target_lead_id uuid, target_client_id uuid,
  proposal_title text, proposal_scope text, proposal_currency text,
  proposal_valid_until date, proposal_terms text, proposal_lines jsonb
) returns uuid language plpgsql security definer set search_path=public as $$
declare created_id uuid; created_number text; next_number integer; line jsonb; line_index integer:=0;
begin
  if not public.has_workspace_role(target_workspace_id,array['owner','manager','staff']::public.workspace_role[]) then raise exception 'Not authorized'; end if;
  if target_lead_id is null and target_client_id is null then raise exception 'Lead or client is required'; end if;
  if jsonb_typeof(proposal_lines)<>'array' or jsonb_array_length(proposal_lines)=0 then raise exception 'At least one proposal item is required'; end if;
  perform pg_advisory_xact_lock(hashtextextended(target_workspace_id::text||':proposal',0));
  select coalesce(max((regexp_match(proposal_number,'([0-9]+)$'))[1]::integer),0)+1 into next_number from public.proposals where workspace_id=target_workspace_id;
  created_number:='PROP-'||extract(year from current_date)::integer||'-'||lpad(next_number::text,4,'0');
  insert into public.proposals(workspace_id,proposal_number,lead_id,client_id,title,scope,currency,valid_until,terms,created_by)
  values(target_workspace_id,created_number,target_lead_id,target_client_id,trim(proposal_title),nullif(trim(proposal_scope),''),coalesce(nullif(proposal_currency,''),'BDT'),proposal_valid_until,nullif(trim(proposal_terms),''),auth.uid()) returning id into created_id;
  for line in select * from jsonb_array_elements(proposal_lines) loop
    line_index:=line_index+1;
    insert into public.proposal_items(workspace_id,proposal_id,description,quantity,unit_price,sort_order)
    values(target_workspace_id,created_id,trim(line->>'description'),(line->>'quantity')::numeric,(line->>'unitPrice')::numeric,line_index);
  end loop;
  insert into public.audit_logs(workspace_id,actor_id,action,entity_type,entity_id,new_values) values(target_workspace_id,auth.uid(),'proposal.draft_created','proposal',created_id::text,jsonb_build_object('proposal_number',created_number,'line_count',line_index));
  return created_id;
end; $$;

create or replace function public.set_proposal_status(target_proposal_id uuid,new_status public.proposal_status)
returns void language plpgsql security definer set search_path=public as $$
declare target public.proposals%rowtype;
begin
  select * into target from public.proposals where id=target_proposal_id for update;
  if not found or not public.has_workspace_role(target.workspace_id,array['owner','manager','staff']::public.workspace_role[]) then raise exception 'Not authorized'; end if;
  update public.proposals set status=new_status,sent_at=case when new_status='sent' then coalesce(sent_at,now()) else sent_at end,accepted_at=case when new_status='accepted' then coalesce(accepted_at,now()) else accepted_at end where id=target.id;
  insert into public.audit_logs(workspace_id,actor_id,action,entity_type,entity_id,new_values) values(target.workspace_id,auth.uid(),'proposal.status_changed','proposal',target.id::text,jsonb_build_object('status',new_status));
end; $$;

revoke all on function public.create_crm_lead(uuid,text,text,text,text,text,text,numeric,timestamptz,text) from public;
revoke all on function public.convert_crm_lead(uuid) from public;
revoke all on function public.create_proposal_draft(uuid,uuid,uuid,text,text,text,date,text,jsonb) from public;
revoke all on function public.set_proposal_status(uuid,public.proposal_status) from public;
grant execute on function public.create_crm_lead(uuid,text,text,text,text,text,text,numeric,timestamptz,text) to authenticated;
grant execute on function public.convert_crm_lead(uuid) to authenticated;
grant execute on function public.create_proposal_draft(uuid,uuid,uuid,text,text,text,date,text,jsonb) to authenticated;
grant execute on function public.set_proposal_status(uuid,public.proposal_status) to authenticated;
