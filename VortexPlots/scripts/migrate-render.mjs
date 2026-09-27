import {getMigrations} from 'better-auth/db/migration';
import {authOptions} from '../lib/auth-server.mjs';
import {database} from '../lib/database.mjs';

const pool = database();
const connection = await pool.connect();
try {
  await connection.query('SELECT pg_advisory_lock(72619411)');
  const migration = await getMigrations(authOptions());
  await migration.runMigrations();
  await connection.query(`CREATE TABLE IF NOT EXISTS saved_records (
    key TEXT PRIMARY KEY,
    owner_id TEXT NOT NULL REFERENCES "user"(id) ON DELETE CASCADE,
    value JSONB NOT NULL,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
  )`);
  await connection.query('CREATE INDEX IF NOT EXISTS saved_records_owner ON saved_records(owner_id)');
  await connection.query(`CREATE TABLE IF NOT EXISTS reviews (
    id UUID PRIMARY KEY, owner_id TEXT NOT NULL UNIQUE REFERENCES "user"(id) ON DELETE CASCADE,
    rating SMALLINT NOT NULL CHECK(rating BETWEEN 1 AND 5), title TEXT NOT NULL, description TEXT NOT NULL,
    category TEXT NOT NULL DEFAULT 'General', status TEXT NOT NULL DEFAULT 'pending' CHECK(status IN ('pending','approved','rejected')),
    moderation_note TEXT, created_at TIMESTAMPTZ NOT NULL DEFAULT now(), updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
  ); CREATE INDEX IF NOT EXISTS reviews_status ON reviews(status,created_at);
  CREATE TABLE IF NOT EXISTS review_reports (
    review_id UUID NOT NULL REFERENCES reviews(id) ON DELETE CASCADE,
    owner_id TEXT NOT NULL REFERENCES "user"(id) ON DELETE CASCADE, reason TEXT NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(), PRIMARY KEY(review_id,owner_id)
  ); CREATE TABLE IF NOT EXISTS action_limits (
    scope TEXT NOT NULL, actor TEXT NOT NULL REFERENCES "user"(id) ON DELETE CASCADE,
    window_start TIMESTAMPTZ NOT NULL, count INTEGER NOT NULL, PRIMARY KEY(scope,actor)
  );`);
  console.log('Account, research and review schema is ready.');
} finally {
  await connection.query('SELECT pg_advisory_unlock(72619411)');
  connection.release();
  await pool.end();
}
