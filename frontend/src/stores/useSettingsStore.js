import { create } from "zustand";
import axios from "../lib/axios";

const DEFAULT_SETTINGS = {
    isOpen: true,
    closedMessage: "We are temporarily closed.",
    blockedDates: [],
    pickupTimes: ["16:00", "17:00", "18:00"],
    maxBookingDays: 14
};

export const useSettingsStore = create((set) => ({
    settings: DEFAULT_SETTINGS,
    loading: false,

    fetchSettings: async () => {
        set({ loading: true });
        try {
            const res = await axios.get("/settings");
            set({ settings: res.data, loading: false});
        } catch (error) {
            console.error("Failed to feetch settings, using defaults", error);
            set({ loading: false });
        }
    },

    updateSettings: async (newSettings) => {
        set({ loading: true });
        try {
            const res = await axios.put("/settings", newSettings);
            set({ settings: res.data, loading: false });
            return { success: true };
        } catch (error) {
            set({ loading: false });
            return { success: false, error: error.response?.data?.message || "Update failed" };
        }
    }
}));