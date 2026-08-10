import { BaseRepository } from '../../../core/repositories/BaseRepository';
import { sql } from 'kysely';

export class FileRepository extends BaseRepository<'files'> {
  constructor() {
    super('files');
  }

  async findById(id: string) {
    const result = await sql`
      SELECT * FROM files
      WHERE id = ${id} AND deleted_at IS NULL
    `.execute(this.readDb);
    return result.rows[0];
  }
}

export const fileRepository = new FileRepository();
