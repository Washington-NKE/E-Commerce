import express from "express";
import { adminRoute, protectRoute } from "../middlewares/auth.middleware.js";
import{ getDailySalesData, getAnalyticsData } from "../controllers/analytics.controller.js";

const router = express.Router();

router.get("/",protectRoute, adminRoute, async(req, res) => {
    try {
        const analyticsData = await getAnalyticsData();

        const startDate = new Date();
        const endDate = new Date(endDate.getTime() - 7 * 24 * 60 * 60 * 1000);

        const dailySalesData = await getDailySalesData(startDate, endDate);

        res.json({ 
            analyticsData, 
            dailySalesData 
        });
    } catch (error) {
        console.log("Error in getAnalyticsData controller", error.message);
        res.status(500).json({message: "Server error", error: error.message});
    }
})

export default router;