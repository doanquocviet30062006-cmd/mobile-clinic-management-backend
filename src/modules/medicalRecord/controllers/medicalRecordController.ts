import { Request, Response } from 'express';
import { medicalRecordService } from '../services/medicalRecordService';

export class MedicalRecordController {
  async getRecord(req: Request, res: Response) {
    const userId = req.user!.userId;
    const id = req.params.id as string;
    const result = await medicalRecordService.getRecord(userId, id);
    res.json({ success: true, data: result });
  }

  async createRecord(req: Request, res: Response) {
    const userId = req.user!.userId;
    const result = await medicalRecordService.createRecord(userId, req.body);
    res.status(201).json({ success: true, data: result });
  }

  async amendRecord(req: Request, res: Response) {
    const userId = req.user!.userId;
    const parentRecordId = req.params.id as string;
    const result = await medicalRecordService.amendRecord(userId, parentRecordId, req.body);
    res.status(201).json({ success: true, data: result });
  }
}

export const medicalRecordController = new MedicalRecordController();
