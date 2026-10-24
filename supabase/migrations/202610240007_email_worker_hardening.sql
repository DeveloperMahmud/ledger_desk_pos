-- Release hardening: atomically claim outbox jobs so concurrent workers cannot send duplicates.

alter table public.email_outbox
  add column locked_at timestamptz,
  add column locked_by text;

create index email_outbox_stale_lock_idx
  on public.email_outbox(locked_at)
  where status = 'sending';

create or replace function public.claim_email_outbox(claim_limit integer default 10, worker_id text default null)
returns table (
  id uuid,
  recipient_email text,
  subject text,
  html_body text,
  attempt_count integer
)
language plpgsql
security definer
set search_path = public
as $$
begin
  if worker_id is null or char_length(worker_id) < 8 then
    raise exception 'A valid worker ID is required';
  end if;

  update public.email_outbox outbox
  set status = 'failed',
      last_error = 'Worker lease expired before completion',
      scheduled_at = now(),
      locked_at = null,
      locked_by = null
  where outbox.status = 'sending'
    and outbox.locked_at < now() - interval '15 minutes';

  return query
  with candidates as (
    select outbox.id
    from public.email_outbox outbox
    where outbox.status in ('queued', 'failed')
      and outbox.scheduled_at <= now()
      and outbox.attempt_count < 5
    order by outbox.scheduled_at, outbox.created_at
    for update skip locked
    limit least(greatest(claim_limit, 1), 25)
  )
  update public.email_outbox outbox
  set status = 'sending',
      attempt_count = outbox.attempt_count + 1,
      last_error = null,
      locked_at = now(),
      locked_by = worker_id
  from candidates
  where outbox.id = candidates.id
  returning outbox.id, outbox.recipient_email, outbox.subject, outbox.html_body, outbox.attempt_count;
end;
$$;

revoke all on function public.claim_email_outbox(integer, text) from public, anon, authenticated;
grant execute on function public.claim_email_outbox(integer, text) to service_role;
