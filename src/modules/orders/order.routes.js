import { Router } from 'express';
import { OrderController } from './order.controller.js';
import { idempotencyMiddleware } from '../../middlewares/idempotency.js';

const router = Router();

// Strictly Noun-Based URI: /api/v1/orders
// Protected by Idempotency middleware for safe mobile client retries
router.route('/').post(idempotencyMiddleware, OrderController.createOrder);

router.route('/:id').get(OrderController.getOrderById);

export default router;
