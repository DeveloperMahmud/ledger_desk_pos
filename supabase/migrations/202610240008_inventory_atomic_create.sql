-- Release hardening: create a catalog item and its optional opening stock atomically.

create or replace function public.create_catalog_item(
  target_workspace_id uuid,
  item_kind text,
  item_name text,
  item_sku text,
  category_name text,
  unit_name text,
  purchase_cost numeric,
  selling_price numeric,
  low_stock_at numeric,
  opening_stock numeric default 0
)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  created_item_id uuid;
  category_id uuid;
  unit_id uuid;
begin
  if auth.uid() is null then raise exception 'Authentication required'; end if;
  if not public.has_workspace_role(target_workspace_id, array['owner', 'manager', 'staff']::public.workspace_role[]) then
    raise exception 'Insufficient inventory permission';
  end if;
  if item_kind not in ('product', 'service') then raise exception 'Invalid catalog kind'; end if;
  if char_length(trim(coalesce(item_name, ''))) < 2 then raise exception 'Item name is required'; end if;
  if nullif(trim(coalesce(item_sku, '')), '') is null then raise exception 'SKU is required'; end if;
  if least(purchase_cost, selling_price, low_stock_at, opening_stock) < 0 then raise exception 'Amounts cannot be negative'; end if;

  insert into public.product_categories(workspace_id, name)
  values(target_workspace_id, coalesce(nullif(trim(category_name), ''), 'General'))
  on conflict(workspace_id, name) do update set name = excluded.name
  returning id into category_id;

  insert into public.units(workspace_id, name, symbol)
  values(target_workspace_id, coalesce(nullif(trim(unit_name), ''), 'pcs'), coalesce(nullif(trim(unit_name), ''), 'pcs'))
  on conflict(workspace_id, name) do update set symbol = excluded.symbol
  returning id into unit_id;

  insert into public.catalog_items(
    workspace_id, category_id, unit_id, kind, name, sku,
    purchase_cost, selling_price, low_stock_at, created_by
  ) values (
    target_workspace_id, category_id, unit_id, item_kind::public.catalog_kind, trim(item_name), trim(item_sku),
    purchase_cost, selling_price, low_stock_at, auth.uid()
  ) returning id into created_item_id;

  if item_kind = 'product' and opening_stock > 0 then
    perform public.post_stock_movement(
      target_workspace_id,
      created_item_id,
      'opening'::public.stock_movement_kind,
      opening_stock,
      'Opening balance',
      'Created with catalog item',
      'catalog-create-' || created_item_id::text,
      'catalog_setup',
      created_item_id
    );
  end if;

  return created_item_id;
end;
$$;

revoke all on function public.create_catalog_item(uuid, text, text, text, text, text, numeric, numeric, numeric, numeric) from public;
grant execute on function public.create_catalog_item(uuid, text, text, text, text, text, numeric, numeric, numeric, numeric) to authenticated;
