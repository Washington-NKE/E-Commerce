import express from "express";
import { createCheckoutSession } from "../controllers/payment.controller.js";
import { protectRoute } from "../middlewares/auth.middleware.js";


const router = express.Router();

router.post("/create-checkout-session",protectRoute, createCheckoutSession);
router.post("/checkout-success",protectRoute, ); 


export default router;