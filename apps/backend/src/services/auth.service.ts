/**
 * Service d'authentification
 * Gère inscription, connexion, refresh token
 */
import bcrypt from 'bcrypt';
import { prisma } from '../config/database';
import { generateAccessToken, generateRefreshToken, verifyRefreshToken } from '../utils/jwt';
import { AppError } from '../middleware/error.middleware';
import { logger } from '../utils/logger';
import type { RegisterPayload, LoginPayload, AuthResponse, UserPublic } from '@omniai/types';

const BCRYPT_ROUNDS = 12;

export class AuthService {

  /** Inscription d'un nouvel utilisateur */
  async register(payload: RegisterPayload): Promise<AuthResponse> {
    const { prenom, nom, email, password, company } = payload;

    // Vérifier si l'email existe déjà
    const existing = await prisma.user.findUnique({ where: { email } });
    if (existing) {
      throw new AppError('Un compte avec cet email existe déjà', 409);
    }

    // Hash du mot de passe
    const motDePasseHash = await bcrypt.hash(password, BCRYPT_ROUNDS);

    // Création utilisateur + paramètres notifs par défaut (transaction)
    const user = await prisma.$transaction(async (tx) => {
      const newUser = await tx.user.create({
        data: { prenom, nom, email, motDePasseHash, company },
        select: {
          id: true, prenom: true, nom: true, email: true,
          avatar: true, company: true, langue: true,
          theme: true, createdAt: true,
        },
      });

      await tx.notificationSetting.create({
        data: { userId: newUser.id },
      });

      return newUser;
    });

    const accessToken = generateAccessToken(user.id, user.email);
    const refreshToken = generateRefreshToken(user.id, user.email);

    logger.info(`Nouvel utilisateur inscrit: ${email} (id: ${user.id})`);

    return {
      user: this.formatUser(user),
      accessToken,
      refreshToken,
    };
  }

  /** Connexion utilisateur — RG02: ne pas préciser quel champ est erroné */
  async login(payload: LoginPayload): Promise<AuthResponse> {
    const { email, password } = payload;

    const user = await prisma.user.findUnique({
      where: { email },
      select: {
        id: true, prenom: true, nom: true, email: true,
        motDePasseHash: true, avatar: true, company: true,
        langue: true, theme: true, createdAt: true,
      },
    });

    // Message générique intentionnel (RG02)
    if (!user) {
      throw new AppError('Identifiants incorrects', 401);
    }

    const passwordValid = await bcrypt.compare(password, user.motDePasseHash);
    if (!passwordValid) {
      throw new AppError('Identifiants incorrects', 401);
    }

    const accessToken = generateAccessToken(user.id, user.email);
    const refreshToken = generateRefreshToken(user.id, user.email);

    logger.info(`Connexion: ${email} (id: ${user.id})`);

    const { motDePasseHash: _, ...userWithoutPassword } = user;

    return {
      user: this.formatUser(userWithoutPassword),
      accessToken,
      refreshToken,
    };
  }

  /** Renouvellement de l'access token via refresh token */
  async refreshToken(refreshToken: string): Promise<{ accessToken: string; refreshToken: string }> {
    const payload = verifyRefreshToken(refreshToken);

    const user = await prisma.user.findUnique({
      where: { id: payload.userId },
      select: { id: true, email: true },
    });

    if (!user) {
      throw new AppError('Utilisateur introuvable', 401);
    }

    const newAccessToken = generateAccessToken(user.id, user.email);
    const newRefreshToken = generateRefreshToken(user.id, user.email);

    return { accessToken: newAccessToken, refreshToken: newRefreshToken };
  }

  /** Changement de mot de passe */
  async changePassword(userId: number, currentPassword: string, newPassword: string): Promise<void> {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { motDePasseHash: true },
    });

    if (!user) throw new AppError('Utilisateur introuvable', 404);

    const valid = await bcrypt.compare(currentPassword, user.motDePasseHash);
    if (!valid) throw new AppError('Mot de passe actuel incorrect', 401);

    const newHash = await bcrypt.hash(newPassword, BCRYPT_ROUNDS);
    await prisma.user.update({
      where: { id: userId },
      data: { motDePasseHash: newHash },
    });
  }

  private formatUser(user: {
    id: number;
    prenom: string;
    nom: string;
    email: string;
    avatar?: string | null;
    company?: string | null;
    langue: string;
    theme: string;
    createdAt: Date;
  }): UserPublic {
    return {
      id: user.id,
      prenom: user.prenom,
      nom: user.nom,
      email: user.email,
      avatar: user.avatar ?? null,
      company: user.company ?? null,
      langue: user.langue as UserPublic['langue'],
      theme: user.theme as UserPublic['theme'],
      createdAt: user.createdAt.toISOString(),
    };
  }
}

export const authService = new AuthService();
