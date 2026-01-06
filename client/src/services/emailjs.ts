import emailjs from '@emailjs/browser';

// EmailJS Configuration - Get these from https://dashboard.emailjs.com
const EMAILJS_SERVICE_ID = import.meta.env.VITE_EMAILJS_SERVICE_ID || 'YOUR_SERVICE_ID';
const EMAILJS_TEMPLATE_ID = import.meta.env.VITE_EMAILJS_TEMPLATE_ID || 'YOUR_TEMPLATE_ID';
const EMAILJS_PUBLIC_KEY = import.meta.env.VITE_EMAILJS_PUBLIC_KEY || 'YOUR_PUBLIC_KEY';

// Initialize EmailJS
emailjs.init(EMAILJS_PUBLIC_KEY);

interface PasswordResetEmailParams {
    to_email: string;
    to_name: string;
    reset_link: string;
}

export const sendPasswordResetEmail = async (params: PasswordResetEmailParams): Promise<boolean> => {
    try {
        const response = await emailjs.send(
            EMAILJS_SERVICE_ID,
            EMAILJS_TEMPLATE_ID,
            {
                to_email: params.to_email,
                to_name: params.to_name,
                reset_link: params.reset_link,
                // Additional template variables you might want
                app_name: 'Magazine/MGT',
                current_year: new Date().getFullYear(),
            }
        );
        
        console.log('[EmailJS] Email sent successfully:', response.status);
        return true;
    } catch (error: any) {
        console.error('[EmailJS] Failed to send email:', error);
        return false;
    }
};

export const isEmailJSConfigured = (): boolean => {
    return (
        EMAILJS_SERVICE_ID !== 'YOUR_SERVICE_ID' &&
        EMAILJS_TEMPLATE_ID !== 'YOUR_TEMPLATE_ID' &&
        EMAILJS_PUBLIC_KEY !== 'YOUR_PUBLIC_KEY'
    );
};
