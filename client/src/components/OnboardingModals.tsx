import { useState, useEffect } from 'react';
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
    const [hasChecked, setHasChecked] = useState(false);

    useEffect(() => {
        // Só verificar uma vez por sessão
        if (hasChecked) return;

        // Não mostrar em páginas de auth
        const isAuthPage = ['/', '/login', '/register', '/request-invite', '/reset-password'].includes(location.pathname);
        if (!user || isAuthPage) return;

        // Marcar como verificado
        setHasChecked(true);

        // Verificar se precisa mostrar o Welcome Tour (SEMPRE ao logar)
        const sessionKey = `welcome_shown_${user.id}`;
        const hasShownThisSession = sessionStorage.getItem(sessionKey);
        
        if (!hasShownThisSession) {
            // Mostrar Welcome Tour
            sessionStorage.setItem(sessionKey, 'true');
            setTimeout(() => setShowWelcome(true), 500);
        } else {
            // Se já mostrou welcome, verificar WhatsNew
            checkWhatsNew();
        }
    }, [user, location.pathname, hasChecked]);

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
