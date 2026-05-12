import { Router } from 'express';
import { modelsController } from '../controllers/other.controllers';
import { authenticate } from '../middleware/auth.middleware';

const router = Router();
router.use(authenticate);
router.get('/', modelsController.list);

export default router;
