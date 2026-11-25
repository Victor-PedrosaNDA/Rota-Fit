// Testes do banco com PGlite — sem Docker, sem internet
// npm run test:db
import { PGlite } from '@electric-sql/pglite';
import { readFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import assert from 'node:assert/strict';
import { describe, it, before } from 'node:test';

const __dirname = dirname(fileURLToPath(import.meta.url));
const schema = readFileSync(join(__dirname, '../schema.sql'), 'utf8');

// UIDs fictícios
const ALICE = '00000000-0000-0000-0000-000000000001';
const BOB   = '00000000-0000-0000-0000-000000000002';

// Monta banco limpo e injeta schema adaptado para PGlite (sem auth.*)
async function makeDb(currentUserId = null) {
  const db = new PGlite();

  // Stub das funções do Supabase Auth
  await db.exec(`
    create schema if not exists auth;
    create or replace function auth.uid() returns uuid as $$
      select current_setting('app.user_id', true)::uuid;
    $$ language sql stable;
  `);

  // Schema sem os GRANTs (PGlite não usa roles)
  const cleanSchema = schema
    .replace(/grant .+;/gi, '')
    .replace(/alter table runs enable row level security;/, '')
    .replace(/create policy .+\n.+\n.+;/g, '');

  await db.exec(cleanSchema);

  // Habilita RLS manualmente
  await db.exec('alter table runs enable row level security;');

  // Recria políticas
  await db.exec(`
    create policy "select own runs" on runs for select using (auth.uid() = user_id);
    create policy "insert own runs" on runs for insert with check (auth.uid() = user_id);
    create policy "delete own runs" on runs for delete using (auth.uid() = user_id);
  `);

  if (currentUserId) {
    await db.exec(`select set_config('app.user_id', '${currentUserId}', false);`);
  }

  return db;
}

// Insere uma corrida de teste como usuário específico
async function insertRun(db, userId, overrides = {}) {
  await db.exec(`select set_config('app.user_id', '${userId}', false);`);
  const run = {
    started_at: overrides.started_at ?? '2024-06-01T08:00:00Z',
    ended_at:   overrides.ended_at   ?? '2024-06-01T08:30:00Z',
    distance_meters:  overrides.distance_meters  ?? 5000,
    duration_seconds: overrides.duration_seconds ?? 1800,
    avg_pace_sec_per_km: overrides.avg_pace_sec_per_km ?? 360,
    route: overrides.route ?? '[]',
    spotify_track_name: overrides.spotify_track_name ?? null,
  };
  await db.exec(`
    insert into runs (user_id, started_at, ended_at, distance_meters, duration_seconds, avg_pace_sec_per_km, route, spotify_track_name)
    values (
      '${userId}',
      '${run.started_at}',
      '${run.ended_at}',
      ${run.distance_meters},
      ${run.duration_seconds},
      ${run.avg_pace_sec_per_km ?? 'null'},
      '${run.route}'::jsonb,
      ${run.spotify_track_name ? `'${run.spotify_track_name}'` : 'null'}
    );
  `);
}

describe('RLS — privacidade', () => {
  it('Alice só vê as próprias corridas', async () => {
    const db = await makeDb();
    await insertRun(db, ALICE);
    await insertRun(db, BOB);

    await db.exec(`select set_config('app.user_id', '${ALICE}', false);`);
    const { rows } = await db.query('select * from runs;');
    assert.equal(rows.length, 1);
    assert.equal(rows[0].user_id, ALICE);
  });

  it('Bob só vê as próprias corridas', async () => {
    const db = await makeDb();
    await insertRun(db, ALICE);
    await insertRun(db, BOB);

    await db.exec(`select set_config('app.user_id', '${BOB}', false);`);
    const { rows } = await db.query('select * from runs;');
    assert.equal(rows.length, 1);
    assert.equal(rows[0].user_id, BOB);
  });

  it('INSERT com user_id errado é rejeitado', async () => {
    const db = await makeDb(ALICE);
    await assert.rejects(
      () => db.exec(`
        insert into runs (user_id, started_at, ended_at, distance_meters, duration_seconds, route)
        values ('${BOB}', now(), now() + interval '30m', 5000, 1800, '[]'::jsonb);
      `),
      /violates row-level security/i
    );
  });

  it('Usuário anônimo não vê nenhuma corrida', async () => {
    const db = await makeDb();
    await insertRun(db, ALICE);

    // sem set_config, auth.uid() retorna null
    await db.exec(`select set_config('app.user_id', '', false);`);
    const { rows } = await db.query('select * from runs;');
    assert.equal(rows.length, 0);
  });

  it('Alice não pode excluir corrida de Bob', async () => {
    const db = await makeDb();
    await insertRun(db, BOB);

    await db.exec(`select set_config('app.user_id', '${ALICE}', false);`);
    await db.exec(`delete from runs where user_id = '${BOB}';`);

    // corrida do Bob ainda existe
    await db.exec(`select set_config('app.user_id', '${BOB}', false);`);
    const { rows } = await db.query('select * from runs;');
    assert.equal(rows.length, 1);
  });
});

describe('Restrições de dados', () => {
  it('Distância negativa é rejeitada', async () => {
    const db = await makeDb(ALICE);
    await assert.rejects(
      () => insertRun(db, ALICE, { distance_meters: -1 }),
      /check/i
    );
  });

  it('Duração zero é rejeitada', async () => {
    const db = await makeDb(ALICE);
    await assert.rejects(
      () => insertRun(db, ALICE, { duration_seconds: 0 }),
      /check/i
    );
  });

  it('ended_at antes de started_at é aceito (sem constraint — validar na app)', async () => {
    // O schema atual não tem constraint de ordem de datas;
    // esse teste documenta a ausência deliberada.
    const db = await makeDb(ALICE);
    await assert.doesNotReject(() =>
      insertRun(db, ALICE, {
        started_at: '2024-06-01T09:00:00Z',
        ended_at:   '2024-06-01T08:00:00Z',
      })
    );
  });

  it('avg_pace_sec_per_km pode ser null', async () => {
    const db = await makeDb(ALICE);
    await assert.doesNotReject(() =>
      insertRun(db, ALICE, { avg_pace_sec_per_km: null })
    );
  });

  it('route aceita JSONB válido', async () => {
    const db = await makeDb(ALICE);
    const route = JSON.stringify([{ lat: -15.78, lng: -47.93, t: 1717228800000 }]);
    await assert.doesNotReject(() =>
      insertRun(db, ALICE, { route })
    );
  });
});

describe('weekly_stats()', () => {
  it('Retorna zeros quando não há corridas na semana', async () => {
    const db = await makeDb(ALICE);
    const { rows } = await db.query('select * from weekly_stats();');
    assert.equal(Number(rows[0].run_count), 0);
    assert.equal(Number(rows[0].total_distance_meters), 0);
  });

  it('Soma apenas as corridas da semana atual', async () => {
    const db = await makeDb(ALICE);

    // Corrida desta semana
    const thisWeek = new Date().toISOString();
    await insertRun(db, ALICE, {
      started_at: thisWeek,
      ended_at:   thisWeek,
      distance_meters: 3000,
      duration_seconds: 900,
    });

    // Corrida antiga (semana passada)
    await insertRun(db, ALICE, {
      started_at: '2020-01-01T08:00:00Z',
      ended_at:   '2020-01-01T08:30:00Z',
      distance_meters: 10000,
      duration_seconds: 3600,
    });

    await db.exec(`select set_config('app.user_id', '${ALICE}', false);`);
    const { rows } = await db.query('select * from weekly_stats();');
    assert.equal(Number(rows[0].run_count), 1);
    assert.equal(Number(rows[0].total_distance_meters), 3000);
  });

  it('Usuário anônimo não obtém resultado de weekly_stats', async () => {
    const db = await makeDb();
    await insertRun(db, ALICE, { distance_meters: 5000, duration_seconds: 1500 });

    await db.exec(`select set_config('app.user_id', '', false);`);
    const { rows } = await db.query('select * from weekly_stats();');
    assert.equal(Number(rows[0].run_count), 0);
  });
});
