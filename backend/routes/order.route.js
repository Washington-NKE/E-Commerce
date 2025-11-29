// backend/routes/order.route.js
import express from 'express';
import { 
    createOrder, 
    getOrderStatus, 
    getUserOrders,
    getAllOrders,
    updateOrderStatus
} from '../controllers/order.controller.js';
import { protectRoute, adminRoute } from '../middlewares/auth.middleware.js';

const router = express.Router();

// Protected routes (require authentication)
router.post('/create', protectRoute, createOrder);
router.get('/status/:orderId', protectRoute, getOrderStatus);
router.get('/user-orders', protectRoute, getUserOrders);

router.get("/", protectRoute, adminRoute, getAllOrders);
router.put("/:orderId/status", protectRoute, adminRoute, updateOrderStatus);

export default router;