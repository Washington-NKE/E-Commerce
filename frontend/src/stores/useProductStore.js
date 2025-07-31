import {create} from 'zustand';
import toast from 'react-hot-toast';
import axios from '../lib/axios.js';
import { useEffect } from 'react';

export const useProductStore = create((set) => ({
    products: [],
    loading: false,
    setProducts:  (products) => set({products}),
    setIsLoading: (loading) => set({loading}),


    createProduct: async (productData) => {
        set({loading: true});
        try {
            const res = await axios.post('/products', productData);
            set((prevState) => ({
                products: [...prevState.products, res.data],
                loading: false
            }));
            toast.success('Product created successfully');
        } catch (error) {
            set({loading: false});
            toast.error(error.response.data.message || 'Something went wrong');
        }
    },

    fetchAllProducts: async () => {
        set({loading: true});
        try {
            const res = await axios.get('/products');
            set({products: res.data.products, loading: false});
        } catch (error) {    
            set({error: "Failed to fetch products", loading: false});
            toast.error(error.response.data.message || 'Something went wrong');
        }
    },

    fetchProductsByCategory: async (category) => {
        set({loading: true});
        try {
            const res = await axios.get(`/products/category/${category}`);
            set({products: res.data.products, loading: false});
        } catch (error) {    
            set({error: "Failed to fetch products", loading: false});
            toast.error(error.response.data.message || 'Something went wrong');
        }
    },

    deleteProduct: async (productId) => {
        set({loading: true});
        try {
            await axios.delete(`/products/${productId}`);
            set((prevProducts) => ({
                products: prevProducts.products.filter((product) => product._id !== productId),
                loading: false
            }));
            toast.success('Product deleted successfully');
        } catch (error) {
            set({loading: false});
            toast.error(error.response.data.message || 'Failed to delete the product');
        }
    },
    toggleFeaturedProduct: async (productId) => {
        set({loading: true});
        try {
            const res = await axios.patch(`/products/${productId}`);
            //this will update the isFeatured prop of the product 
            set((prevProducts) =>({
                products: prevProducts.products.map((product) => product._id === productId ? {...product, featured: res.data.isFeatured} : product),
                loading: false,
            }));
            toast.success('Product updated successfully');
        } catch (error) {
            set({loading: false});
            toast.error(error.response.data.message || 'Failed to update the product');
        }
    },
}))