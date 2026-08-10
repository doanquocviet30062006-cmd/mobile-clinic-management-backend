import { Request, Response } from 'express';
import { appointmentService } from '../services/appointmentService';

export class AppointmentController {
  async book(req: Request, res: Response) {
    const userId = req.user!.userId;
    const result = await appointmentService.createAppointment(userId, req.body);
    res.status(201).json({ success: true, data: result });
  }

  async getMyBookings(req: Request, res: Response) {
    const userId = req.user!.userId;
    const result = await appointmentService.getMyAppointments(userId);
    res.json({ success: true, data: result });
  }

  async cancelBooking(req: Request, res: Response) {
    const userId = req.user!.userId;
    const appointmentId = req.params.id as string;
    
    const result = await appointmentService.cancelAppointment(userId, appointmentId);
    res.json({ success: true, message: 'Appointment cancelled successfully', data: result });
  }
}

export const appointmentController = new AppointmentController();
