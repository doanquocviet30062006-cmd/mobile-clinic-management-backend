import { Router } from 'express';
import { doctorController } from './controllers/doctorController';
import { validateRequest } from '../../core/middlewares/validateRequest';
import { requireAuth } from '../../core/middlewares/requireAuth';
import { requireRole } from '../../core/middlewares/requireRole';
import { createDoctorSchema, updateDoctorSchema } from './dto/doctor.dto';

const doctorRouter = Router();

// Public routes (Cache aside pattern applied)
doctorRouter.get('/', doctorController.getAllActive);
doctorRouter.get('/:id', doctorController.getById);

// Doctor only routes
doctorRouter.use(requireAuth);
doctorRouter.use(requireRole(['DOCTOR']));

doctorRouter.get('/me/profile', doctorController.getProfile);
doctorRouter.post('/me/profile', validateRequest(createDoctorSchema), doctorController.createProfile);
doctorRouter.put('/me/profile', validateRequest(updateDoctorSchema), doctorController.updateProfile);

export default doctorRouter;
