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

export const isEmailJSConfigured = (): boolean => {
    const configured = Boolean(EMAILJS_SERVICE_ID && EMAILJS_TEMPLATE_ID && EMAILJS_PUBLIC_KEY);
    if (!configured) {
        console.log('[EmailJS] Status: NÃO CONFIGURADO');
        console.log('  - Service ID:', EMAILJS_SERVICE_ID ? '✓' : '✗ faltando');
        console.log('  - Template ID:', EMAILJS_TEMPLATE_ID ? '✓' : '✗ faltando');
        console.log('  - Public Key:', EMAILJS_PUBLIC_KEY ? '✓' : '✗ faltando');
    }
    return configured;
};
