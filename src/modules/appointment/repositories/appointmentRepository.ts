import { BaseRepository } from '../../../core/repositories/BaseRepository';
import { sql } from 'kysely';

export class AppointmentRepository extends BaseRepository<'appointments'> {
  constructor() {
    super('appointments');
  }

  async findByPatientId(patientId: string) {
    const result = await sql`
      SELECT * FROM appointments
      WHERE patient_id = ${patientId} AND deleted_at IS NULL
      ORDER BY start_time DESC
    `.execute(this.readDb);
    return result.rows;
  }
}

export const appointmentRepository = new AppointmentRepository();
