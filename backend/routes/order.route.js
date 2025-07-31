// backend/routes/order.route.js
import express from 'express';
import { 
    createOrder, 
    getOrderStatus, 
    getUserOrders, 
    mpesaWebhook 
} from '../controllers/order.controller.js';
import { protectRoute } from '../middlewares/auth.middleware.js';

const router = express.Router();

// Protected routes (require authentication)
router.post('/create', protectRoute, createOrder);
router.get('/status/:orderId', protectRoute, getOrderStatus);
router.get('/user-orders', protectRoute, getUserOrders);

// Public webhook route (M-Pesa callbacks don't include auth tokens)
router.post('/mpesa-webhook', mpesaWebhook);

export default router;