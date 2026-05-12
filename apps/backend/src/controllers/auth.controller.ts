/**
 * Controller d'authentification
 */
import { Request, Response } from 'express';
import { asyncHandler } from '../middleware/error.middleware';
import { authService } from '../services/auth.service';

export const authController = {

  /** POST /api/auth/register */
  register: asyncHandler(async (req: Request, res: Response) => {
    const result = await authService.register(req.body);
    res.status(201).json({ success: true, data: result });
  }),

  /** POST /api/auth/login */
  login: asyncHandler(async (req: Request, res: Response) => {
    const result = await authService.login(req.body);
    res.json({ success: true, data: result });
  }),

  /** POST /api/auth/refresh */
  refresh: asyncHandler(async (req: Request, res: Response) => {
    const { refreshToken } = req.body;
    const result = await authService.refreshToken(refreshToken);
    res.json({ success: true, data: result });
  }),

  /** GET /api/auth/me */
  me: asyncHandler(async (req: Request, res: Response) => {
    const user = await require('../config/database').prisma.user.findUnique({
      where: { id: req.user!.id },
      select: {
        id: true, prenom: true, nom: true, email: true,
        avatar: true, company: true, langue: true,
        theme: true, createdAt: true,
      },
    });
    res.json({ success: true, data: { ...user, createdAt: user.createdAt.toISOString() } });
  }),

  /** POST /api/auth/change-password */
  changePassword: asyncHandler(async (req: Request, res: Response) => {
    const { currentPassword, newPassword } = req.body;
    await authService.changePassword(req.user!.id, currentPassword, newPassword);
    res.json({ success: true, message: 'Mot de passe modifié avec succès' });
  }),
};
