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
            toast.success('Logged in successfully');   
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
    
    refreshToken: async () => {
        //Prevent multiple simultaneous refresh attempt
        if(get().checkingAuth) return;

        set({checkingAuth: true});
        try {
            const res = await axios.post('/auth/refresh-token');
            set({checkingAuth: false});
            return res.data;
        } catch (error) {
            set({checkingAuth: false, user: null});
            throw error;
        }
    },
}))
//Axios interceptors for token refresh
let refreshPromise = null;

axios.interceptors.response.use(
    (response) => response,
    async (error) => {
        const originalRequest = error.config;

    if(error.response?.status === 401 && !originalRequest._retry) {
        originalRequest._retry = true;
        try {
            //If a refresh is already in progress, wait for it to complete
            if(refreshPromise) {
                await refreshPromise;
                return axios(originalRequest);
            } else {
                //Start a new refresh 
                refreshPromise = useUserStore.getState().refreshToken();
                await refreshPromise;
                refreshPromise = null;

                return axios(originalRequest);
            }
        } catch (error) {
            //If the refresh fails, redirect to login or handle as needed
            useUserStore.getState().logout();
            return Promise.reject(error);
        }
    }
    return Promise.reject(error);
    }
)
