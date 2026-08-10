import { medicalRecordRepository } from '../repositories/medicalRecordRepository';
import { doctorRepository } from '../../doctor/repositories/doctorRepository';
import { dbRead } from '../../../config/database';
import { sql } from 'kysely';
import { NotFoundError, ForbiddenError, BadRequestError } from '../../../core/errors/AppError';

export class MedicalRecordService {
  /**
   * Verify if a doctor has rights to view/create a patient's medical record.
   * Business Rule: A doctor can only access records of patients they have had an appointment with.
   */
  private async verifyDoctorOwnership(userId: string, patientId: string): Promise<string> {
    const doctor = await doctorRepository.findByUserId(userId) as any;
    if (!doctor) {
      throw new ForbiddenError('Only registered doctors can perform this action');
    }

    const doctorId = doctor.id;

    // Check if there is any appointment between this doctor and the patient
    const appointmentCheck = await sql`
      SELECT 1 FROM appointments
      WHERE doctor_id = ${doctorId} AND patient_id = ${patientId}
      LIMIT 1
    `.execute(dbRead);

    if (!appointmentCheck.rows || appointmentCheck.rows.length === 0) {
      throw new ForbiddenError('Access Denied: You do not have an appointment with this patient', 'DOCTOR_OWNERSHIP_FAILED');
    }

    return doctorId;
  }

  async getRecord(userId: string, recordId: string) {
    const record = await medicalRecordRepository.findById(recordId) as any;
    if (!record) {
      throw new NotFoundError('Medical record not found');
    }

    // Role check: If requested by a doctor, verify ownership
    // Note: To be fully robust, we would pass the UserRole from controller and branch logic.
    // Assuming this endpoint is called by DOCTOR role.
    await this.verifyDoctorOwnership(userId, record.patient_id);

    return record;
  }

  async createRecord(userId: string, data: any) {
    const doctorId = await this.verifyDoctorOwnership(userId, data.patient_id);

    // Verify appointment exists and is ready to be completed
    const apptCheck = await sql`
      SELECT * FROM appointments 
      WHERE id = ${data.appointment_id} AND doctor_id = ${doctorId} AND patient_id = ${data.patient_id}
    `.execute(dbRead);

    const appt = apptCheck.rows[0] as any;
    if (!appt) {
      throw new NotFoundError('Valid appointment not found for this record');
    }

    if (appt.status === 'COMPLETED') {
      throw new BadRequestError('This appointment is already completed. Medical record cannot be overwritten. Create an amendment instead.');
    }

    const payload = {
      ...data,
      doctor_id: doctorId,
    };

    return await medicalRecordRepository.create(payload, data.prescriptions || []);
  }

  async amendRecord(userId: string, parentRecordId: string, data: any) {
    const oldRecord = await medicalRecordRepository.findById(parentRecordId) as any;
    if (!oldRecord) {
      throw new NotFoundError('Original medical record not found');
    }

    const doctorId = await this.verifyDoctorOwnership(userId, oldRecord.patient_id);

    if (oldRecord.doctor_id !== doctorId) {
      throw new ForbiddenError('You can only amend medical records created by you');
    }

    const payload = {
      appointment_id: oldRecord.appointment_id,
      patient_id: oldRecord.patient_id,
      doctor_id: doctorId,
      parent_record_id: parentRecordId, // Linking to the old record
      diagnosis: data.diagnosis,
      symptoms: data.symptoms,
      notes: data.notes,
    };

    return await medicalRecordRepository.create(payload, data.prescriptions || []);
  }
}

export const medicalRecordService = new MedicalRecordService();
