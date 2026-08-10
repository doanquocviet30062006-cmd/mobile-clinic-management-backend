import { sql } from 'kysely';
import { db, dbRead } from '../../../config/database';

export class MedicalRecordRepository {
  /**
   * Insert a medical record (Create or Amend).
   * Intentionally omitting Update and Delete methods to enforce immutable design.
   */
  async create(data: any, prescriptions: any[]) {
    return await db.transaction().execute(async (trx) => {
      // 1. Create medical record
      const newRecord = await sql`
        INSERT INTO medical_records (appointment_id, patient_id, doctor_id, parent_record_id, diagnosis, symptoms, notes)
        VALUES (${data.appointment_id}, ${data.patient_id}, ${data.doctor_id}, ${data.parent_record_id || null}, ${data.diagnosis}, ${data.symptoms}, ${data.notes || null})
        RETURNING *
      `.execute(trx);

      const recordId = (newRecord.rows[0] as any).id;

      // 2. Create prescriptions if any
      if (prescriptions && prescriptions.length > 0) {
        for (const rx of prescriptions) {
          await sql`
            INSERT INTO prescriptions (medical_record_id, medication_name, dosage, instructions)
            VALUES (${recordId}, ${rx.medication_name}, ${rx.dosage}, ${rx.instructions})
          `.execute(trx);
        }
      }

      // 3. Mark appointment as COMPLETED if it's a new record (not an amendment)
      if (!data.parent_record_id) {
        await sql`
          UPDATE appointments
          SET status = 'COMPLETED', updated_at = CURRENT_TIMESTAMP
          WHERE id = ${data.appointment_id}
        `.execute(trx);
      }

      return newRecord.rows[0];
    });
  }

  async findById(id: string) {
    const recordResult = await sql`
      SELECT * FROM medical_records
      WHERE id = ${id}
    `.execute(dbRead);

    const record = recordResult.rows[0] as any;
    if (!record) return null;

    const rxResult = await sql`
      SELECT * FROM prescriptions
      WHERE medical_record_id = ${id}
    `.execute(dbRead);

    record.prescriptions = rxResult.rows;
    return record;
  }
}

export const medicalRecordRepository = new MedicalRecordRepository();
