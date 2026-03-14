import axios from 'axios';

let baseURL = import.meta.env.VITE_API_BASE_URL;

if (!baseURL) {
    const hostname = window.location.hostname;
    const isLocal = hostname === 'localhost' || hostname === '127.0.0.1';
    const isIP = /^\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3}$/.test(hostname);

    if (isLocal) {
        baseURL = 'http://localhost:8080';
    } else if (isIP) {
        baseURL = `http://${hostname}:8080`;
        console.log("📱 Mobile/IP access detected. Using baseURL:", baseURL);
    } else {
        // PRODUCTION FALLBACK: If VITE_API_BASE_URL is missing, we try to guess it or warn.
        // For Grandel, the likely Render URL is:
        baseURL = 'https://grandel-backend.onrender.com'; 
        console.warn("⚠️ VITE_API_BASE_URL is missing! Defaulting to production backend:", baseURL);
    }
}
console.log("🔗 API Endpoint:", baseURL);

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
