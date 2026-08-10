import { z } from 'zod';

export const createAppointmentSchema = z.object({
  body: z.object({
    doctor_id: z.string().uuid('Invalid doctor ID'),
    start_time: z.string().datetime('Invalid start time. Must be ISO 8601 string'),
    end_time: z.string().datetime('Invalid end time. Must be ISO 8601 string'),
    reason: z.string().min(1, 'Reason for visit is required'),
  }),
});
