/**
 * Middleware d'authentification JWT
 * Vérifie le token Bearer sur toutes les routes protégées
 */
import { Request, Response, NextFunction } from 'express';
import { verifyAccessToken } from '../utils/jwt';
import { prisma } from '../config/database';
import { logger } from '../utils/logger';

// Extension du type Request pour inclure l'utilisateur
declare global {
  namespace Express {
    interface Request {
      user?: {
        id: number;
        email: string;
      };
    }
  }
}

/** Middleware principal d'authentification */
export async function authenticate(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader?.startsWith('Bearer ')) {
      res.status(401).json({ success: false, error: 'Token d\'authentification manquant' });
      return;
    }

    const token = authHeader.slice(7);
    const payload = verifyAccessToken(token);

    // Vérifier que l'utilisateur existe toujours en BDD
    const user = await prisma.user.findUnique({
      where: { id: payload.userId },
      select: { id: true, email: true },
    });

    if (!user) {
      res.status(401).json({ success: false, error: 'Utilisateur introuvable' });
      return;
    }

    req.user = user;
    next();

  } catch (error: unknown) {
    logger.debug('Échec authentification:', error);

    if (error instanceof Error) {
      if (error.name === 'TokenExpiredError') {
        res.status(401).json({ success: false, error: 'Token expiré', code: 'TOKEN_EXPIRED' });
        return;
      }
      if (error.name === 'JsonWebTokenError') {
        res.status(401).json({ success: false, error: 'Token invalide' });
        return;
      }
    }

    res.status(401).json({ success: false, error: 'Authentification échouée' });
  }
}

/** Middleware optionnel — n'échoue pas si pas de token */
export async function optionalAuth(
  req: Request,
  _res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const authHeader = req.headers.authorization;
    if (authHeader?.startsWith('Bearer ')) {
      const token = authHeader.slice(7);
      const payload = verifyAccessToken(token);
      const user = await prisma.user.findUnique({
        where: { id: payload.userId },
        select: { id: true, email: true },
      });
      if (user) req.user = user;
    }
  } catch {
    // Silencieux — auth optionnelle
  }
  next();
}
