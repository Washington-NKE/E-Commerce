import { create } from "zustand";
import axios from "../lib/axios";
import { toast } from "react-hot-toast";

export const useOrderStore = create((set) => ({
    orders: [],
    loading: false,

    fetchAllOrders: async () => {
        set({ loading: true });
        try {
            const res = await axios.get("/orders");
            set({ orders: res.data, loading: false });
        } catch (error) {
            set({ error: error.response?.data?.message, loading: false });
            toast.error(error.response?.data?.message || "Failed to fetch orders");
        }
    },

    updateOrderStatus: async (orderId, newStatus) => {
        try {
            await axios.put(`/orders/${orderId}/status`, { status: newStatus });
            // Update local state immediately for snappy UI
            set((state) => ({
                orders: state.orders.map((order) =>
                    order._id === orderId ? { ...order, status: newStatus } : order
                ),
            }));
            toast.success(`Order status updated to ${newStatus}`);
        } catch (error) {
            toast.error(error.response?.data?.message || "Failed to update status");
        }
    },
}));