import { Router } from 'express';
import { settingsController } from '../controllers/other.controllers';
import { authenticate } from '../middleware/auth.middleware';
import { validateBody, updateProfileSchema, upsertApiKeySchema } from '../middleware/validation.middleware';

const router = Router();
router.use(authenticate);
router.get('/', settingsController.getSettings);
router.patch('/profile', validateBody(updateProfileSchema), settingsController.updateProfile);
router.post('/api-keys', validateBody(upsertApiKeySchema), settingsController.upsertApiKey);
router.delete('/api-keys/:provider', settingsController.deleteApiKey);
router.patch('/notifications', settingsController.updateNotifications);

export default router;
