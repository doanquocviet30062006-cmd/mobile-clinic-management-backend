import { Pool } from 'pg';
import { Kysely, PostgresDialect } from 'kysely';
import { env } from './env';

// This is the global Database schema. 
// Members will extend this interface when they create their tables.
export interface Database {
  // e.g. users: UserTable;
  // e.g. doctors: DoctorTable;
}

const dialect = new PostgresDialect({
  pool: new Pool({
    connectionString: env.DATABASE_URL,
    max: 10,
  }),
});

// Database instance to be used across the application
export const db = new Kysely<Database>({
  dialect,
});
