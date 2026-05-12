import { Router } from 'express';
import { chatController } from '../controllers/chat.controller';
import { authenticate } from '../middleware/auth.middleware';
import { validateBody, sendMessageSchema } from '../middleware/validation.middleware';

const router = Router();

router.use(authenticate);
router.post('/send', validateBody(sendMessageSchema), chatController.sendMessage);
router.post('/send-sync', validateBody(sendMessageSchema), chatController.sendMessageSync);

export default router;
