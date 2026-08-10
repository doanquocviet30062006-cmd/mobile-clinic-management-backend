import { BaseRepository } from '../../../core/repositories/BaseRepository';
import { sql } from 'kysely';

export class DoctorRepository extends BaseRepository<'doctors'> {
  constructor() {
    super('doctors');
  }

  async findByUserId(userId: string) {
    const result = await sql`
      SELECT * FROM doctors
      WHERE user_id = ${userId} AND deleted_at IS NULL
    `.execute(this.readDb);
    return result.rows[0];
  }

  async findAllActive() {
    const result = await sql`
      SELECT * FROM doctors
      WHERE is_active = true AND deleted_at IS NULL
    `.execute(this.readDb);
    return result.rows;
  }
}

export const doctorRepository = new DoctorRepository();
