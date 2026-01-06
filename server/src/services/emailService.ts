import nodemailer from 'nodemailer';

// Configure transporter - uses environment variables
const transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST || 'smtp.gmail.com',
    port: parseInt(process.env.SMTP_PORT || '587'),
    secure: process.env.SMTP_SECURE === 'true',
    auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS
    }
});

interface SendEmailOptions {
    to: string;
    subject: string;
    html: string;
}

export const sendEmail = async ({ to, subject, html }: SendEmailOptions): Promise<boolean> => {
    // Check if email is configured
    if (!process.env.SMTP_USER || !process.env.SMTP_PASS) {
        console.log('[Email] SMTP not configured - skipping email send');
        console.log('[Email] Would send to:', to);
        console.log('[Email] Subject:', subject);
        return false;
    }

    try {
        await transporter.sendMail({
            from: `"Magazine/MGT" <${process.env.SMTP_USER}>`,
            to,
            subject,
            html
        });
        console.log('[Email] Sent to:', to);
        return true;
    } catch (error) {
        console.error('[Email] Failed to send:', error);
        return false;
    }
};

export const sendPasswordResetEmail = async (to: string, resetToken: string, userName: string): Promise<boolean> => {
    const frontendUrl = process.env.FRONTEND_URL || 'https://magazine-frontend.vercel.app';
    const resetLink = `${frontendUrl}/reset-password?token=${resetToken}`;

    const html = `
        <!DOCTYPE html>
        <html>
        <head>
            <meta charset="utf-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
        </head>
        <body style="margin: 0; padding: 0; background-color: #0a0a0a; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;">
            <div style="max-width: 600px; margin: 0 auto; padding: 40px 20px;">
                <!-- Header -->
                <div style="text-align: center; margin-bottom: 40px;">
                    <h1 style="color: #d4af37; font-size: 32px; margin: 0; letter-spacing: 3px;">MAGAZINE</h1>
                    <p style="color: #666; font-size: 12px; margin-top: 8px; letter-spacing: 2px;">A ELITE DO SUCESSO</p>
                </div>

                <!-- Content -->
                <div style="background: linear-gradient(145deg, #1a1a1a 0%, #0d0d0d 100%); border-radius: 16px; padding: 40px; border: 1px solid rgba(212, 175, 55, 0.2);">
                    <h2 style="color: #fff; font-size: 24px; margin: 0 0 20px 0;">Olá, ${userName}!</h2>
                    
                    <p style="color: #aaa; font-size: 16px; line-height: 1.6; margin-bottom: 30px;">
                        Recebemos uma solicitação para redefinir a senha da sua conta. 
                        Clique no botão abaixo para criar uma nova senha:
                    </p>

                    <!-- Button -->
                    <div style="text-align: center; margin: 30px 0;">
                        <a href="${resetLink}" 
                           style="display: inline-block; background: linear-gradient(135deg, #d4af37 0%, #b8962e 100%); 
                                  color: #000; text-decoration: none; padding: 16px 40px; border-radius: 8px; 
                                  font-weight: bold; font-size: 14px; letter-spacing: 1px; text-transform: uppercase;">
                            Redefinir Senha
                        </a>
                    </div>

                    <p style="color: #666; font-size: 14px; line-height: 1.6; margin-top: 30px;">
                        Este link expira em <strong style="color: #d4af37;">1 hora</strong>.
                    </p>

                    <p style="color: #666; font-size: 14px; line-height: 1.6;">
                        Se você não solicitou esta redefinição, ignore este email. Sua senha permanecerá inalterada.
                    </p>

                    <!-- Divider -->
                    <hr style="border: none; border-top: 1px solid rgba(212, 175, 55, 0.2); margin: 30px 0;">

                    <p style="color: #444; font-size: 12px; margin: 0;">
                        Caso o botão não funcione, copie e cole este link no seu navegador:
                    </p>
                    <p style="color: #d4af37; font-size: 12px; word-break: break-all; margin-top: 8px;">
                        ${resetLink}
                    </p>
                </div>

                <!-- Footer -->
                <div style="text-align: center; margin-top: 40px;">
                    <p style="color: #444; font-size: 12px;">
                        © ${new Date().getFullYear()} Magazine/MGT. Todos os direitos reservados.
                    </p>
                </div>
            </div>
        </body>
        </html>
    `;

    return sendEmail({
        to,
        subject: '🔐 Redefinição de Senha - Magazine/MGT',
        html
    });
};
