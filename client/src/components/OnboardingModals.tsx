import { useState, useEffect, useRef } from 'react';
import { useAuth } from '../context/AuthContext';
import { useLocation } from 'react-router-dom';
import WelcomeTour from './WelcomeTour';
import WhatsNewModal from './WhatsNewModal';

const CURRENT_VERSION = '0.4.10';

/**
 * Gerencia a ordem dos modais de onboarding:
 * 1. WelcomeTour (sempre que logar)
 * 2. WhatsNewModal (se houver novidades)
 */
export default function OnboardingModals() {
    const { user } = useAuth();
    const location = useLocation();
    
    const [showWelcome, setShowWelcome] = useState(false);
    const [showWhatsNew, setShowWhatsNew] = useState(false);
    const hasCheckedRef = useRef(false);
    const lastUserIdRef = useRef<string | null>(null);

    useEffect(() => {
        // Não mostrar em páginas de auth
        const isAuthPage = ['/', '/login', '/register', '/request-invite', '/reset-password'].includes(location.pathname);
        if (!user || isAuthPage) return;

        // Se o usuário mudou, resetar o check
        if (lastUserIdRef.current !== user.id) {
            hasCheckedRef.current = false;
            lastUserIdRef.current = user.id;
        }

        // Só verificar uma vez por sessão por usuário
        if (hasCheckedRef.current) return;
        hasCheckedRef.current = true;

        // Verificar se precisa mostrar o Welcome Tour (SEMPRE ao logar)
        const sessionKey = `welcome_shown_${user.id}`;
        const hasShownThisSession = sessionStorage.getItem(sessionKey);
        
        if (!hasShownThisSession) {
            // Mostrar Welcome Tour
            sessionStorage.setItem(sessionKey, 'true');
            // Limpar localStorage do WelcomeTour antigo para evitar conflito
            localStorage.removeItem('has_seen_tour');
            setTimeout(() => setShowWelcome(true), 800);
        } else {
            // Se já mostrou welcome, verificar WhatsNew
            checkWhatsNew();
        }
    }, [user, location.pathname]);

    const checkWhatsNew = () => {
        const lastSeenVersion = localStorage.getItem('whatsNewVersion');
        if (lastSeenVersion !== CURRENT_VERSION) {
            setTimeout(() => setShowWhatsNew(true), 500);
        }
    };

    const handleWelcomeClose = () => {
        setShowWelcome(false);
        // Após fechar Welcome, verificar se precisa mostrar WhatsNew
        checkWhatsNew();
    };

    const handleWhatsNewClose = () => {
        setShowWhatsNew(false);
        localStorage.setItem('whatsNewVersion', CURRENT_VERSION);
    };

    return (
        <>
            <WelcomeTour isOpen={showWelcome} onClose={handleWelcomeClose} />
            <WhatsNewModal isOpen={showWhatsNew} onClose={handleWhatsNewClose} />
        </>
    );
}
