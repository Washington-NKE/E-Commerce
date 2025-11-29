import StoreSettings from "../models/settings.model.js";

export const getSettings = async (req, res) => {
    try {
        let settings = await StoreSettings.findOne();
        if (!settings) {
            // Initialize default settings if database is empty
            settings = new StoreSettings({
                isOpen: true,
                blockedDates: [],
                pickupTimes: ["10:00", "12:00", "14:00", "16:00"]
            });
            await settings.save();
        }
        res.json(settings);
    } catch (error) {
        console.error("Error fetching settings:", error);
        res.status(500).json({ message: "Server error", error: error.message });
    }
};

export const updateSettings = async (req, res) => {
    try {
        const { isOpen, closedMessage, blockedDates, pickupTimes, maxBookingDays } = req.body;
        
        // We use findOneAndUpdate with upsert to ensure we always edit the single settings doc
        const settings = await StoreSettings.findOneAndUpdate(
            {}, 
            { isOpen, closedMessage, blockedDates, pickupTimes, maxBookingDays },
            { new: true, upsert: true, setDefaultsOnInsert: true }
        );

        res.json(settings);
    } catch (error) {
        console.error("Error updating settings:", error);
        res.status(500).json({ message: "Server error", error: error.message });
    }
};