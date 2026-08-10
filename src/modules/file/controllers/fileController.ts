import { Request, Response } from 'express';
import { fileService } from '../services/fileService';

export class FileController {
  async requestUploadUrl(req: Request, res: Response) {
    const userId = req.user!.userId;
    const result = await fileService.requestUploadUrl(userId, req.body);
    res.status(201).json({ success: true, data: result });
  }

  async requestDownloadUrl(req: Request, res: Response) {
    const userId = req.user!.userId;
    const id = req.params.id as string;
    const result = await fileService.requestDownloadUrl(userId, id);
    res.json({ success: true, data: result });
  }
}

export const fileController = new FileController();
