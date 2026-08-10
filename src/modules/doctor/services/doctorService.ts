import { doctorRepository } from '../repositories/doctorRepository';
import { redisCache } from '../../../config/redis';
import { NotFoundError, ConflictError } from '../../../core/errors/AppError';

const CACHE_TTL = 3600; // 1 hour

export class DoctorService {
  /**
   * Helper to invalidate cache for a specific doctor
   */
  private async invalidateCache(doctorId: string, userId: string) {
    await redisCache.del(`doctor:id:${doctorId}`);
    await redisCache.del(`doctor:user:${userId}`);
    await redisCache.del('doctors:active');
  }

  async getProfile(userId: string) {
    const cacheKey = `doctor:user:${userId}`;
    const cached = await redisCache.get(cacheKey);
    if (cached) {
      return JSON.parse(cached);
    }

    const doctor = await doctorRepository.findByUserId(userId);
    if (!doctor) {
      throw new NotFoundError('Doctor profile not found');
    }

    await redisCache.setex(cacheKey, CACHE_TTL, JSON.stringify(doctor));
    return doctor;
  }

  async getById(id: string) {
    const cacheKey = `doctor:id:${id}`;
    const cached = await redisCache.get(cacheKey);
    if (cached) {
      return JSON.parse(cached);
    }

    const doctor = await doctorRepository.findById(id);
    await redisCache.setex(cacheKey, CACHE_TTL, JSON.stringify(doctor));
    return doctor;
  }

  async getAllActive() {
    const cacheKey = 'doctors:active';
    const cached = await redisCache.get(cacheKey);
    if (cached) {
      return JSON.parse(cached);
    }

    const doctors = await doctorRepository.findAllActive();
    await redisCache.setex(cacheKey, CACHE_TTL, JSON.stringify(doctors));
    return doctors;
  }

  async createProfile(userId: string, data: any) {
    const existing = await doctorRepository.findByUserId(userId);
    if (existing) {
      throw new ConflictError('Doctor profile already exists for this user');
    }

    const newDoctor = await doctorRepository.create({
      user_id: userId,
      specialty: data.specialty,
      qualifications: data.qualifications,
      experience_years: data.experience_years,
      bio: data.bio,
    });

    await this.invalidateCache(newDoctor.id, userId);
    return newDoctor;
  }

  async updateProfile(userId: string, data: any) {
    const existing = await doctorRepository.findByUserId(userId) as any;
    if (!existing) {
      throw new NotFoundError('Doctor profile not found');
    }

    const updatedDoctor = await doctorRepository.update(existing.id as string, data);
    await this.invalidateCache(existing.id as string, userId);
    
    return updatedDoctor;
  }
}

export const doctorService = new DoctorService();
