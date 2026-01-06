import emailjs from '@emailjs/browser';

// EmailJS Configuration - Get these from https://dashboard.emailjs.com
const EMAILJS_SERVICE_ID = import.meta.env.VITE_EMAILJS_SERVICE_ID || '';
const EMAILJS_TEMPLATE_ID = import.meta.env.VITE_EMAILJS_TEMPLATE_ID || '';
const EMAILJS_PUBLIC_KEY = import.meta.env.VITE_EMAILJS_PUBLIC_KEY || '';

// Initialize EmailJS only if configured
if (EMAILJS_PUBLIC_KEY) {
    emailjs.init(EMAILJS_PUBLIC_KEY);
}

interface PasswordResetEmailParams {
    to_email: string;
    to_name: string;
    reset_link: string;
}

export const sendPasswordResetEmail = async (params: PasswordResetEmailParams): Promise<boolean> => {
    // Check configuration first
    if (!isEmailJSConfigured()) {
        console.warn('[EmailJS] Não configurado. Configure as variáveis VITE_EMAILJS_* no Vercel.');
        console.log('[EmailJS] Reset link (dev):', params.reset_link);
        return false;
    }

    try {
        const response = await emailjs.send(
            EMAILJS_SERVICE_ID,
            EMAILJS_TEMPLATE_ID,
            {
                to_email: params.to_email,
                to_name: params.to_name,
                reset_link: params.reset_link,
                app_name: 'Magazine/MGT',
                current_year: new Date().getFullYear(),
            }
        );
        
        console.log('[EmailJS] Email enviado com sucesso:', response.status);
        return true;
    } catch (error: any) {
        console.error('[EmailJS] Erro ao enviar email:', error?.text || error?.message || error);
        return false;
    }
};

interface WelcomeEmailParams {
    to_email: string;
    to_name: string;
    temp_password: string;
}

// Template ID for welcome email - uses same service but different template
const EMAILJS_WELCOME_TEMPLATE_ID = import.meta.env.VITE_EMAILJS_WELCOME_TEMPLATE_ID || EMAILJS_TEMPLATE_ID;

export const sendWelcomeEmail = async (params: WelcomeEmailParams): Promise<boolean> => {
    if (!isEmailJSConfigured()) {
        console.warn('[EmailJS] Não configurado para email de boas-vindas.');
        console.log('[EmailJS] Senha temporária (dev):', params.temp_password);
        return false;
    }

    try {
        const response = await emailjs.send(
            EMAILJS_SERVICE_ID,
            EMAILJS_WELCOME_TEMPLATE_ID,
            {
                to_email: params.to_email,
                to_name: params.to_name,
                temp_password: params.temp_password,
                login_link: `${window.location.origin}/login`,
                app_name: 'Magazine/MGT',
                current_year: new Date().getFullYear(),
            }
        );
        
        console.log('[EmailJS] Email de boas-vindas enviado:', response.status);
        return true;
    } catch (error: any) {
        console.error('[EmailJS] Erro ao enviar email de boas-vindas:', error?.text || error?.message || error);
        return false;
    }
};

    return configured;
};
