import { BaseRepository } from '../../../core/repositories/BaseRepository';

export class PatientRepository extends BaseRepository<'patients'> {
  constructor() {
    super('patients');
  }

  async findByUserId(userId: string) {
    return await this.readDb
      .selectFrom('patients')
      .selectAll()
      .where('user_id', '=', userId)
      .where('deleted_at', 'is', null)
      .executeTakeFirst();
  }
}

export const patientRepository = new PatientRepository();
