import { appointmentRepository } from '../repositories/appointmentRepository';
import { patientRepository } from '../../patient/repositories/patientRepository';
import { db } from '../../../config/database';
import { sql } from 'kysely';
import { NotFoundError, ConflictError, BadRequestError, ForbiddenError } from '../../../core/errors/AppError';

export class AppointmentService {
  /**
   * Create an appointment with Pessimistic Locking to prevent overlapping slots.
   */
  async createAppointment(userId: string, data: any) {
    const patient = await patientRepository.findByUserId(userId);
    if (!patient) {
      throw new BadRequestError('You must create a patient profile before booking.');
    }

    const { doctor_id, start_time, end_time, reason } = data;

    if (new Date(start_time) >= new Date(end_time)) {
      throw new BadRequestError('start_time must be before end_time');
    }
    
    if (new Date(start_time) <= new Date()) {
      throw new BadRequestError('Cannot book an appointment in the past');
    }

    // Start a transaction for Pessimistic Locking
    return await db.transaction().execute(async (trx) => {
      // 1. SELECT ... FOR UPDATE on the doctor record to lock it.
      // This ensures no two transactions can check/book for this doctor concurrently.
      const doctorLockResult = await sql`
        SELECT id, is_active FROM doctors
        WHERE id = ${doctor_id} AND deleted_at IS NULL
        FOR UPDATE
      `.execute(trx);

      if (!doctorLockResult.rows || doctorLockResult.rows.length === 0) {
        throw new NotFoundError('Doctor not found');
      }

      if (!(doctorLockResult.rows[0] as any).is_active) {
        throw new BadRequestError('This doctor is currently not active');
      }

      // 2. Check for overlapping appointments
      // We check if any existing appointment overlaps with the requested time range.
      // Overlap condition: existing.start_time < new.end_time AND existing.end_time > new.start_time
      const overlapResult = await sql`
        SELECT id FROM appointments
        WHERE doctor_id = ${doctor_id}
          AND status IN ('PENDING', 'CONFIRMED', 'CHECKED_IN')
          AND start_time < ${end_time}
          AND end_time > ${start_time}
          AND deleted_at IS NULL
        LIMIT 1
      `.execute(trx);

      if (overlapResult.rows && overlapResult.rows.length > 0) {
        throw new ConflictError(
          'The selected time slot is already booked for this doctor. Please choose another time.',
          'SLOT_UNAVAILABLE'
        );
      }

      // 3. Insert the appointment
      const newAppointmentResult = await sql`
        INSERT INTO appointments (patient_id, doctor_id, start_time, end_time, reason, status)
        VALUES (${patient.id}, ${doctor_id}, ${start_time}, ${end_time}, ${reason}, 'PENDING')
        RETURNING *
      `.execute(trx);

      return newAppointmentResult.rows[0];
    });
  }

  /**
   * Get all appointments for the logged-in patient
   */
  async getMyAppointments(userId: string) {
    const patient = await patientRepository.findByUserId(userId);
    if (!patient) {
      throw new BadRequestError('Patient profile not found.');
    }
    return await appointmentRepository.findByPatientId(patient.id);
  }

  /**
   * Cancel an appointment (Resource ownership + 2-hour rule)
   */
  async cancelAppointment(userId: string, appointmentId: string) {
    const patient = await patientRepository.findByUserId(userId);
    if (!patient) {
      throw new BadRequestError('Patient profile not found.');
    }

    const appointmentResult = await sql`
      SELECT * FROM appointments
      WHERE id = ${appointmentId} AND deleted_at IS NULL
    `.execute(db);

    const appointment = appointmentResult.rows?.[0] as any;
    
    if (!appointment) {
      throw new NotFoundError('Appointment not found');
    }

    // Resource-level ownership check
    if (appointment.patient_id !== patient.id) {
      throw new ForbiddenError('You can only cancel your own appointments');
    }

    if (['COMPLETED', 'CANCELLED'].includes(appointment.status)) {
      throw new BadRequestError(`Cannot cancel appointment. Current status is ${appointment.status}`);
    }

    // Rule: Must be at least 2 hours before the start time
    const startTime = new Date(appointment.start_time);
    const now = new Date();
    const diffHours = (startTime.getTime() - now.getTime()) / (1000 * 60 * 60);

    if (diffHours < 2) {
      throw new BadRequestError('You can only cancel appointments at least 2 hours in advance');
    }

    // Perform the cancellation
    const updateResult = await sql`
      UPDATE appointments
      SET status = 'CANCELLED', updated_at = CURRENT_TIMESTAMP
      WHERE id = ${appointmentId}
      RETURNING *
    `.execute(db);

    return updateResult.rows[0];
  }
}

export const appointmentService = new AppointmentService();
