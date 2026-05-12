/**
 * Controller Quotas
 */
import { Request, Response } from 'express';
import { asyncHandler } from '../middleware/error.middleware';
import { quotaService } from '../services/quota.service';
import { dashboardService } from '../services/dashboard.service';
import { settingsService } from '../services/settings.service';
import { LLMProvider } from '@omniai/types';
import { MODEL_CONFIGS } from '../config/llm.config';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import axios from 'axios';
import { MAX_FILE_SIZE_BYTES, ACCEPTED_FILE_TYPES } from '../config/llm.config';

export const quotaController = {

  /** GET /api/quotas — Quotas temps réel de l'utilisateur */
  getQuotas: asyncHandler(async (req: Request, res: Response) => {
    const quotas = await quotaService.getQuotas(req.user!.id);
    res.json({ success: true, data: quotas });
  }),

  /** GET /api/quotas/models — Informations sur les modèles disponibles */
  getModels: asyncHandler(async (req: Request, res: Response) => {
    const models = Object.values(MODEL_CONFIGS).map(c => ({
      id: c.id,
      displayName: c.displayName,
      provider: c.provider,
      isMultimodal: c.isMultimodal,
      contextWindow: c.contextWindow,
      maxTokensOutput: c.maxTokensOutput,
      fallbackOrder: c.fallbackOrder,
    }));
    res.json({ success: true, data: models });
  }),
};

export const dashboardController = {

  /** GET /api/dashboard */
  getData: asyncHandler(async (req: Request, res: Response) => {
    const data = await dashboardService.getDashboardData(req.user!.id);
    res.json({ success: true, data });
  }),
};

export const settingsController = {

  /** GET /api/settings */
  getSettings: asyncHandler(async (req: Request, res: Response) => {
    const settings = await settingsService.getSettings(req.user!.id);
    res.json({ success: true, data: settings });
  }),

  /** PATCH /api/settings/profile */
  updateProfile: asyncHandler(async (req: Request, res: Response) => {
    const updated = await settingsService.updateProfile(req.user!.id, req.body);
    res.json({ success: true, data: updated, message: 'Profil mis à jour' });
  }),

  /** POST /api/settings/api-keys */
  upsertApiKey: asyncHandler(async (req: Request, res: Response) => {
    const { provider, cle } = req.body;
    await settingsService.upsertApiKey(req.user!.id, provider as LLMProvider, cle);
    res.json({ success: true, message: 'Clé API sauvegardée' });
  }),

  /** DELETE /api/settings/api-keys/:provider */
  deleteApiKey: asyncHandler(async (req: Request, res: Response) => {
    await settingsService.deleteApiKey(req.user!.id, req.params.provider as LLMProvider);
    res.json({ success: true, message: 'Clé API supprimée' });
  }),

  /** PATCH /api/settings/notifications */
  updateNotifications: asyncHandler(async (req: Request, res: Response) => {
    await settingsService.updateNotifications(req.user!.id, req.body);
    res.json({ success: true, message: 'Notifications mises à jour' });
  }),
};

// ── Upload Controller ─────────────────────────────────────────

const UPLOAD_DIR = process.env.UPLOAD_DIR || './uploads';
if (!fs.existsSync(UPLOAD_DIR)) fs.mkdirSync(UPLOAD_DIR, { recursive: true });

const storage = multer.diskStorage({
  destination: UPLOAD_DIR,
  filename: (_req, file, cb) => {
    const unique = `${Date.now()}-${Math.random().toString(36).slice(2)}`;
    cb(null, `${unique}${path.extname(file.originalname)}`);
  },
});

export const upload = multer({
  storage,
  limits: { fileSize: MAX_FILE_SIZE_BYTES },
  fileFilter: (_req, file, cb) => {
    if (ACCEPTED_FILE_TYPES.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Formats acceptés : PDF, Word, TXT, PNG, JPG'));
    }
  },
});

export const uploadController = {

  /** POST /api/upload — Upload et extraction de texte */
  uploadFile: asyncHandler(async (req: Request, res: Response) => {
    if (!req.file) {
      res.status(400).json({ success: false, error: 'Aucun fichier reçu' });
      return;
    }

    const { mimetype, originalname, filename, size } = req.file;
    const isImage = mimetype.startsWith('image/');

    let extractedText: string | undefined;
    let base64: string | undefined;

    if (isImage) {
      // Lire l'image en base64 pour envoi direct à Gemini
      const fileBuffer = fs.readFileSync(req.file.path);
      base64 = fileBuffer.toString('base64');
    } else {
      // Extraction texte via microservice Python (RG16)
      try {
        const FormDataNode = require('form-data');
        const formData = new FormDataNode();
        formData.append('file', fs.createReadStream(req.file.path), {
          filename: originalname,
          contentType: mimetype,
        });

        const pythonUrl = process.env.PYTHON_SERVICE_URL || 'http://localhost:5000';
        const response = await axios.post(`${pythonUrl}/extract`, formData, {
          headers: {
            ...formData.getHeaders(),
            'X-Service-Secret': process.env.PYTHON_SERVICE_SECRET || '',
          },
          timeout: 30_000,
        });

        extractedText = response.data.text?.slice(0, 50_000); // RG16: 50k chars max

      } catch (error) {
        // Si le microservice Python est indisponible: extraction basique pour TXT
        if (mimetype === 'text/plain') {
          extractedText = fs.readFileSync(req.file.path, 'utf-8').slice(0, 50_000);
        } else {
          extractedText = `[Fichier ${originalname} joint — extraction de texte indisponible]`;
        }
      }
    }

    res.json({
      success: true,
      data: {
        fileName: filename,
        originalName: originalname,
        mimeType: mimetype,
        size,
        extractedText,
        isImage,
        base64,
      },
    });
  }),
};

export const modelsController = {

  /** GET /api/models */
  list: asyncHandler(async (req: Request, res: Response) => {
    const quotas = await quotaService.getQuotas(req.user!.id);
    res.json({ success: true, data: quotas });
  }),
};
