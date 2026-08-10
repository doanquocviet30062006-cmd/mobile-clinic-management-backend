import { patientRepository } from '../repositories/patientRepository';
import { auditRepository } from '../repositories/auditRepository';
import { encryptionService } from '../../../core/services/encryptionService';
import { db } from '../../../config/database';
import { NotFoundError, ConflictError } from '../../../core/errors/AppError';

export class PatientService {
  /**
   * Decrypts the encrypted fields of a patient record
   */
  private decryptPatientFields(patient: any) {
    if (!patient) return patient;
    return {
      ...patient,
      full_name: encryptionService.decrypt(patient.full_name_encrypted),
      phone: encryptionService.decrypt(patient.phone_encrypted),
      id_card: encryptionService.decrypt(patient.id_card_encrypted),
      full_name_encrypted: undefined,
      phone_encrypted: undefined,
      id_card_encrypted: undefined,
    };
  }

  async getProfile(userId: string) {
    const patient = await patientRepository.findByUserId(userId);
    if (!patient) {
      throw new NotFoundError('Patient profile not found');
    }
    return this.decryptPatientFields(patient);
  }

  async createProfile(userId: string, data: any) {
    const existing = await patientRepository.findByUserId(userId);
    if (existing) {
      throw new ConflictError('Patient profile already exists for this user');
    }

    // Encrypt PII
    const dbPayload = {
      user_id: userId,
      full_name_encrypted: encryptionService.encrypt(data.full_name),
      phone_encrypted: encryptionService.encrypt(data.phone),
      id_card_encrypted: encryptionService.encrypt(data.id_card),
      dob: data.dob,
      gender: data.gender,
      address: data.address,
    };

    // Use transaction to ensure both Profile and Audit log are created together
    const result = await db.transaction().execute(async (trx) => {
      const newPatient = await trx
        .insertInto('patients')
        .values(dbPayload)
        .returningAll()
        .executeTakeFirstOrThrow();

      await auditRepository.log(
        trx,
        'patient',
        newPatient.id,
        'CREATE',
        null,
        dbPayload, // We log the encrypted state to prevent PII leak in audit logs
        userId
      );

      return newPatient;
    });

    return this.decryptPatientFields(result);
  }

  async updateProfile(userId: string, data: any) {
    const existing = await patientRepository.findByUserId(userId);
    if (!existing) {
      throw new NotFoundError('Patient profile not found');
    }

    const updatePayload: any = {};
    if (data.full_name) updatePayload.full_name_encrypted = encryptionService.encrypt(data.full_name);
    if (data.phone) updatePayload.phone_encrypted = encryptionService.encrypt(data.phone);
    if (data.id_card) updatePayload.id_card_encrypted = encryptionService.encrypt(data.id_card);
    if (data.dob) updatePayload.dob = data.dob;
    if (data.gender) updatePayload.gender = data.gender;
    if (data.address) updatePayload.address = data.address;

    updatePayload.updated_at = new Date();

    const result = await db.transaction().execute(async (trx) => {
      const updatedPatient = await trx
        .updateTable('patients')
        .set(updatePayload)
        .where('id', '=', existing.id)
        .returningAll()
        .executeTakeFirstOrThrow();

      await auditRepository.log(
        trx,
        'patient',
        existing.id,
        'UPDATE',
        existing,
        updatedPatient,
        userId
      );

      return updatedPatient;
    });

    return this.decryptPatientFields(result);
  }
}

export const patientService = new PatientService();
