import { Router } from 'express';
import { upload, uploadController } from '../controllers/other.controllers';
import { authenticate } from '../middleware/auth.middleware';

const router = Router();
router.use(authenticate);
router.post('/', upload.single('file'), uploadController.uploadFile);

export default router;
