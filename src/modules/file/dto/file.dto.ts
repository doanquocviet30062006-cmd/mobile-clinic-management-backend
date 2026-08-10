import { z } from 'zod';

const ALLOWED_MIME = ['application/pdf', 'image/jpeg', 'image/png'] as const;

export const requestUploadSchema = z.object({
  body: z.object({
    entity_type: z.enum(['medical_record']),
    entity_id: z.string().uuid('Invalid entity ID'),
    original_name: z.string().min(1, 'Original filename is required'),
    content_type: z.enum(['application/pdf', 'image/jpeg', 'image/png']),
    size_bytes: z.number().max(10 * 1024 * 1024, 'File size must not exceed 10MB').optional(),
  }),
});
