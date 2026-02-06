import axios from 'axios';

// Detectar se está rodando no Capacitor (app nativo)
const isCapacitor = typeof (window as any).Capacitor !== 'undefined';

// Em produção web usa /api (mesmo domínio)
// No Capacitor app usa URL completa da API
const getBaseURL = () => {
    // Se tem variável de ambiente definida, usa ela
    if (import.meta.env.VITE_API_URL) {
        return import.meta.env.VITE_API_URL;
    }
    
    // Se é Capacitor (app nativo), precisa URL completa
    if (isCapacitor) {
        return 'https://magazine-srt.vercel.app/api';
    }
    
    // Em produção web, usa path relativo
    if (import.meta.env.PROD) {
        return '/api';
    }
    
    // Em desenvolvimento local
    return 'http://localhost:3000/api';
};

const api = axios.create({
    baseURL: getBaseURL(),
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
            
            // Dispatch custom event to show modal
            window.dispatchEvent(new CustomEvent('session-expired'));
        }
        
        // Handle community suspension
        if (error.response?.data?.code === 'COMMUNITY_SUSPENDED') {
            // Store suspension info
            localStorage.setItem('suspensionReason', error.response.data.reason || 'unknown');
            localStorage.setItem('suspensionMessage', error.response.data.message || '');
            if (error.response.data.suspendedAt) {
                localStorage.setItem('suspensionSince', error.response.data.suspendedAt);
            }
            if (error.response.data.resumesAt) {
                localStorage.setItem('suspensionUntil', error.response.data.resumesAt);
            }
            
            // Redirect to suspended page
            if (window.location.pathname !== '/suspended') {
                window.location.href = '/suspended';
            }
        }
        
        // Handle community deleted
        if (error.response?.data?.code === 'COMMUNITY_DELETED') {
            // Clear all data and show permanent message
            localStorage.clear();
            sessionStorage.clear();
            
            if (window.location.pathname !== '/suspended') {
                window.location.href = '/suspended?reason=deleted&message=' + 
                    encodeURIComponent('Esta comunidade foi encerrada permanentemente.');
            }
        }
        
        return Promise.reject(error);
    }
);

export default api;
