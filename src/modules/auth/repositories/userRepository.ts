import { BaseRepository } from '../../../core/repositories/BaseRepository';

export class UserRepository extends BaseRepository<'users'> {
  constructor() {
    super('users');
  }

  async findByEmail(email: string) {
    return await this.readDb
      .selectFrom('users')
      .selectAll()
      .where('email', '=', email)
      .where('deleted_at', 'is', null)
      .executeTakeFirst();
  }
}

export const userRepository = new UserRepository();
