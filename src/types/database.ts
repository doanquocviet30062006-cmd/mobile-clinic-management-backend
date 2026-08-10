import { Generated, ColumnType } from 'kysely';

export type UserRole = 'ADMIN' | 'DOCTOR' | 'PATIENT' | 'STAFF';

export interface UsersTable {
  id: Generated<string>;
  email: string;
  password_hash: string;
  role: UserRole;
  is_active: Generated<boolean>;
  created_at: ColumnType<Date, string | undefined, never>;
  updated_at: ColumnType<Date, string | undefined, string | undefined>;
  deleted_at: ColumnType<Date | null, string | undefined, string | undefined>;
}

export interface PatientsTable {
  id: Generated<string>;
  user_id: string;
  full_name_encrypted: string;
  phone_encrypted: string;
  id_card_encrypted: string;
  dob: string | Date;
  gender: string;
  address: string | null;
  created_at: ColumnType<Date, string | undefined, never>;
  updated_at: ColumnType<Date, string | undefined, string | undefined>;
  deleted_at: ColumnType<Date | null, string | undefined, string | undefined>;
}

export interface DoctorsTable {
  id: Generated<string>;
  user_id: string;
  specialty: string;
  qualifications: string;
  experience_years: number;
  bio: string | null;
  is_active: Generated<boolean>;
  rating_avg: Generated<number>;
  rating_count: Generated<number>;
  created_at: ColumnType<Date, string | undefined, never>;
  updated_at: ColumnType<Date, string | undefined, string | undefined>;
  deleted_at: ColumnType<Date | null, string | undefined, string | undefined>;
}

export interface AuditLogsTable {
  id: Generated<string>;
  entity_type: string;
  entity_id: string;
  action: string;
  old_data: any | null; // JSONB
  new_data: any | null; // JSONB
  performed_by: string | null;
  created_at: ColumnType<Date, string | undefined, never>;
}

export type AppointmentStatus = 'PENDING' | 'CONFIRMED' | 'CHECKED_IN' | 'COMPLETED' | 'CANCELLED';

export interface AppointmentsTable {
  id: Generated<string>;
  patient_id: string;
  doctor_id: string;
  start_time: string | Date;
  end_time: string | Date;
  status: Generated<AppointmentStatus>;
  reason: string;
  notes: string | null;
  created_at: ColumnType<Date, string | undefined, never>;
  updated_at: ColumnType<Date, string | undefined, string | undefined>;
  deleted_at: ColumnType<Date | null, string | undefined, string | undefined>;
}

export interface MedicalRecordsTable {
  id: Generated<string>;
  appointment_id: string;
  patient_id: string;
  doctor_id: string;
  parent_record_id: string | null;
  diagnosis: string;
  symptoms: string;
  notes: string | null;
  created_at: ColumnType<Date, string | undefined, never>;
}

export interface PrescriptionsTable {
  id: Generated<string>;
  medical_record_id: string;
  medication_name: string;
  dosage: string;
  instructions: string;
  created_at: ColumnType<Date, string | undefined, never>;
}

export interface FilesTable {
  id: Generated<string>;
  user_id: string;
  entity_type: string;
  entity_id: string;
  s3_key: string;
  original_name: string;
  content_type: string;
  size_bytes: number | null;
  created_at: ColumnType<Date, string | undefined, never>;
  deleted_at: ColumnType<Date | null, string | undefined, string | undefined>;
}

export interface NotificationsTable {
  id: Generated<string>;
  user_id: string;
  type: string;
  title: string;
  body: string;
  entity_type: string | null;
  entity_id: string | null;
  is_read: Generated<boolean>;
  created_at: ColumnType<Date, string | undefined, never>;
}

export interface DB {
  users: UsersTable;
  patients: PatientsTable;
  doctors: DoctorsTable;
  audit_logs: AuditLogsTable;
  appointments: AppointmentsTable;
  medical_records: MedicalRecordsTable;
  prescriptions: PrescriptionsTable;
  files: FilesTable;
  notifications: NotificationsTable;
}
