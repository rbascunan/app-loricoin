const pg = (await import("/tmp/mig/node_modules/pg/lib/index.js")).default

const sql = `
create table if not exists public.penalties (
  id uuid primary key default gen_random_uuid(),
  parent_id uuid not null references public.profiles(id) on delete cascade,
  child_id uuid not null references public.profiles(id) on delete cascade,
  reason text not null check (char_length(reason) between 1 and 120),
  amount integer not null check (amount between 1 and 50),
  created_at timestamptz not null default now()
);
create index if not exists penalties_child_idx on public.penalties(child_id, created_at desc);
create index if not exists penalties_parent_idx on public.penalties(parent_id, created_at desc);
alter table public.penalties enable row level security;
drop policy if exists "penalties_select_own" on public.penalties;
create policy "penalties_select_own" on public.penalties
  for select to authenticated
  using (auth.uid() = parent_id or auth.uid() = child_id);
revoke insert, update, delete on public.penalties from anon, authenticated;
grant select on public.penalties to authenticated;

create or replace function public.apply_penalty(p_parent uuid, p_child uuid, p_reason text, p_amount integer)
returns table (penalty_id uuid, deducted integer, new_balance integer)
language plpgsql
security definer
set search_path to 'public'
as $fn$
declare
  v_balance integer;
  v_deduct integer;
  v_id uuid;
begin
  if p_amount is null or p_amount < 1 or p_amount > 50 then
    raise exception 'INVALID_AMOUNT';
  end if;
  if p_reason is null or char_length(trim(p_reason)) not between 1 and 120 then
    raise exception 'INVALID_REASON';
  end if;

  select coalesce(pr.lori_coins, 0) into v_balance
  from public.profiles pr
  where pr.id = p_child and pr.role = 'child' and pr.parent_id = p_parent
  for update;

  if not found then raise exception 'CHILD_NOT_FOUND'; end if;

  v_deduct := least(p_amount, v_balance);
  if v_deduct < 1 then raise exception 'NO_BALANCE'; end if;

  update public.profiles set lori_coins = v_balance - v_deduct where id = p_child;

  insert into public.penalties (parent_id, child_id, reason, amount)
  values (p_parent, p_child, trim(p_reason), v_deduct)
  returning id into v_id;

  return query select v_id, v_deduct, v_balance - v_deduct;
end;
$fn$;

revoke all on function public.apply_penalty(uuid, uuid, text, integer) from public, anon, authenticated;
grant execute on function public.apply_penalty(uuid, uuid, text, integer) to service_role;
`

const url = process.env.POSTGRES_URL_NON_POOLING.replace(/[?&]sslmode=[^&]*/, "")
const client = new pg.Client({ connectionString: url, ssl: { rejectUnauthorized: false } })
await client.connect()
try {
  await client.query("begin")
  await client.query(sql)
  await client.query("commit")
  const check = await client.query(
    "select (select count(*) from information_schema.tables where table_schema='public' and table_name='penalties') as tabla, (select count(*) from pg_proc where proname='apply_penalty') as funcion, (select pg_get_function_identity_arguments(oid) from pg_proc where proname='add_lori_coins' limit 1) as add_coins_args",
  )
  console.log("OK", check.rows[0])
} catch (e) {
  await client.query("rollback")
  console.error("FAIL", e.message)
  process.exitCode = 1
} finally {
  await client.end()
}
