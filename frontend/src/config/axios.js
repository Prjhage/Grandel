import axios from 'axios';

let baseURL = import.meta.env.VITE_API_BASE_URL;

if (!baseURL) {
    if (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') {
        baseURL = 'http://localhost:8080';
    } else {
        // In production, if VITE_API_BASE_URL is missing, we assume relative paths
        // or the user needs to set it. We'll default to empty string to use relative.
        baseURL = '';
        console.warn("⚠️ VITE_API_BASE_URL is missing! Defaulting to relative paths.");
    }
}
console.log("🔗 Axios connecting to:", baseURL || "(relative)");

// Create axios instance with default config
const axiosInstance = axios.create({
    baseURL: baseURL,
    withCredentials: true,
    headers: {

    }
});

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
        console.error("❌ Axios Error:", error.message, "| URL:", error.config?.baseURL + error.config?.url);
        if (error.response) {
            // Handle specific error codes
            if (error.response.status === 401) {
                // Unauthorized - redirect to login
                console.warn("⚠️ 401 Unauthorized caught - redirect disabled for debugging");
                // window.location.href = '/login';
            }
        }
        return Promise.reject(error);
    }
);

export default axiosInstance;
