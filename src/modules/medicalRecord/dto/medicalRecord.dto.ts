import { z } from 'zod';

export const createMedicalRecordSchema = z.object({
  body: z.object({
    appointment_id: z.string().uuid('Invalid appointment ID'),
    patient_id: z.string().uuid('Invalid patient ID'),
    diagnosis: z.string().min(1, 'Diagnosis is required'),
    symptoms: z.string().min(1, 'Symptoms are required'),
    notes: z.string().optional(),
    prescriptions: z.array(z.object({
      medication_name: z.string(),
      dosage: z.string(),
      instructions: z.string(),
    })).optional(),
  }),
});

export const amendMedicalRecordSchema = z.object({
  body: z.object({
    diagnosis: z.string().min(1, 'Diagnosis is required'),
    symptoms: z.string().min(1, 'Symptoms are required'),
    notes: z.string().optional(),
    prescriptions: z.array(z.object({
      medication_name: z.string(),
      dosage: z.string(),
      instructions: z.string(),
    })).optional(),
  }),
});
