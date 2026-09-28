import axios from 'axios';

// Get API URL from env, default to /api for integrated server
const API_URL = import.meta.env.VITE_API_URL || '/api';

const api = axios.create({
    baseURL: API_URL,
    headers: {
        'Content-Type': 'application/json',
    },
});

// Request interceptor: Attach JWT token if available
api.interceptors.request.use(
    (config) => {
        const token = localStorage.getItem('mh_auth_token');
        if (token) {
            config.headers['Authorization'] = `Bearer ${token}`;
        }

        // Add Device Fingerprint
        const fingerprint = btoa([
            navigator.userAgent,
            navigator.language,
            screen.width + 'x' + screen.height,
            new Date().getTimezoneOffset()
        ].join('|')).substring(0, 64);

        config.headers['X-Device-Fingerprint'] = fingerprint;

        return config;
    },
    (error) => Promise.reject(error)
);

// Response interceptor: Handle common errors (like 401 Unauthorized)
api.interceptors.response.use(
    (response) => response,
    (error) => {
        if (error.response && error.response.status === 401) {
            // If 401, clear token and potentially redirect to login
            // But avoid circular dependency or forced reload if not needed immediately
            // dispatch logout event or similar
            const currentPath = window.location.hash; // Using HashRouter
            if (!currentPath.includes('/login') && !currentPath.includes('/forgot-password')) {
                // Optionally force logout logic here or let components handle it
                // localStorage.removeItem('mh_auth_token');
            }
        }
        return Promise.reject(error);
    }
);

export default api;
