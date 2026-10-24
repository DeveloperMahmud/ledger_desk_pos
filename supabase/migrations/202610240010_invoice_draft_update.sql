-- Allow the Invoice Studio to edit an existing draft atomically without creating duplicates.

create or replace function public.update_invoice_draft(
  target_invoice_id uuid,
  target_client_id uuid,
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
  target public.invoices%rowtype;
  chosen_template_id uuid;
  line jsonb;
  line_kind public.catalog_kind;
  line_catalog_id uuid;
  line_index integer := 0;
begin
  select * into target from public.invoices where id = target_invoice_id for update;
  if not found then raise exception 'Invoice not found'; end if;
  if target.status <> 'draft' then raise exception 'Only draft invoices can be edited'; end if;
  if not public.has_workspace_role(target.workspace_id, array['owner','manager','accountant','staff']::public.workspace_role[]) then raise exception 'Not authorized'; end if;
  if not exists(select 1 from public.crm_clients where id = target_client_id and workspace_id = target.workspace_id) then raise exception 'Client not found in workspace'; end if;
  if jsonb_typeof(invoice_lines) <> 'array' or jsonb_array_length(invoice_lines) = 0 then raise exception 'At least one invoice line is required'; end if;
  if invoice_due_date < invoice_issue_date then raise exception 'Due date cannot be before issue date'; end if;

  select id into chosen_template_id from public.invoice_templates where workspace_id = target.workspace_id and style_key = template_style order by is_default desc, created_at limit 1;
  update public.invoices set client_id = target_client_id, template_id = chosen_template_id, title = trim(invoice_title), currency = invoice_currency, issue_date = invoice_issue_date, due_date = invoice_due_date, notes = nullif(trim(invoice_notes), ''), terms = nullif(trim(invoice_terms), '') where id = target.id;
  delete from public.invoice_items where invoice_id = target.id;

  for line in select * from jsonb_array_elements(invoice_lines)
  loop
    line_index := line_index + 1;
    line_kind := coalesce(line->>'kind', 'service')::public.catalog_kind;
    line_catalog_id := nullif(line->>'catalogItemId', '')::uuid;
    if line_kind = 'product' and not exists(select 1 from public.catalog_items where id = line_catalog_id and workspace_id = target.workspace_id and kind = 'product' and is_active) then raise exception 'A product line must reference an active workspace catalog item'; end if;
    insert into public.invoice_items(workspace_id, invoice_id, catalog_item_id, kind, description, quantity, unit, unit_price, discount, tax_rate, sort_order)
    values(target.workspace_id, target.id, case when line_kind = 'product' then line_catalog_id else null end, line_kind, trim(line->>'description'), (line->>'quantity')::numeric, coalesce(nullif(trim(line->>'unit'), ''), 'Unit'), (line->>'unitPrice')::numeric, coalesce((line->>'discount')::numeric, 0), coalesce((line->>'taxRate')::numeric, 0), line_index);
  end loop;
  perform public.recalculate_invoice(target.id);
  insert into public.audit_logs(workspace_id, actor_id, action, entity_type, entity_id, new_values) values(target.workspace_id, auth.uid(), 'invoice.draft_updated', 'invoice', target.id::text, jsonb_build_object('line_count', line_index));
  return target.id;
end;
$$;

revoke all on function public.update_invoice_draft(uuid, uuid, text, text, text, date, date, text, text, jsonb) from public;
grant execute on function public.update_invoice_draft(uuid, uuid, text, text, text, date, date, text, text, jsonb) to authenticated;
