/**
 * Auth Module - Domain Model
 * Contains business rules (e.g., password policy, token validation).
 *
 * Will be implemented in Task 2.
 */

export interface User {
  id: string;
  email: string;
  password_hash: string;
  role: 'ADMIN' | 'DOCTOR' | 'PATIENT' | 'STAFF';
  is_active: boolean;
  created_at: Date;
  updated_at: Date;
  deleted_at: Date | null;
}
