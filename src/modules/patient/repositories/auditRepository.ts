import { Kysely } from 'kysely';
import { DB } from '../../../types/database';
import { db } from '../../../config/database';

export class AuditRepository {
  /**
   * Insert an audit log entry.
   * Can accept an existing transaction Kysely instance to ensure atomicity.
   */
  async log(
    trx: Kysely<DB>,
    entity_type: string,
    entity_id: string,
    action: 'CREATE' | 'UPDATE' | 'DELETE',
    old_data: any | null,
    new_data: any | null,
    performed_by: string
  ): Promise<void> {
    await trx
      .insertInto('audit_logs')
      .values({
        entity_type,
        entity_id,
        action,
        old_data: old_data ? JSON.stringify(old_data) : null,
        new_data: new_data ? JSON.stringify(new_data) : null,
        performed_by,
      })
      .execute();
  }
}

export const auditRepository = new AuditRepository();
