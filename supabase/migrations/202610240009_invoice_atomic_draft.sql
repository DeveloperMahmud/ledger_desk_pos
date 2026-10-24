-- Release hardening: create invoice header and all line items in one transaction.

create or replace function public.create_invoice_draft(
  target_workspace_id uuid,
  target_client_id uuid,
  target_project_id uuid,
  template_style text,
  invoice_title text,
  invoice_currency text,
  invoice_issue_date date,
  invoice_due_date date,
  invoice_notes text,
  invoice_terms text,
  invoice_lines jsonb
)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  sequence_row public.invoice_sequences%rowtype;
  chosen_template_id uuid;
  created_invoice_id uuid;
  created_number text;
  line jsonb;
  line_kind public.catalog_kind;
  line_catalog_id uuid;
  line_index integer := 0;
begin
  if auth.uid() is null then raise exception 'Authentication required'; end if;
  if not public.has_workspace_role(target_workspace_id, array['owner','manager','accountant','staff']::public.workspace_role[]) then
    raise exception 'Not authorized';
  end if;
  if char_length(trim(coalesce(invoice_title, ''))) < 2 then raise exception 'Invoice title is required'; end if;
  if invoice_due_date is not null and invoice_issue_date is not null and invoice_due_date < invoice_issue_date then raise exception 'Due date cannot be before issue date'; end if;
  if jsonb_typeof(invoice_lines) <> 'array' or jsonb_array_length(invoice_lines) = 0 then raise exception 'At least one invoice line is required'; end if;
  if not exists(select 1 from public.crm_clients where id = target_client_id and workspace_id = target_workspace_id) then raise exception 'Client not found in workspace'; end if;
  if target_project_id is not null and not exists(select 1 from public.projects where id = target_project_id and workspace_id = target_workspace_id) then raise exception 'Project not found in workspace'; end if;

  insert into public.invoice_sequences(workspace_id) values(target_workspace_id)
  on conflict(workspace_id) do nothing;
  select * into sequence_row from public.invoice_sequences where workspace_id = target_workspace_id for update;
  if sequence_row.reset_yearly and sequence_row.sequence_year <> extract(year from coalesce(invoice_issue_date, current_date))::integer then
    update public.invoice_sequences set next_number = 1, sequence_year = extract(year from coalesce(invoice_issue_date, current_date))::integer where workspace_id = target_workspace_id
    returning * into sequence_row;
  end if;
  created_number := sequence_row.prefix || '-' || sequence_row.sequence_year || '-' || lpad(sequence_row.next_number::text, 4, '0');
  update public.invoice_sequences set next_number = next_number + 1, updated_at = now() where workspace_id = target_workspace_id;

  select id into chosen_template_id from public.invoice_templates
  where workspace_id = target_workspace_id and style_key = template_style
  order by is_default desc, created_at limit 1;

  insert into public.invoices(workspace_id, invoice_number, client_id, project_id, template_id, title, currency, issue_date, due_date, notes, terms, created_by)
  values(target_workspace_id, created_number, target_client_id, target_project_id, chosen_template_id, trim(invoice_title), coalesce(nullif(trim(invoice_currency), ''), 'BDT'), invoice_issue_date, invoice_due_date, nullif(trim(invoice_notes), ''), nullif(trim(invoice_terms), ''), auth.uid())
  returning id into created_invoice_id;

  for line in select * from jsonb_array_elements(invoice_lines)
  loop
    line_index := line_index + 1;
    line_kind := coalesce(line->>'kind', 'service')::public.catalog_kind;
    line_catalog_id := nullif(line->>'catalogItemId', '')::uuid;
    if line_kind = 'product' and not exists(select 1 from public.catalog_items where id = line_catalog_id and workspace_id = target_workspace_id and kind = 'product' and is_active) then
      raise exception 'A product line must reference an active workspace catalog item';
    end if;
    insert into public.invoice_items(workspace_id, invoice_id, catalog_item_id, kind, description, quantity, unit, unit_price, discount, tax_rate, sort_order)
    values(target_workspace_id, created_invoice_id, case when line_kind = 'product' then line_catalog_id else null end, line_kind, trim(line->>'description'), (line->>'quantity')::numeric, coalesce(nullif(trim(line->>'unit'), ''), 'Unit'), (line->>'unitPrice')::numeric, coalesce((line->>'discount')::numeric, 0), coalesce((line->>'taxRate')::numeric, 0), line_index);
  end loop;

  perform public.recalculate_invoice(created_invoice_id);
  insert into public.audit_logs(workspace_id, actor_id, action, entity_type, entity_id, new_values)
  values(target_workspace_id, auth.uid(), 'invoice.draft_created', 'invoice', created_invoice_id::text, jsonb_build_object('invoice_number', created_number, 'line_count', line_index));
  return created_invoice_id;
end;
$$;

revoke all on function public.create_invoice_draft(uuid, uuid, uuid, text, text, text, date, date, text, text, jsonb) from public;
grant execute on function public.create_invoice_draft(uuid, uuid, uuid, text, text, text, date, date, text, text, jsonb) to authenticated;
