-- Phase 2: catalog, stock ledger, balances and audited adjustments.

create type public.catalog_kind as enum ('product', 'service');
create type public.stock_movement_kind as enum (
  'opening',
  'purchase',
  'sale',
  'return_in',
  'return_out',
  'adjustment_in',
  'adjustment_out',
  'damage'
);

create table public.product_categories (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references public.workspaces(id) on delete cascade,
  name text not null check (char_length(trim(name)) between 1 and 80),
  created_at timestamptz not null default now(),
  unique (workspace_id, name)
);

create table public.units (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references public.workspaces(id) on delete cascade,
  name text not null check (char_length(trim(name)) between 1 and 40),
  symbol text not null check (char_length(trim(symbol)) between 1 and 12),
  created_at timestamptz not null default now(),
  unique (workspace_id, name),
  unique (workspace_id, symbol)
);

create table public.catalog_items (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references public.workspaces(id) on delete cascade,
  category_id uuid references public.product_categories(id) on delete set null,
  unit_id uuid references public.units(id) on delete set null,
  kind public.catalog_kind not null default 'product',
  name text not null check (char_length(trim(name)) between 2 and 160),
  sku text not null check (char_length(trim(sku)) between 1 and 60),
  description text,
  image_path text,
  purchase_cost numeric(18,4) not null default 0 check (purchase_cost >= 0),
  selling_price numeric(18,4) not null default 0 check (selling_price >= 0),
  low_stock_at numeric(18,4) not null default 0 check (low_stock_at >= 0),
  tracks_stock boolean generated always as (kind = 'product') stored,
  is_active boolean not null default true,
  created_by uuid not null references auth.users(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (workspace_id, sku)
);

create table public.stock_balances (
  workspace_id uuid not null references public.workspaces(id) on delete cascade,
  item_id uuid not null references public.catalog_items(id) on delete cascade,
  current_quantity numeric(18,4) not null default 0 check (current_quantity >= 0),
  updated_at timestamptz not null default now(),
  primary key (workspace_id, item_id)
);

create table public.stock_movements (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references public.workspaces(id) on delete cascade,
  item_id uuid not null references public.catalog_items(id) on delete restrict,
  kind public.stock_movement_kind not null,
  quantity numeric(18,4) not null check (quantity > 0),
  signed_quantity numeric(18,4) not null,
  balance_after numeric(18,4) not null check (balance_after >= 0),
  reference text not null,
  source_type text,
  source_id uuid,
  note text,
  idempotency_key text not null,
  created_by uuid not null references auth.users(id),
  created_at timestamptz not null default now(),
  unique (workspace_id, idempotency_key)
);

create table public.stock_adjustments (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references public.workspaces(id) on delete cascade,
  item_id uuid not null references public.catalog_items(id) on delete restrict,
  movement_id uuid not null unique references public.stock_movements(id) on delete restrict,
  reason text not null check (char_length(trim(reason)) between 3 and 300),
  created_by uuid not null references auth.users(id),
  created_at timestamptz not null default now()
);

create index catalog_items_workspace_name_idx on public.catalog_items(workspace_id, name);
create index stock_movements_item_created_idx on public.stock_movements(item_id, created_at desc);
create index stock_movements_workspace_created_idx on public.stock_movements(workspace_id, created_at desc);

create trigger catalog_items_set_updated_at before update on public.catalog_items
for each row execute function public.set_updated_at();

create or replace function public.stock_kind_multiplier(kind public.stock_movement_kind)
returns integer
language sql
immutable
as $$
  select case
    when kind in ('opening', 'purchase', 'return_in', 'adjustment_in') then 1
    else -1
  end;
$$;

create or replace function public.post_stock_movement(
  target_workspace_id uuid,
  target_item_id uuid,
  movement_kind public.stock_movement_kind,
  movement_quantity numeric,
  movement_reference text,
  movement_note text,
  movement_idempotency_key text,
  movement_source_type text default null,
  movement_source_id uuid default null
)
returns table (movement_id uuid, new_balance numeric)
language plpgsql
security definer
set search_path = public
as $$
declare
  item_kind public.catalog_kind;
  existing_movement public.stock_movements%rowtype;
  current_balance numeric;
  delta numeric;
  created_movement_id uuid;
begin
  if auth.uid() is null then raise exception 'Authentication required'; end if;
  if not public.has_workspace_role(target_workspace_id, array['owner', 'manager', 'staff']::public.workspace_role[]) then
    raise exception 'Insufficient inventory permission';
  end if;
  if movement_quantity is null or movement_quantity <= 0 then
    raise exception 'Quantity must be greater than zero';
  end if;
  if nullif(trim(movement_reference), '') is null then
    raise exception 'Reference is required';
  end if;
  if nullif(trim(movement_idempotency_key), '') is null then
    raise exception 'Idempotency key is required';
  end if;

  select * into existing_movement
  from public.stock_movements
  where workspace_id = target_workspace_id and idempotency_key = movement_idempotency_key;

  if found then
    return query select existing_movement.id, existing_movement.balance_after;
    return;
  end if;

  select kind into item_kind
  from public.catalog_items
  where id = target_item_id and workspace_id = target_workspace_id and is_active
  for update;

  if not found then raise exception 'Active catalog item not found'; end if;
  if item_kind <> 'product' then raise exception 'Services do not track stock'; end if;

  insert into public.stock_balances (workspace_id, item_id, current_quantity)
  values (target_workspace_id, target_item_id, 0)
  on conflict (workspace_id, item_id) do nothing;

  select current_quantity into current_balance
  from public.stock_balances
  where workspace_id = target_workspace_id and item_id = target_item_id
  for update;

  delta := movement_quantity * public.stock_kind_multiplier(movement_kind);
  if current_balance + delta < 0 then
    raise exception 'Insufficient stock: current %, requested change %', current_balance, delta;
  end if;

  update public.stock_balances
  set current_quantity = current_balance + delta, updated_at = now()
  where workspace_id = target_workspace_id and item_id = target_item_id;

  insert into public.stock_movements (
    workspace_id, item_id, kind, quantity, signed_quantity, balance_after,
    reference, source_type, source_id, note, idempotency_key, created_by
  ) values (
    target_workspace_id, target_item_id, movement_kind, movement_quantity, delta, current_balance + delta,
    trim(movement_reference), movement_source_type, movement_source_id, nullif(trim(movement_note), ''),
    trim(movement_idempotency_key), auth.uid()
  ) returning id into created_movement_id;

  insert into public.audit_logs (workspace_id, actor_id, action, entity_type, entity_id, new_values)
  values (
    target_workspace_id,
    auth.uid(),
    'stock.movement_posted',
    'catalog_item',
    target_item_id::text,
    jsonb_build_object(
      'movement_id', created_movement_id,
      'kind', movement_kind,
      'quantity', movement_quantity,
      'balance_after', current_balance + delta,
      'reference', trim(movement_reference)
    )
  );

  return query select created_movement_id, current_balance + delta;
end;
$$;

create or replace function public.post_stock_adjustment(
  target_workspace_id uuid,
  target_item_id uuid,
  direction text,
  adjustment_quantity numeric,
  adjustment_reason text,
  adjustment_reference text,
  adjustment_idempotency_key text
)
returns table (adjustment_id uuid, movement_id uuid, new_balance numeric)
language plpgsql
security definer
set search_path = public
as $$
declare
  chosen_kind public.stock_movement_kind;
  posted record;
  created_adjustment_id uuid;
begin
  if direction not in ('in', 'out') then raise exception 'Direction must be in or out'; end if;
  if char_length(trim(coalesce(adjustment_reason, ''))) < 3 then raise exception 'Adjustment reason is required'; end if;

  chosen_kind := case when direction = 'in' then 'adjustment_in' else 'adjustment_out' end;

  select * into posted from public.post_stock_movement(
    target_workspace_id,
    target_item_id,
    chosen_kind,
    adjustment_quantity,
    adjustment_reference,
    adjustment_reason,
    adjustment_idempotency_key,
    'stock_adjustment',
    null
  );

  select id into created_adjustment_id
  from public.stock_adjustments
  where movement_id = posted.movement_id;

  if created_adjustment_id is null then
    insert into public.stock_adjustments (workspace_id, item_id, movement_id, reason, created_by)
    values (target_workspace_id, target_item_id, posted.movement_id, trim(adjustment_reason), auth.uid())
    returning id into created_adjustment_id;
  end if;

  return query select created_adjustment_id, posted.movement_id, posted.new_balance;
end;
$$;

revoke all on function public.post_stock_movement(uuid, uuid, public.stock_movement_kind, numeric, text, text, text, text, uuid) from public;
grant execute on function public.post_stock_movement(uuid, uuid, public.stock_movement_kind, numeric, text, text, text, text, uuid) to authenticated;
revoke all on function public.post_stock_adjustment(uuid, uuid, text, numeric, text, text, text) from public;
grant execute on function public.post_stock_adjustment(uuid, uuid, text, numeric, text, text, text) to authenticated;

alter table public.product_categories enable row level security;
alter table public.units enable row level security;
alter table public.catalog_items enable row level security;
alter table public.stock_balances enable row level security;
alter table public.stock_movements enable row level security;
alter table public.stock_adjustments enable row level security;

create policy "categories read by members" on public.product_categories for select to authenticated
using (public.is_workspace_member(workspace_id));
create policy "categories manage by inventory staff" on public.product_categories for all to authenticated
using (public.has_workspace_role(workspace_id, array['owner', 'manager', 'staff']::public.workspace_role[]))
with check (public.has_workspace_role(workspace_id, array['owner', 'manager', 'staff']::public.workspace_role[]));

create policy "units read by members" on public.units for select to authenticated
using (public.is_workspace_member(workspace_id));
create policy "units manage by inventory staff" on public.units for all to authenticated
using (public.has_workspace_role(workspace_id, array['owner', 'manager', 'staff']::public.workspace_role[]))
with check (public.has_workspace_role(workspace_id, array['owner', 'manager', 'staff']::public.workspace_role[]));

create policy "catalog read by members" on public.catalog_items for select to authenticated
using (public.is_workspace_member(workspace_id));
create policy "catalog create by inventory staff" on public.catalog_items for insert to authenticated
with check (
  created_by = auth.uid()
  and public.has_workspace_role(workspace_id, array['owner', 'manager', 'staff']::public.workspace_role[])
);
create policy "catalog update by inventory staff" on public.catalog_items for update to authenticated
using (public.has_workspace_role(workspace_id, array['owner', 'manager', 'staff']::public.workspace_role[]))
with check (public.has_workspace_role(workspace_id, array['owner', 'manager', 'staff']::public.workspace_role[]));

create policy "balances read by members" on public.stock_balances for select to authenticated
using (public.is_workspace_member(workspace_id));
create policy "movements read by members" on public.stock_movements for select to authenticated
using (public.is_workspace_member(workspace_id));
create policy "adjustments read by privileged members" on public.stock_adjustments for select to authenticated
using (public.has_workspace_role(workspace_id, array['owner', 'manager', 'accountant', 'staff']::public.workspace_role[]));

-- No client insert/update/delete policies exist for balances, movements or adjustments.
-- Those records can only be posted through the audited transaction functions above.
