import axios from 'axios';

// Detectar se está rodando no Capacitor (app nativo)
const isCapacitor = typeof (window as any).Capacitor !== 'undefined';

// Backend URL - use VITE_API_URL if set, otherwise fallback to default
// For rovexcommunities.vercel.app -> rovexbackend.vercel.app
// For magazine-srt.vercel.app -> magazine-srt.vercel.app (same)
const DEFAULT_BACKEND_URL = import.meta.env.VITE_API_URL?.replace('/api', '') || 'https://magazine-srt.vercel.app';

// Detectar subdomain do hostname atual
const getCommunitySubdomain = (): string | null => {
    // Se tem variável de ambiente definida, usa ela (limpando whitespace)
    if (import.meta.env.VITE_COMMUNITY_SUBDOMAIN) {
        return import.meta.env.VITE_COMMUNITY_SUBDOMAIN.trim();
    }
    
    // Extrair do hostname (ex: teste-e2e-065129.vercel.app => teste-e2e-065129)
    const host = window.location.hostname;
    
    // Padrão: {subdomain}.comunidades.rovex.app
    const communityMatch = host.match(/^([^.]+)\.comunidades\.rovex\.app$/);
    if (communityMatch) {
        return communityMatch[1];
    }
    
    // Padrão alternativo: {subdomain}.vercel.app (deploys temporários)
    const vercelMatch = host.match(/^([^.]+)\.vercel\.app$/);
    if (vercelMatch && vercelMatch[1] !== 'magazine-srt') {
        return vercelMatch[1];
    }
    
    return null;
};

// Em produção web usa VITE_API_URL ou fallback para o backend padrão
// No Capacitor app usa URL completa da API
const getBaseURL = () => {
    // Detectar ambiente
    const hostname = typeof window !== 'undefined' ? window.location.hostname : '';
    const isLocalhost = hostname === 'localhost' || hostname === '127.0.0.1';
    
    // Debug: mostrar ambiente
    console.log('[API] Environment:', {
        hostname,
        isLocalhost,
        isCapacitor,
    });
    
    // Em desenvolvimento local
    if (isLocalhost) {
        console.log('[API] Development mode, using localhost');
        return 'http://localhost:3000/api';
    }
    
    // Em produção (web ou Capacitor) SEMPRE usa shared backend
    // Todas as comunidades Magazine usam o mesmo backend que detecta tenant por subdomain
    console.log('[API] Production detected, using shared backend:', `${DEFAULT_BACKEND_URL}/api`);
    return `${DEFAULT_BACKEND_URL}/api`;
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
    
    // Enviar subdomain para multi-tenant detection
    const subdomain = getCommunitySubdomain();
    if (subdomain) {
        config.headers['X-Community-Subdomain'] = subdomain;
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
