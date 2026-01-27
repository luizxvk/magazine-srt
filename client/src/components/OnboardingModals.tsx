import { useState, useEffect, useRef } from 'react';
import { useAuth } from '../context/AuthContext';
import { useLocation } from 'react-router-dom';
import WelcomeTour from './WelcomeTour';
import WhatsNewModal from './WhatsNewModal';
import EmailVerificationPopup from './EmailVerificationPopup';

const CURRENT_VERSION = '0.4.11';

/**
 * Gerencia a ordem dos modais de onboarding:
 * 1. WelcomeTour (sempre que logar)
 * 2. EmailVerificationPopup (se email não verificado)
 * 3. WhatsNewModal (se houver novidades)
 */
export default function OnboardingModals() {
    const { user } = useAuth();
    const location = useLocation();
    
    const [showWelcome, setShowWelcome] = useState(false);
    const [showEmailVerification, setShowEmailVerification] = useState(false);
    const [showWhatsNew, setShowWhatsNew] = useState(false);
    const hasCheckedRef = useRef(false);
    const lastUserIdRef = useRef<string | null>(null);

    useEffect(() => {
        // Não mostrar em páginas de auth ou verificação
        const isAuthPage = ['/', '/login', '/register', '/request-invite', '/reset-password', '/verify-email'].includes(location.pathname);
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
            // Se já mostrou welcome, verificar email verification
            checkEmailVerification();
        }
    }, [user, location.pathname]);

    const checkEmailVerification = () => {
        // Se email não está verificado, mostrar popup
        if (user && !user.isVerified) {
            const dismissedKey = `email_verification_dismissed_${user.id}`;
            const wasDismissed = sessionStorage.getItem(dismissedKey);
            
            if (!wasDismissed) {
                setTimeout(() => setShowEmailVerification(true), 500);
                return;
            }
        }
        // Se já verificado ou foi dispensado, verificar WhatsNew
        checkWhatsNew();
    };

    const checkWhatsNew = () => {
        const lastSeenVersion = localStorage.getItem('whatsNewVersion');
        if (lastSeenVersion !== CURRENT_VERSION) {
            setTimeout(() => setShowWhatsNew(true), 500);
        }
    };

    const handleWelcomeClose = () => {
        setShowWelcome(false);
        // Após fechar Welcome, verificar email verification
        checkEmailVerification();
    };

    const handleEmailVerificationClose = () => {
        setShowEmailVerification(false);
        // Marcar como dispensado para não mostrar novamente nesta sessão
        if (user) {
            sessionStorage.setItem(`email_verification_dismissed_${user.id}`, 'true');
        }
        // Após fechar verificação, verificar WhatsNew
        checkWhatsNew();
    };

    const handleWhatsNewClose = () => {
        setShowWhatsNew(false);
        localStorage.setItem('whatsNewVersion', CURRENT_VERSION);
    };

    return (
        <>
            <WelcomeTour isOpen={showWelcome} onClose={handleWelcomeClose} />
            <EmailVerificationPopup isOpen={showEmailVerification} onClose={handleEmailVerificationClose} />
            <WhatsNewModal isOpen={showWhatsNew} onClose={handleWhatsNewClose} />
        </>
    );
}
