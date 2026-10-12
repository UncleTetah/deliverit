import { Router } from 'express';
import * as controller from './deliveries.controller.js';
import { requireAuth } from '../../middleware/auth.js';
import { validate } from '../../middleware/validate.js';
import { createDeliverySchema, updateStatusSchema } from './deliveries.schema.js';

const router = Router();

router.use(requireAuth);

router.get('/',            controller.list);
router.post('/',           validate(createDeliverySchema), controller.create);
router.get('/:id',         controller.getOne);
router.post('/:id/accept', controller.accept);
router.patch('/:id/status', validate(updateStatusSchema), controller.updateStatus);
router.get('/:id/track',   controller.track);

export default router;