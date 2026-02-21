import axios from 'axios';

// Detectar se está rodando no Capacitor (app nativo)
const isCapacitor = typeof (window as any).Capacitor !== 'undefined';

// Default backend URL for the main magazine template
const DEFAULT_BACKEND_URL = 'https://magazine-srt.vercel.app';

// Em produção web usa VITE_API_URL ou fallback para o backend padrão
// No Capacitor app usa URL completa da API
const getBaseURL = () => {
    // Se tem variável de ambiente definida, usa ela (comunidades provisionadas)
    if (import.meta.env.VITE_API_URL) {
        const url = import.meta.env.VITE_API_URL;
        // Garantir que termina sem /api se já tiver
        return url.endsWith('/api') ? url : `${url}/api`;
    }
    
    // Se é Capacitor (app nativo), precisa URL completa
    if (isCapacitor) {
        return `${DEFAULT_BACKEND_URL}/api`;
    }
    
    // Em produção web sem VITE_API_URL, usa o backend padrão
    if (import.meta.env.PROD) {
        return `${DEFAULT_BACKEND_URL}/api`;
    }
    
    // Em desenvolvimento local
    return 'http://localhost:3000/api';
};

const api = axios.create({
    baseURL: getBaseURL(),
});

api.interceptors.request.use((config) => {
    // Check localStorage first (remember me), then sessionStorage (session only)
    const token = localStorage.getItem('token') || sessionStorage.getItem('token');
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
            // Clear all auth data from both storages
            localStorage.removeItem('token');
            sessionStorage.removeItem('token');
            localStorage.removeItem('sessionMembershipType');
            localStorage.removeItem('dailyLoginModalShown');
            
            // Only dispatch session-expired event if NOT already on login page
            // This prevents the modal from showing when user is already logging in
            const isOnLoginPage = window.location.pathname.startsWith('/login');
            if (!isOnLoginPage) {
                window.dispatchEvent(new CustomEvent('session-expired'));
            }
        }
        
        // Handle content moderation block
        if (error.response?.data?.code === 'CONTENT_MODERATED' || error.response?.data?.code === 'IMAGE_MODERATED') {
            const moderationType = error.response.data.code === 'IMAGE_MODERATED' ? 'image' : 'text';
            window.dispatchEvent(new CustomEvent('content-moderated', {
                detail: {
                    type: moderationType,
                    reason: error.response.data.moderationReason || error.response.data.error,
                }
            }));
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
