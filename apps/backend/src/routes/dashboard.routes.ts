import { Router } from 'express';
import { dashboardController } from '../controllers/other.controllers';
import { authenticate } from '../middleware/auth.middleware';

const router = Router();
router.use(authenticate);
router.get('/', dashboardController.getData);

export default router;
