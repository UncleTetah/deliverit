import { Router } from 'express';
import * as controller from './admin.controller.js';
import { requireAuth, requireRole } from '../../middleware/auth.js';

const router = Router();

// Lock down all routes in this file to Admin only
router.use(requireAuth, requireRole('admin'));

router.get('/users', controller.listUsers);
router.get('/deliveries', controller.listDeliveries);
router.patch('/couriers/:id/verify', controller.verifyCourier);

export default router;