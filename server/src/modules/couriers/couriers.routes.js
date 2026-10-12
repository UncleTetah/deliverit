import { Router } from 'express';
import * as controller from './couriers.controller.js';
import { requireAuth, requireRole } from '../../middleware/auth.js';
import { validate } from '../../middleware/validate.js';
import { upsertCourierProfileSchema, availabilitySchema } from './couriers.schema.js';

const router = Router();
router.use(requireAuth, requireRole('courier'));

router.get('/me',              controller.getMine);
router.put('/me',              validate(upsertCourierProfileSchema), controller.upsertMine);
router.patch('/me/availability', validate(availabilitySchema),       controller.setAvailability);

export default router;