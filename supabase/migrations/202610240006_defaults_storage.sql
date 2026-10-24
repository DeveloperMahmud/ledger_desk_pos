-- Phase 7: workspace defaults and private storage boundaries.

create or replace function public.initialize_workspace_business_defaults(target_workspace_id uuid)
returns void language plpgsql security definer set search_path=public as $$
begin
  insert into public.invoice_sequences(workspace_id) values(target_workspace_id) on conflict do nothing;
  insert into public.invoice_templates(workspace_id,name,style_key,settings,is_default) values
    (target_workspace_id,'Modern agency','modern','{"showLogo":true,"showPaymentInstructions":true}'::jsonb,true),
    (target_workspace_id,'Classic business','classic','{"showLogo":true}'::jsonb,false),
    (target_workspace_id,'Minimal clean','minimal','{"showLogo":false}'::jsonb,false)
  on conflict do nothing;
  insert into public.ledger_accounts(workspace_id,code,name,account_type,system_key,is_system) values
    (target_workspace_id,'1100','Cash and bank','asset','cash_bank',true),(target_workspace_id,'1200','Accounts receivable','asset','accounts_receivable',true),
    (target_workspace_id,'1300','Inventory','asset','inventory',true),(target_workspace_id,'2100','Accounts payable','liability','accounts_payable',true),
    (target_workspace_id,'3100','Owner equity','equity','owner_equity',true),(target_workspace_id,'4100','Service revenue','income','service_revenue',true),
    (target_workspace_id,'4200','Product revenue','income','product_revenue',true),(target_workspace_id,'5100','Materials expense','expense','materials_expense',true),
    (target_workspace_id,'5200','Software and internet','expense','software_internet',true),(target_workspace_id,'5300','Office expense','expense','office_expense',true)
  on conflict do nothing;
  insert into public.money_accounts(workspace_id,name,kind,currency) values(target_workspace_id,'Office Cash','cash','BDT') on conflict do nothing;
  insert into public.email_templates(workspace_id,template_key,name,subject_template,html_template,text_template) values
    (target_workspace_id,'invoice_send','Invoice delivery','Invoice {{invoice_number}} from your service provider','<p>Hello {{client_name}},</p><p>Your invoice <strong>{{invoice_number}}</strong> is ready. Amount due: {{amount_due}}.</p>','Hello {{client_name}}, your invoice {{invoice_number}} is ready. Amount due: {{amount_due}}.'),
    (target_workspace_id,'payment_reminder','Payment reminder','Friendly reminder: {{invoice_number}} is due','<p>Hello {{client_name}},</p><p>This is a reminder that {{invoice_number}} has an outstanding balance of {{amount_due}}.</p>','Reminder: {{invoice_number}} has an outstanding balance of {{amount_due}}.')
  on conflict do nothing;
end; $$;

create or replace function public.create_workspace_with_owner(workspace_name text,requested_slug text,requested_business_type text default 'agency')
returns uuid language plpgsql security definer set search_path=public as $$
declare new_workspace_id uuid; clean_slug text;
begin
  if auth.uid() is null then raise exception 'Authentication required'; end if;
  if char_length(trim(workspace_name))<2 then raise exception 'Business name is required'; end if;
  clean_slug:=lower(regexp_replace(trim(requested_slug),'[^a-zA-Z0-9]+','-','g')); clean_slug:=trim(both '-' from clean_slug);
  if clean_slug='' then clean_slug:='workspace-'||substr(gen_random_uuid()::text,1,8); end if;
  insert into public.workspaces(name,slug,business_type,created_by) values(trim(workspace_name),clean_slug,requested_business_type,auth.uid()) returning id into new_workspace_id;
  insert into public.workspace_memberships(workspace_id,user_id,role) values(new_workspace_id,auth.uid(),'owner');
  insert into public.workspace_settings(workspace_id) values(new_workspace_id);
  perform public.initialize_workspace_business_defaults(new_workspace_id);
  insert into public.audit_logs(workspace_id,actor_id,action,entity_type,entity_id,new_values) values(new_workspace_id,auth.uid(),'workspace.created','workspace',new_workspace_id::text,jsonb_build_object('name',trim(workspace_name),'business_type',requested_business_type));
  return new_workspace_id;
end; $$;

revoke all on function public.initialize_workspace_business_defaults(uuid) from public;
revoke all on function public.create_workspace_with_owner(text,text,text) from public;
grant execute on function public.create_workspace_with_owner(text,text,text) to authenticated;

insert into storage.buckets(id,name,public,file_size_limit,allowed_mime_types) values
  ('workspace-files','workspace-files',false,10485760,array['application/pdf','image/jpeg','image/png','image/webp','text/csv']),
  ('brand-assets','brand-assets',false,5242880,array['image/jpeg','image/png','image/webp','image/svg+xml'])
on conflict(id) do nothing;

create or replace function public.can_access_workspace_storage(object_name text)
returns boolean language plpgsql stable security definer set search_path=public,storage as $$
declare folder_parts text[]; workspace_uuid uuid;
begin
  folder_parts:=storage.foldername(object_name); if array_length(folder_parts,1)<1 then return false; end if;
  begin workspace_uuid:=folder_parts[1]::uuid; exception when invalid_text_representation then return false; end;
  return public.is_workspace_member(workspace_uuid) or public.is_platform_admin();
end; $$;

create or replace function public.can_manage_workspace_storage(object_name text)
returns boolean language plpgsql stable security definer set search_path=public,storage as $$
declare folder_parts text[]; workspace_uuid uuid;
begin
  folder_parts:=storage.foldername(object_name); if array_length(folder_parts,1)<1 then return false; end if;
  begin workspace_uuid:=folder_parts[1]::uuid; exception when invalid_text_representation then return false; end;
  return public.has_workspace_role(workspace_uuid,array['owner','manager']::public.workspace_role[]) or public.is_platform_admin();
end; $$;

create policy "workspace files read by members" on storage.objects for select to authenticated using(bucket_id='workspace-files' and public.can_access_workspace_storage(name));
create policy "workspace files upload by staff" on storage.objects for insert to authenticated with check(bucket_id='workspace-files' and public.can_access_workspace_storage(name));
create policy "workspace files update by staff" on storage.objects for update to authenticated using(bucket_id='workspace-files' and public.can_access_workspace_storage(name)) with check(bucket_id='workspace-files' and public.can_access_workspace_storage(name));
create policy "workspace files delete by managers" on storage.objects for delete to authenticated using(bucket_id='workspace-files' and public.can_manage_workspace_storage(name));
create policy "brand assets read by members" on storage.objects for select to authenticated using(bucket_id='brand-assets' and public.can_access_workspace_storage(name));
create policy "brand assets manage by owners" on storage.objects for all to authenticated using(bucket_id='brand-assets' and public.can_manage_workspace_storage(name)) with check(bucket_id='brand-assets' and public.can_manage_workspace_storage(name));
