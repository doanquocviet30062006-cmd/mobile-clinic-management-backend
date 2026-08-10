import { Router } from 'express';
import { medicalRecordController } from './controllers/medicalRecordController';
import { validateRequest } from '../../core/middlewares/validateRequest';
import { requireAuth } from '../../core/middlewares/requireAuth';
import { requireRole } from '../../core/middlewares/requireRole';
import { createMedicalRecordSchema, amendMedicalRecordSchema } from './dto/medicalRecord.dto';

const medicalRecordRouter = Router();

// All medical record routes require authentication and DOCTOR role
medicalRecordRouter.use(requireAuth);
medicalRecordRouter.use(requireRole(['DOCTOR']));

medicalRecordRouter.get('/:id', medicalRecordController.getRecord);
medicalRecordRouter.post('/', validateRequest(createMedicalRecordSchema), medicalRecordController.createRecord);
medicalRecordRouter.post('/:id/amend', validateRequest(amendMedicalRecordSchema), medicalRecordController.amendRecord);

export default medicalRecordRouter;
