/**
 * Utilitaires JWT — génération et vérification des tokens
 */
import jwt from 'jsonwebtoken';
import { logger } from './logger';

export interface JWTPayload {
  userId: number;
  email: string;
  type: 'access' | 'refresh';
}

const ACCESS_SECRET = process.env.JWT_SECRET!;
const REFRESH_SECRET = process.env.JWT_REFRESH_SECRET!;
const ACCESS_EXPIRES = process.env.JWT_EXPIRES_IN || '15m';
const REFRESH_EXPIRES = process.env.JWT_REFRESH_EXPIRES_IN || '7d';

if (!ACCESS_SECRET || !REFRESH_SECRET) {
  throw new Error('JWT_SECRET et JWT_REFRESH_SECRET doivent être définis dans .env');
}

/** Génère un access token JWT (courte durée) */
export function generateAccessToken(userId: number, email: string): string {
  return jwt.sign(
    { userId, email, type: 'access' } satisfies JWTPayload,
    ACCESS_SECRET,
    { expiresIn: ACCESS_EXPIRES as any },
  );
}

/** Génère un refresh token JWT (longue durée) */
export function generateRefreshToken(userId: number, email: string): string {
  return jwt.sign(
    { userId, email, type: 'refresh' } satisfies JWTPayload,
    REFRESH_SECRET,
    { expiresIn: REFRESH_EXPIRES as any },
  );
}

/** Vérifie et décode un access token */
export function verifyAccessToken(token: string): JWTPayload {
  try {
    const payload = jwt.verify(token, ACCESS_SECRET) as JWTPayload;
    if (payload.type !== 'access') {
      throw new Error('Type de token invalide');
    }
    return payload;
  } catch (error) {
    logger.debug('Access token invalide:', error);
    throw error;
  }
}

/** Vérifie et décode un refresh token */
export function verifyRefreshToken(token: string): JWTPayload {
  try {
    const payload = jwt.verify(token, REFRESH_SECRET) as JWTPayload;
    if (payload.type !== 'refresh') {
      throw new Error('Type de token invalide');
    }
    return payload;
  } catch (error) {
    logger.debug('Refresh token invalide:', error);
    throw error;
  }
}
