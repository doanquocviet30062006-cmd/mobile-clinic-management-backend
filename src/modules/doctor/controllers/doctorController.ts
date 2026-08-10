import { Request, Response } from 'express';
import { doctorService } from '../services/doctorService';

export class DoctorController {
  async getProfile(req: Request, res: Response) {
    const userId = req.user!.userId;
    const result = await doctorService.getProfile(userId);
    res.json({ success: true, data: result });
  }

  async getById(req: Request, res: Response) {
    const id = req.params.id as string;
    const result = await doctorService.getById(id);
    res.json({ success: true, data: result });
  }

  async getAllActive(req: Request, res: Response) {
    const result = await doctorService.getAllActive();
    res.json({ success: true, data: result });
  }

  async createProfile(req: Request, res: Response) {
    const userId = req.user!.userId;
    const result = await doctorService.createProfile(userId, req.body);
    res.status(201).json({ success: true, data: result });
  }

  async updateProfile(req: Request, res: Response) {
    const userId = req.user!.userId;
    const result = await doctorService.updateProfile(userId, req.body);
    res.json({ success: true, data: result });
  }
}

export const doctorController = new DoctorController();
