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
  console.log('Account and saved-record schema is ready.');
} finally {
  await connection.query('SELECT pg_advisory_unlock(72619411)');
  connection.release();
  await pool.end();
}
