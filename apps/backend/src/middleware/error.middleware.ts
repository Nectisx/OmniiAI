/**
 * Middleware de gestion globale des erreurs
 * Standardise toutes les réponses d'erreur
 */
import { Request, Response, NextFunction } from 'express';
import { ZodError } from 'zod';
import { logger } from '../utils/logger';

export class AppError extends Error {
  constructor(
    public message: string,
    public statusCode: number = 500,
    public code?: string,
  ) {
    super(message);
    this.name = 'AppError';
    Error.captureStackTrace(this, this.constructor);
  }
}

export function errorHandler(
  error: Error,
  req: Request,
  res: Response,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  _next: NextFunction,
): void {
  logger.error(`${req.method} ${req.path} — ${error.message}`, {
    stack: error.stack,
    body: req.body,
  });

  // Erreur applicative custom
  if (error instanceof AppError) {
    res.status(error.statusCode).json({
      success: false,
      error: error.message,
      code: error.code,
    });
    return;
  }

  // Erreur de validation Zod
  if (error instanceof ZodError) {
    res.status(422).json({
      success: false,
      error: 'Données invalides',
      details: error.errors.map(e => ({
        field: e.path.join('.'),
        message: e.message,
      })),
    });
    return;
  }

  // Erreur Prisma — contrainte unique
  if (error.message?.includes('Unique constraint')) {
    res.status(409).json({
      success: false,
      error: 'Cette ressource existe déjà',
    });
    return;
  }

  // Erreur Prisma — enregistrement introuvable
  if (error.message?.includes('Record to update not found')) {
    res.status(404).json({
      success: false,
      error: 'Ressource introuvable',
    });
    return;
  }

  // Erreur interne par défaut
  const statusCode = res.statusCode !== 200 ? res.statusCode : 500;
  res.status(statusCode).json({
    success: false,
    error: process.env.NODE_ENV === 'production'
      ? 'Erreur interne du serveur'
      : error.message,
  });
}

/** Wrapper async pour les controllers — évite try/catch répétitifs */
export function asyncHandler(
  fn: (req: Request, res: Response, next: NextFunction) => Promise<void>,
) {
  return (req: Request, res: Response, next: NextFunction): void => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
}
