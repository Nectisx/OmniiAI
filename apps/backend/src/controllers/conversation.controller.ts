/**
 * Controller Conversations
 */
import { Request, Response } from 'express';
import { asyncHandler } from '../middleware/error.middleware';
import { conversationService } from '../services/conversation.service';

export const conversationController = {

  list: asyncHandler(async (req: Request, res: Response) => {
    const { page = 1, limit = 20 } = req.query;
    const result = await conversationService.list(req.user!.id, Number(page), Number(limit));
    res.json({ success: true, ...result });
  }),

  getOne: asyncHandler(async (req: Request, res: Response) => {
    const result = await conversationService.getWithMessages(req.user!.id, Number(req.params.id));
    res.json({ success: true, data: result });
  }),

  create: asyncHandler(async (req: Request, res: Response) => {
    const { titre = 'Nouvelle conversation' } = req.body;
    const conv = await conversationService.create(req.user!.id, titre);
    res.status(201).json({ success: true, data: conv });
  }),

  rename: asyncHandler(async (req: Request, res: Response) => {
    const { titre } = req.body;
    await conversationService.rename(req.user!.id, Number(req.params.id), titre);
    res.json({ success: true, message: 'Conversation renommée' });
  }),

  delete: asyncHandler(async (req: Request, res: Response) => {
    await conversationService.delete(req.user!.id, Number(req.params.id));
    res.json({ success: true, message: 'Conversation supprimée' });
  }),
};
