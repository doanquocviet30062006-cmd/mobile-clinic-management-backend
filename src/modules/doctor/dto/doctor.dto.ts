import { z } from 'zod';

export const createDoctorSchema = z.object({
  body: z.object({
    specialty: z.string().min(1, 'Specialty is required'),
    qualifications: z.string().min(1, 'Qualifications are required'),
    experience_years: z.number().min(0).default(0),
    bio: z.string().optional(),
  }),
});

export const updateDoctorSchema = z.object({
  body: z.object({
    specialty: z.string().min(1).optional(),
    qualifications: z.string().min(1).optional(),
    experience_years: z.number().min(0).optional(),
    bio: z.string().optional(),
    is_active: z.boolean().optional(),
  }),
});
