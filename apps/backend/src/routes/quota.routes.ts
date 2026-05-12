import { Router } from 'express';
import { quotaController } from '../controllers/other.controllers';
import { authenticate } from '../middleware/auth.middleware';

const router = Router();
router.use(authenticate);
router.get('/', quotaController.getQuotas);
router.get('/models', quotaController.getModels);

export default router;
