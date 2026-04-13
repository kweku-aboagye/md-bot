import pg from 'pg';
import { drizzle } from 'drizzle-orm/node-postgres';
import * as schema from './schema';

const pool = new pg.Pool({
  connectionString: process.env.DATABASE_URL,
});

export const db = drizzle(pool, { schema });

export async function ensureInternalTables() {
  await pool.query(`
    create table if not exists email_history (
      id text primary key,
      run_id text not null,
      module text not null,
      kind text not null,
      trigger text not null,
      recipient text not null,
      subject text not null,
      target_sunday text,
      sent_at timestamptz not null,
      message_id text,
      payload jsonb not null default '{}'::jsonb
    )
  `);

  await pool.query(`
    create index if not exists email_history_sent_at_idx
    on email_history (sent_at desc)
  `);
}
