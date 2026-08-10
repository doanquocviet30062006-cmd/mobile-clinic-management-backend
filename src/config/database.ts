import { Pool } from 'pg';
import { Kysely, PostgresDialect } from 'kysely';
import type { DB } from '../types/database';

// ─── Primary Pool (WRITE operations) ────────────────────────────
export const primaryPool = new Pool({
  host: process.env.DB_PRIMARY_HOST,
  port: Number(process.env.DB_PRIMARY_PORT),
  database: process.env.DB_PRIMARY_NAME,
  user: process.env.DB_PRIMARY_USER,
  password: process.env.DB_PRIMARY_PASSWORD,
  max: Number(process.env.DB_PRIMARY_POOL_MAX) || 20,
});

// ─── Replica Pool (READ operations) ─────────────────────────────
export const replicaPool = new Pool({
  host: process.env.DB_REPLICA_HOST || process.env.DB_PRIMARY_HOST,
  port: Number(process.env.DB_REPLICA_PORT || process.env.DB_PRIMARY_PORT),
  database: process.env.DB_REPLICA_NAME || process.env.DB_PRIMARY_NAME,
  user: process.env.DB_REPLICA_USER || process.env.DB_PRIMARY_USER,
  password: process.env.DB_REPLICA_PASSWORD || process.env.DB_PRIMARY_PASSWORD,
  max: Number(process.env.DB_REPLICA_POOL_MAX) || 20,
});

// ─── Kysely Instances ───────────────────────────────────────────

/** Kysely instance for WRITE operations (Primary) */
export const db = new Kysely<DB>({
  dialect: new PostgresDialect({ pool: primaryPool }),
});

/** Kysely instance for READ operations (Replica) */
export const dbRead = new Kysely<DB>({
  dialect: new PostgresDialect({ pool: replicaPool }),
});
