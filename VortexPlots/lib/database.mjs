import pg from 'pg';

let pool;
export function database() {
  if (!process.env.DATABASE_URL) throw new Error('DATABASE_NOT_CONFIGURED');
  pool ??= new pg.Pool({connectionString: process.env.DATABASE_URL, max: 5, connectionTimeoutMillis: 10000});
  return pool;
}
