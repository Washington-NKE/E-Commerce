import {create} from "zustand";
import axios from "../lib/axios.js";
import {toast} from "react-hot-toast";

export const useCartStore = create((set,get) => ({
    cart: [],
    coupon: null,
    total: 0,
    subtotal: 0,
    isCouponApplied: false,

    getMyCoupon: async () => {
        try {
            const res = await axios.get('/coupons');
            set({coupon: res.data});
            get().calculateTotals();
        } catch (error) {
            toast.error(error.response.data.message || 'Something went wrong');
        }
    },

    applyCoupon: async (code) => {
        try {
            const res = await axios.post('/coupon/validate', {code});
            set({coupon: res.data, isCouponApplied: true});
            get().calculateTotals();
        } catch (error) {
            toast.error(error.response.data.message || 'Something went wrong');
        }
    },
        
    removeCoupon: async () => {
        set({coupon: null, isCouponApplied: false});
        get().calculateTotals();
    },

    getCartItems: async () => {
        try {
            const res = await axios.get('/cart');
            set({cart: res.data});
            get().calculateTotals();
        } catch (error) {
            toast.error(error.response.data.message || 'Something went wrong');
        }
    },

    addToCart: async (product) => {
        try {
            // Add to backend
            await axios.post('/cart', {productId: product._id});
            
            // Fetch fresh cart data from backend to ensure sync
            // This already handles the state update correctly
            await get().getCartItems();
            
            // Remove the manual state update - it's causing the duplication!
            // The getCartItems() call above already updates the cart state
            
            toast.success('Product added to cart');
            // calculateTotals() is already called in getCartItems()
        } catch (error) {
            toast.error(error.response?.data?.message || error.message || 'Something went wrong');
        }
    },

    calculateTotals: () => {
        const {cart, coupon} = get();
        const subtotal = cart.reduce((sum, item) => sum + item.price * item.quantity, 0);
        let total = subtotal;
        if (coupon) {
            const discount = subtotal * coupon.discount / 100;
            total = subtotal - discount;
        }
        set({subtotal, total});
    },

    removeFromCart: async (productId) => {
        try {
            await axios.delete(`/cart/`, {data: {productId}});
            set((prevState) => ({
                cart: prevState.cart.filter(item => item._id !== productId)
            }));
            get().calculateTotals();
        } catch (error) {
            toast.error(error.response?.data?.message || 'Something went wrong');
        }
    },

    updateQuantity: async (productId, quantity) => {
        if (quantity === 0) {
            get().removeFromCart(productId);
            return;
        }

        try {
            await axios.put(`/cart/${productId}`, {quantity});
            set((prevState) => ({
                cart: prevState.cart.map(item => 
                    item._id === productId ? {...item, quantity} : item
                )
            }));
            get().calculateTotals();
        } catch (error) {
            toast.error(error.response?.data?.message || 'Something went wrong');
        }
    },
        
    clearCart: async () => {
        try {
            await axios.delete('/cart');
            set({ cart: [] });
            get().calculateTotals();
        } catch (error) {
            console.error('Error clearing cart:', error);
        }
    },
}))