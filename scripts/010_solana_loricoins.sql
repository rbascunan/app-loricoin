-- LoriCoins reales en Solana (Devnet). Idempotente: se puede ejecutar más de una vez.

-- 1) Wallet pública por hijo
alter table public.profiles add column if not exists wallet_address text;
create unique index if not exists profiles_wallet_address_key on public.profiles(wallet_address) where wallet_address is not null;

-- 2) Clave secreta cifrada (AES-256-GCM). RLS sin políticas: solo el servidor (service_role) puede leerla.
create table if not exists public.child_wallet_secrets (
  child_id uuid primary key references public.profiles(id) on delete cascade,
  public_key text not null unique,
  ciphertext text not null,
  iv text not null,
  auth_tag text not null,
  created_at timestamptz not null default now()
);
alter table public.child_wallet_secrets enable row level security;
revoke all on public.child_wallet_secrets from anon, authenticated;

-- 3) Estado 'pagando' y datos del pago en tareas
alter table public.tasks
  add column if not exists tx_signature text,
  add column if not exists paid_at timestamptz,
  add column if not exists error_message text,
  add column if not exists payment_started_at timestamptz,
  add column if not exists payment_last_valid_height bigint;

do $$
declare c record;
begin
  for c in
    select conname from pg_constraint
    where conrelid = 'public.tasks'::regclass and contype = 'c' and pg_get_constraintdef(oid) ilike '%status%'
  loop
    execute format('alter table public.tasks drop constraint %I', c.conname);
  end loop;
end $$;

alter table public.tasks add constraint tasks_status_check
  check (status in ('pendiente', 'terminada', 'pagando', 'pagada', 'rechazada'));

create index if not exists tasks_family_minted_idx
  on public.tasks(parent_id, payment_started_at) where status in ('pagando', 'pagada');

-- 4) Firma de la quema en los descuentos
alter table public.penalties add column if not exists tx_signature text;

-- 5) wallet_address solo se puede cambiar desde el servidor
create or replace function public.protect_profile_sensitive_columns()
returns trigger
language plpgsql
set search_path to 'public'
as $function$
begin
  if coalesce(auth.role(), '') = 'service_role' or current_user in ('postgres', 'supabase_admin') then
    return new;
  end if;
  if tg_op = 'INSERT' then
    new.balance := 0; new.lori_coins := 0; new.savings := 0;
    new.parent_id := null; new.username := null; new.role := 'parent';
    new.wallet_address := null;
    return new;
  end if;
  if new.balance is distinct from old.balance
     or new.lori_coins is distinct from old.lori_coins
     or new.savings is distinct from old.savings
     or new.role is distinct from old.role
     or new.parent_id is distinct from old.parent_id
     or new.username is distinct from old.username
     or new.wallet_address is distinct from old.wallet_address
     or new.id is distinct from old.id then
    raise exception 'No se permite modificar campos protegidos del perfil';
  end if;
  return new;
end;
$function$;

-- 6) Reserva atómica del pago: candado por familia + límite diario + paso a 'pagando'
create or replace function public.claim_task_payment(p_task uuid, p_parent uuid, p_daily_limit integer)
returns text
language plpgsql
security definer
set search_path to 'public'
as $function$
declare
  t public.tasks%rowtype;
  v_minted integer;
begin
  perform 1 from public.profiles where id = p_parent and role = 'parent' for update;
  if not found then return 'not_claimable'; end if;

  select * into t from public.tasks where id = p_task and parent_id = p_parent for update;
  if not found then return 'not_claimable'; end if;

  if not (
    t.status = 'terminada'
    or (t.status = 'pagando' and t.payment_started_at < now() - interval '2 minutes')
  ) then
    return 'not_claimable';
  end if;

  select coalesce(sum(reward), 0) into v_minted
  from public.tasks
  where parent_id = p_parent
    and id <> p_task
    and status in ('pagando', 'pagada')
    and payment_started_at >= date_trunc('day', now());

  if v_minted + t.reward > p_daily_limit then return 'daily_limit'; end if;

  update public.tasks
  set status = 'pagando', payment_started_at = now(), tx_signature = null,
      payment_last_valid_height = null, error_message = null
  where id = p_task;

  return 'ok';
end;
$function$;

revoke all on function public.claim_task_payment(uuid, uuid, integer) from public, anon, authenticated;
grant execute on function public.claim_task_payment(uuid, uuid, integer) to service_role;

-- 7) Descuento: el monto ya viene quemado on-chain; se registra con su firma y se ajusta la caché
drop function if exists public.apply_penalty(uuid, uuid, text, integer);

create or replace function public.apply_penalty(
  p_parent uuid, p_child uuid, p_reason text, p_amount integer, p_signature text
)
returns table (id uuid, amount integer, balance integer)
language plpgsql
security definer
set search_path to 'public'
as $function$
declare
  v_balance integer;
  v_id uuid;
begin
  if p_amount is null or p_amount < 1 or p_amount > 50 then raise exception 'INVALID_AMOUNT'; end if;
  if p_reason is null or char_length(trim(p_reason)) not between 1 and 120 then raise exception 'INVALID_REASON'; end if;

  update public.profiles
  set lori_coins = greatest(coalesce(lori_coins, 0) - p_amount, 0)
  where profiles.id = p_child and role = 'child' and parent_id = p_parent
  returning lori_coins into v_balance;

  if v_balance is null then raise exception 'CHILD_NOT_FOUND'; end if;

  insert into public.penalties (parent_id, child_id, reason, amount, tx_signature)
  values (p_parent, p_child, trim(p_reason), p_amount, p_signature)
  returning penalties.id into v_id;

  return query select v_id, p_amount, v_balance;
end;
$function$;

revoke all on function public.apply_penalty(uuid, uuid, text, integer, text) from public, anon, authenticated;
grant execute on function public.apply_penalty(uuid, uuid, text, integer, text) to service_role;
