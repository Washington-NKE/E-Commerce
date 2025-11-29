import { create } from "zustand";
import axios from "../lib/axios.js";
import { toast } from "react-hot-toast";

export const useCartStore = create((set, get) => ({
    cart: [],
    coupon: null,
    total: 0,
    subtotal: 0,
    isCouponApplied: false,

    getMyCoupon: async () => {
        try {
            const res = await axios.get('/coupons');
            // Store the available coupon but DO NOT apply it automatically
            // isCouponApplied remains false by default
            set({ coupon: res.data }); 
        } catch (error) {
            console.error("Error fetching coupons:", error);
        }
    },

    applyCoupon: async (code) => {
        try {
            const res = await axios.post('/coupons/validate', { code });
            set({ coupon: res.data, isCouponApplied: true });
            get().calculateTotals();
            toast.success("Coupon applied successfully");
        } catch (error) {
            toast.error(error.response?.data?.message || 'Invalid coupon code');
        }
    },

    removeCoupon: async () => {
        set({ coupon: null, isCouponApplied: false });
        get().calculateTotals();
        toast.success("Coupon removed");
    },

    getCartItems: async () => {
        try {
            const res = await axios.get('/cart');
            set({ cart: res.data });
            get().calculateTotals();
        } catch (error) {
            set({ cart: [] });
            toast.error(error.response?.data?.message || 'Failed to fetch cart');
        }
    },

    addToCart: async (product) => {
        try {
            await axios.post('/cart', { productId: product._id });
            toast.success('Product added to cart');
            
            // Fetch fresh cart to update UI
            get().getCartItems(); 
        } catch (error) {
            toast.error(error.response?.data?.message || 'Failed to add item');
        }
    },

    removeFromCart: async (productId) => {
        try {
            await axios.delete(`/cart`, { data: { productId } });
            set((prevState) => ({
                cart: prevState.cart.filter(item => item._id !== productId)
            }));
            get().calculateTotals();
        } catch (error) {
            toast.error(error.response?.data?.message || 'Failed to remove item');
        }
    },

    updateQuantity: async (productId, quantity) => {
        if (quantity === 0) {
            get().removeFromCart(productId);
            return;
        }

        try {
            await axios.put(`/cart/${productId}`, { quantity });
            set((prevState) => ({
                cart: prevState.cart.map(item =>
                    item._id === productId ? { ...item, quantity } : item
                )
            }));
            get().calculateTotals();
        } catch (error) {
            toast.error(error.response?.data?.message || 'Failed to update quantity');
        }
    },

    clearCart: async () => {
        try {
            await axios.delete('/cart');
            set({ cart: [], coupon: null, total: 0, subtotal: 0 });
        } catch (error) {
            console.error('Error clearing cart:', error);
        }
    },

    calculateTotals: () => {
        const { cart, coupon, isCouponApplied } = get();
        
        // 1. Calculate Subtotal
        const subtotal = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
        
        let total = subtotal;

        // 2. Calculate Discount ONLY if coupon exists AND is explicitly applied
        // FIX: Changed 'coupon.discount' to 'coupon.discountPercentage'
        if (coupon && isCouponApplied) {
            const discountAmount = (subtotal * (coupon.discountPercentage || 0)) / 100;
            total = subtotal - discountAmount;
        }

        set({ subtotal, total });
    },
}));