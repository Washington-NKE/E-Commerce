import mongoose from "mongoose";

const storeSettingsSchema = new mongoose.Schema({
    isOpen: {
        type: Boolean,
        default: true
    },
    closedMessage: {
        type: String,
        default: "We are currently closed. Please check back later."
    },
    blockedDates: [{
        type: String // Format "YYYY-MM-DD"
    }],
    pickupTimes: [{
        type: String // Format "HH:mm"
    }],
    maxBookingDays: {
        type: Number,
        default: 14
    }
}, { timestamps: true });

const StoreSettings = mongoose.model("StoreSettings", storeSettingsSchema);

export default StoreSettings;