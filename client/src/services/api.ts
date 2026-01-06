import axios from 'axios';

const api = axios.create({
    baseURL: import.meta.env.VITE_API_URL || (import.meta.env.PROD ? '/api' : 'http://localhost:3000/api'),
});

api.interceptors.request.use((config) => {
    const token = localStorage.getItem('token');
    if (token) {
        config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
});

// Response interceptor to handle session expired (single device login)
api.interceptors.response.use(
    (response) => response,
    (error) => {
        if (error.response?.data?.code === 'SESSION_EXPIRED') {
            // Clear all auth data
            localStorage.removeItem('token');
            localStorage.removeItem('sessionMembershipType');
            localStorage.removeItem('dailyLoginModalShown');
            
            // Show alert and redirect to login
            alert('Sua sessão foi encerrada pois você fez login em outro dispositivo.');
            window.location.href = '/login';
        }
        return Promise.reject(error);
    }
);

export default api;
