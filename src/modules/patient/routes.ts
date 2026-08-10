import { Router } from 'express';
import { patientController } from './controllers/patientController';
import { validateRequest } from '../../core/middlewares/validateRequest';
import { requireAuth } from '../../core/middlewares/requireAuth';
import { requireRole } from '../../core/middlewares/requireRole';
import { createPatientSchema, updatePatientSchema } from './dto/patient.dto';

const patientRouter = Router();

// All patient routes require authentication and PATIENT role
patientRouter.use(requireAuth);
patientRouter.use(requireRole(['PATIENT']));

patientRouter.get('/profile', patientController.getProfile);
patientRouter.post('/profile', validateRequest(createPatientSchema), patientController.createProfile);
patientRouter.put('/profile', validateRequest(updatePatientSchema), patientController.updateProfile);

export default patientRouter;
