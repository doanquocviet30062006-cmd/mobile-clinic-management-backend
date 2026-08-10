import { fileRepository } from '../repositories/fileRepository';
import { storageService } from '../../../core/services/storageService';
import { doctorRepository } from '../../doctor/repositories/doctorRepository';
import { dbRead } from '../../../config/database';
import { sql } from 'kysely';
import { v4 as uuidv4 } from 'uuid';
import { NotFoundError, ForbiddenError, BadRequestError } from '../../../core/errors/AppError';

export class FileService {
  /**
   * Check if a doctor is allowed to access files attached to a medical record.
   */
  private async checkMedicalRecordAccess(userId: string, medicalRecordId: string): Promise<boolean> {
    const doctor = await doctorRepository.findByUserId(userId) as any;
    if (!doctor) return false;

    const medRecordResult = await sql`
      SELECT patient_id FROM medical_records
      WHERE id = ${medicalRecordId}
    `.execute(dbRead);
    const medRecord = medRecordResult.rows[0] as any;
    if (!medRecord) return false;

    // Verify if doctor has an appointment with this patient
    const apptCheck = await sql`
      SELECT 1 FROM appointments
      WHERE doctor_id = ${doctor.id} AND patient_id = ${medRecord.patient_id}
      LIMIT 1
    `.execute(dbRead);

    return (apptCheck.rows && apptCheck.rows.length > 0);
  }

  /**
   * Request a Presigned URL for Upload (PUT)
   */
  async requestUploadUrl(userId: string, data: any) {
    if (data.entity_type === 'medical_record') {
      const hasAccess = await this.checkMedicalRecordAccess(userId, data.entity_id);
      if (!hasAccess) {
        throw new ForbiddenError('You do not have permission to upload files to this medical record');
      }
    }

    const fileExt = data.original_name.split('.').pop();
    const s3Key = `${data.entity_type}s/${data.entity_id}/${uuidv4()}.${fileExt}`;

    const newFile = await fileRepository.create({
      user_id: userId,
      entity_type: data.entity_type,
      entity_id: data.entity_id,
      s3_key: s3Key,
      original_name: data.original_name,
      content_type: data.content_type,
      size_bytes: data.size_bytes || null,
    }) as any;

    const presignedUrl = await storageService.generateUploadUrl(s3Key, data.content_type);

    return {
      file_id: newFile.id,
      upload_url: presignedUrl,
      expires_in: '15m'
    };
  }

  /**
   * Request a Presigned URL for Download (GET)
   */
  async requestDownloadUrl(userId: string, fileId: string) {
    const file = await fileRepository.findById(fileId) as any;
    if (!file) {
      throw new NotFoundError('File not found');
    }

    // Ownership & Authorization Check
    let hasAccess = false;
    
    // Rule 1: The user who uploaded it can always download it
    if (file.user_id === userId) {
      hasAccess = true;
    } 
    // Rule 2: If it belongs to a medical record, check doctor access
    else if (file.entity_type === 'medical_record') {
      hasAccess = await this.checkMedicalRecordAccess(userId, file.entity_id);
    }

    if (!hasAccess) {
      throw new ForbiddenError('Access Denied. You do not have permission to view this file');
    }

    const presignedUrl = await storageService.generateDownloadUrl(file.s3_key);

    return {
      file_id: file.id,
      download_url: presignedUrl,
      original_name: file.original_name,
      expires_in: '5m'
    };
  }
}

export const fileService = new FileService();
