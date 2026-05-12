/**
 * Middleware de validation des requêtes avec Zod
 */
import { Request, Response, NextFunction } from 'express';
import { z, ZodSchema } from 'zod';

/** Valide req.body contre un schéma Zod */
export function validateBody<T>(schema: ZodSchema<T>) {
  return (req: Request, res: Response, next: NextFunction): void => {
    const result = schema.safeParse(req.body);
    if (!result.success) {
      res.status(422).json({
        success: false,
        error: 'Données invalides',
        details: result.error.errors.map(e => ({
          field: e.path.join('.'),
          message: e.message,
        })),
      });
      return;
    }
    req.body = result.data;
    next();
  };
}

/** Valide req.params contre un schéma Zod */
export function validateParams<T>(schema: ZodSchema<T>) {
  return (req: Request, res: Response, next: NextFunction): void => {
    const result = schema.safeParse(req.params);
    if (!result.success) {
      res.status(400).json({
        success: false,
        error: 'Paramètres invalides',
        details: result.error.errors,
      });
      return;
    }
    next();
  };
}

// ── Schémas de validation ─────────────────────────────────────

export const registerSchema = z.object({
  prenom: z.string().min(1, 'Prénom requis').max(50).trim(),
  nom: z.string().min(1, 'Nom requis').max(50).trim(),
  email: z.string().email('Email invalide').toLowerCase().trim(),
  password: z
    .string()
    .min(8, 'Mot de passe: 8 caractères minimum')
    .max(128)
    .regex(/[A-Z]/, 'Doit contenir une majuscule')
    .regex(/[0-9]/, 'Doit contenir un chiffre'),
  company: z.string().max(100).trim().optional(),
});

export const loginSchema = z.object({
  email: z.string().email('Email invalide').toLowerCase().trim(),
  password: z.string().min(1, 'Mot de passe requis'),
});

export const refreshTokenSchema = z.object({
  refreshToken: z.string().min(1, 'Refresh token requis'),
});

export const sendMessageSchema = z.object({
  conversationId: z.number().int().positive().optional(),
  contenu: z.string().min(1, 'Message vide').max(50_000, 'Message trop long (50k chars max)').trim(),
  modelId: z.enum(['gemini-2.0-flash', 'llama-3.3-70b-versatile', 'gpt-4o']).optional(),
  dynamicRouting: z.boolean().optional().default(true),
  fileBase64: z.string().optional(),
  fileName: z.string().max(255).optional(),
  fileType: z.string().optional(),
});

export const upsertApiKeySchema = z.object({
  provider: z.enum(['gemini', 'groq', 'openai']),
  cle: z.string().min(10, 'Clé trop courte').max(500),
});

export const updateProfileSchema = z.object({
  prenom: z.string().min(1).max(50).trim().optional(),
  nom: z.string().min(1).max(50).trim().optional(),
  company: z.string().max(100).trim().optional(),
  langue: z.enum(['FR', 'EN']).optional(),
  theme: z.enum(['DARK', 'LIGHT', 'SYSTEM']).optional(),
  avatar: z.string().url().optional().or(z.literal('')),
});

export const paginationSchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
});

export const idParamSchema = z.object({
  id: z.coerce.number().int().positive('ID invalide'),
});
