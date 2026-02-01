import axios from 'axios';

const baseURL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8080';

if (!import.meta.env.VITE_API_BASE_URL) {
    console.warn("⚠️ VITE_API_BASE_URL is missing! Requests will fail in production.");
}
console.log("🔗 Axios connecting to:", baseURL);

// Create axios instance with default config
const axiosInstance = axios.create({
    baseURL: baseURL,
    withCredentials: true, // Send cookies with requests
    headers: {
        // Remove default Content-Type to allow Axios to handle it for FormData
    }
});

// Request interceptor for adding auth tokens if needed
axiosInstance.interceptors.request.use(
    (config) => {

        return config;
    },
    (error) => {
        return Promise.reject(error);
    }
);

// Response interceptor for handling errors globally
axiosInstance.interceptors.response.use(
    (response) => {
        return response;
    },
    (error) => {
        if (error.response) {
            // Handle specific error codes
            if (error.response.status === 401) {
                // Unauthorized - redirect to login
                window.location.href = '/login';
            }
        }
        return Promise.reject(error);
    }
);

export default axiosInstance;
