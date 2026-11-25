-- RotaFit — schema do banco de dados

-- Tabela principal de corridas
create table if not exists runs (
  id               uuid primary key default gen_random_uuid(),
  user_id          uuid not null references auth.users(id) on delete cascade,
  started_at       timestamptz not null,
  ended_at         timestamptz not null,
  distance_meters  numeric not null check (distance_meters >= 0),
  duration_seconds int     not null check (duration_seconds > 0),
  avg_pace_sec_per_km numeric,
  route            jsonb   not null default '[]',
  spotify_track_name text,
  created_at       timestamptz not null default now()
);

-- Índices
create index if not exists runs_user_id_idx on runs (user_id);
create index if not exists runs_started_at_idx on runs (started_at desc);

-- RLS: habilita segurança por linha
alter table runs enable row level security;

-- Política: cada usuário só vê as próprias corridas
create policy "select own runs"
  on runs for select
  using (auth.uid() = user_id);

-- Política: cada usuário só insere corridas com seu próprio user_id
create policy "insert own runs"
  on runs for insert
  with check (auth.uid() = user_id);

-- Política: cada usuário só exclui as próprias corridas
create policy "delete own runs"
  on runs for delete
  using (auth.uid() = user_id);

-- Função: estatísticas da semana atual para o usuário autenticado
create or replace function weekly_stats()
returns table (
  total_distance_meters numeric,
  total_duration_seconds bigint,
  run_count             bigint
)
language sql
security definer
as $$
  select
    coalesce(sum(distance_meters), 0) as total_distance_meters,
    coalesce(sum(duration_seconds), 0) as total_duration_seconds,
    count(*)                           as run_count
  from runs
  where user_id = auth.uid()
    and started_at >= date_trunc('week', now())
    and started_at <  date_trunc('week', now()) + interval '1 week';
$$;

-- Grants para usuários autenticados
grant select, insert, delete on runs to authenticated;
grant execute on function weekly_stats() to authenticated;
