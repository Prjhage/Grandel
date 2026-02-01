import axios from 'axios';

let baseURL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8080';

// Remove trailing slash if present to prevent double slashes (e.g., .com//api)
if (baseURL.endsWith('/')) {
    baseURL = baseURL.slice(0, -1);
}

if (!import.meta.env.VITE_API_BASE_URL) {
    console.warn("⚠️ VITE_API_BASE_URL is missing! Requests will fail in production.");
}
console.log("🔗 Axios connecting to:", baseURL);

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
                window.location.href = '/login';
            }
        }
        return Promise.reject(error);
    }
);

export default axiosInstance;
