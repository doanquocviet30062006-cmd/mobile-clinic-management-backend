import { Request, Response } from 'express';
import { patientService } from '../services/patientService';

export class PatientController {
  async getProfile(req: Request, res: Response) {
    const userId = req.user!.userId;
    const result = await patientService.getProfile(userId);
    res.json({ success: true, data: result });
  }

  async createProfile(req: Request, res: Response) {
    const userId = req.user!.userId;
    const result = await patientService.createProfile(userId, req.body);
    res.status(201).json({ success: true, data: result });
  }

  async updateProfile(req: Request, res: Response) {
    const userId = req.user!.userId;
    const result = await patientService.updateProfile(userId, req.body);
    res.json({ success: true, data: result });
  }
}

export const patientController = new PatientController();
