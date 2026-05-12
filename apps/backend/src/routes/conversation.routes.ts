// conversation.routes.ts
import { Router } from 'express';
import { conversationController } from '../controllers/conversation.controller';
import { authenticate } from '../middleware/auth.middleware';

const router = Router();
router.use(authenticate);
router.get('/', conversationController.list);
router.post('/', conversationController.create);
router.get('/:id', conversationController.getOne);
router.patch('/:id', conversationController.rename);
router.delete('/:id', conversationController.delete);

export default router;
