import { z } from 'zod';

export const createPatientSchema = z.object({
  body: z.object({
    full_name: z.string().min(1, 'Full name is required'),
    phone: z.string().min(10, 'Valid phone number is required'),
    id_card: z.string().min(9, 'ID card is required'),
    dob: z.string().date('Invalid date format (YYYY-MM-DD)'),
    gender: z.enum(['MALE', 'FEMALE', 'OTHER']),
    address: z.string().optional(),
  }),
});

export const updatePatientSchema = z.object({
  body: z.object({
    full_name: z.string().min(1).optional(),
    phone: z.string().min(10).optional(),
    id_card: z.string().min(9).optional(),
    dob: z.string().date().optional(),
    gender: z.enum(['MALE', 'FEMALE', 'OTHER']).optional(),
    address: z.string().optional(),
  }),
});
