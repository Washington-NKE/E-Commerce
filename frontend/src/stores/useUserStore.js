import {create} from "zustand";
import axios from "../lib/axios.js";
import {toast} from "react-hot-toast";

export const useUserStore = create((set, get) => ({
    user: null,
    loading: false,
    checkingAuth: true,

    signup: async (name, email, password, confirmPassword) => {
        
            set({loading: true});

            if(password !== confirmPassword) {
                set({loading: false});
                return toast.error('Passwords do not match');
            }

        try {
            const res = await axios.post('auth/signup', {name, email, password});
            set({user: res.data, loading: false});
            toast.success('User created successfully');   
        } catch (error) {
            set({loading: false});
            toast.error(error.response.data.message || 'Something went wrong');
        }
    },    
    login: async (email, password) => {
        try {
            set({loading: true});
            const res = await axios.post('auth/login', {email, password});
            set({user: res.data, loading: false});
            toast.success('User logged in successfully');   
        } catch (error) {
            set({loading: false});
            toast.error(error.response.data.message || "An error occurred");
        }
    },    
    logout: async () => {
        try {
            await axios.post('/auth/logout');
            set({user: null});
            toast.success('User logged out successfully');   
        } catch (error) {
            toast.error(error.response.data.message|| "An error occurred during logout");
        }
    },    
    checkAuth: async () => {
        try {
            set({checkingAuth: true});
            const res = await axios.get('/auth/profile');
            set({user: res.data, checkingAuth: false});
        } catch (error) {
            console.log(error.message)
            set({checkingAuth: false, user: null});
        }
    },    
}))

//Todo: implementing the axios interceptors for refreshing access token

