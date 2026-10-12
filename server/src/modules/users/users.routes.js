import { Router } from 'express';
import * as controller from './users.controller.js';
import { requireAuth } from '../../middleware/auth.js';

const router = Router();
router.use(requireAuth);

router.get('/me', controller.me);
router.patch('/me', controller.updateMe);

export default router;