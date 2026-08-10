import { Kysely, sql } from 'kysely';
import { DB } from '../../types/database';
import { db, dbRead } from '../../config/database';
import { NotFoundError } from '../errors/AppError';

/**
 * Base Repository
 *
 * Provides standard CRUD operations for all domain repositories.
 * - READ operations go through `readDb` (Replica)
 * - WRITE operations go through `writeDb` (Primary)
 * - Only soft-delete is supported (sets `deleted_at` column)
 *
 * Note: We use `sql` raw helper for generic update/delete operations
 * because Kysely's strict type system requires concrete table types.
 * Domain-specific repositories should override these methods with
 * properly typed implementations once their DB interfaces are defined.
 */
export abstract class BaseRepository<TableName extends keyof DB & string> {
  protected readonly tableName: TableName;
  protected readonly writeDb: Kysely<DB>;
  protected readonly readDb: Kysely<DB>;

  constructor(tableName: TableName) {
    this.tableName = tableName;
    this.writeDb = db;
    this.readDb = dbRead;
  }

  async findById(id: string): Promise<any> {
    const result = await sql`
      SELECT * FROM ${sql.table(this.tableName)}
      WHERE id = ${id} AND deleted_at IS NULL
    `.execute(this.readDb);

    if (!result.rows || result.rows.length === 0) {
      throw new NotFoundError(`${this.tableName} with id ${id} not found`);
    }
    return result.rows[0];
  }

  async findAll(): Promise<any[]> {
    const result = await sql`
      SELECT * FROM ${sql.table(this.tableName)}
      WHERE deleted_at IS NULL
    `.execute(this.readDb);
    
    return result.rows;
  }

  async create(data: any): Promise<any> {
    const result = await this.writeDb
      .insertInto(this.tableName)
      .values(data)
      .returningAll()
      .executeTakeFirstOrThrow();
    return result;
  }

  async update(id: string, data: Record<string, any>): Promise<any> {
    const fields = { ...data, updated_at: new Date() };
    const result = await sql`
      UPDATE ${sql.table(this.tableName)}
      SET ${sql.join(
        Object.entries(fields).map(
          ([key, value]) => sql`${sql.ref(key)} = ${value}`
        ),
        sql`, `
      )}
      WHERE id = ${id} AND deleted_at IS NULL
      RETURNING *
    `.execute(this.writeDb);

    if (!result.rows || result.rows.length === 0) {
      throw new NotFoundError(`${this.tableName} with id ${id} not found`);
    }
    return result.rows[0];
  }

  async softDelete(id: string): Promise<void> {
    const result = await sql`
      UPDATE ${sql.table(this.tableName)}
      SET deleted_at = NOW()
      WHERE id = ${id} AND deleted_at IS NULL
    `.execute(this.writeDb);

    if (!result.numAffectedRows || result.numAffectedRows === BigInt(0)) {
      throw new NotFoundError(`${this.tableName} with id ${id} not found`);
    }
  }
}
