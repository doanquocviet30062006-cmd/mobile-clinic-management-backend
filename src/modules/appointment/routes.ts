import { Router } from 'express';
import { appointmentController } from './controllers/appointmentController';
import { validateRequest } from '../../core/middlewares/validateRequest';
import { requireAuth } from '../../core/middlewares/requireAuth';
import { requireRole } from '../../core/middlewares/requireRole';
import { requireIdempotency } from '../../core/middlewares/requireIdempotency';
import { createAppointmentSchema } from './dto/appointment.dto';

const appointmentRouter = Router();

// All appointment routes require authentication and PATIENT role
appointmentRouter.use(requireAuth);
appointmentRouter.use(requireRole(['PATIENT']));

// Book an appointment (Protected by Idempotency check)
appointmentRouter.post(
  '/',
  requireIdempotency,
  validateRequest(createAppointmentSchema),
  appointmentController.book
);

appointmentRouter.get('/', appointmentController.getMyBookings);
appointmentRouter.delete('/:id', appointmentController.cancelBooking);

export default appointmentRouter;
