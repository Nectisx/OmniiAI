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

// Extracteurs Node natifs — pas besoin de service Python
async function extractPdfText(buffer: Buffer): Promise<string> {
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  const pdfParse = require('pdf-parse');
  const data = await pdfParse(buffer);
  return data.text || '';
}

async function extractDocxText(buffer: Buffer): Promise<string> {
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  const mammoth = require('mammoth');
  const result = await mammoth.extractRawText({ buffer });
  return result.value || '';
}

export const uploadController = {

  /** POST /api/upload — Upload et extraction de texte (RG16) */
  uploadFile: asyncHandler(async (req: Request, res: Response) => {
    if (!req.file) {
      res.status(400).json({ success: false, error: 'Aucun fichier reçu' });
      return;
    }

    const { mimetype, originalname, filename, size, path: filePath } = req.file;
    const isImage = mimetype.startsWith('image/');

    let extractedText: string | undefined;
    let base64: string | undefined;

    try {
      if (isImage) {
        // Lire l'image en base64 pour envoi direct à Gemini
        const fileBuffer = fs.readFileSync(filePath);
        base64 = fileBuffer.toString('base64');
      } else if (mimetype === 'application/pdf' || originalname.toLowerCase().endsWith('.pdf')) {
        // Extraction PDF avec pdf-parse (Node natif)
        const buffer = fs.readFileSync(filePath);
        const text = await extractPdfText(buffer);
        extractedText = text.slice(0, 50_000); // RG16
      } else if (
        mimetype === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
        || originalname.toLowerCase().endsWith('.docx')
      ) {
        // Extraction DOCX avec mammoth (Node natif)
        const buffer = fs.readFileSync(filePath);
        const text = await extractDocxText(buffer);
        extractedText = text.slice(0, 50_000);
      } else if (mimetype === 'text/plain' || originalname.toLowerCase().endsWith('.txt')) {
        // Extraction TXT simple
        extractedText = fs.readFileSync(filePath, 'utf-8').slice(0, 50_000);
      } else {
        // Type non supporté en extraction native — tenter le service Python en dernier recours
        try {
          const FormDataNode = require('form-data');
          const formData = new FormDataNode();
          formData.append('file', fs.createReadStream(filePath), {
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
          extractedText = response.data.text?.slice(0, 50_000);
        } catch {
          extractedText = `[Fichier ${originalname} — format non supporté]`;
        }
      }
    } catch (error: any) {
      console.error('Erreur extraction fichier:', error?.message || error);
      extractedText = `[Fichier ${originalname} — erreur d'extraction : ${error?.message || 'inconnue'}]`;
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
