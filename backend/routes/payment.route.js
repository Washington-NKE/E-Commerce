import express from "express";
import { createCheckoutSession, checkoutSuccess, lipiaCallback } from "../controllers/payment.controller.js";
import { protectRoute } from "../middlewares/auth.middleware.js";


const router = express.Router();

router.post("/create-checkout-session",protectRoute, createCheckoutSession);
router.post("/checkout-success",protectRoute, checkoutSuccess); 
router.post("/callback", lipiaCallback)


export default router;