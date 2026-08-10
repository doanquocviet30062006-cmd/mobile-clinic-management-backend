import { Request, Response } from 'express';
import { authService } from '../services/authService';

export class AuthController {
  async register(req: Request, res: Response) {
    const result = await authService.register(req.body);
    res.status(201).json({
      success: true,
      data: result,
    });
  }

  async login(req: Request, res: Response) {
    const result = await authService.login(req.body);
    res.json({
      success: true,
      data: result,
    });
  }

  async refresh(req: Request, res: Response) {
    const { refreshToken } = req.body;
    const result = await authService.refresh(refreshToken);
    res.json({
      success: true,
      data: result,
    });
  }

  async logout(req: Request, res: Response) {
    const { refreshToken } = req.body;
    await authService.logout(refreshToken);
    res.json({
      success: true,
      message: 'Logged out successfully',
    });
  }
}

export const authController = new AuthController();
