import nodemailer from 'nodemailer';

// Log configuration status on startup
console.log('[Email Service] Configuration check:');
console.log('  - SMTP_HOST:', process.env.SMTP_HOST || 'not set (default: smtp.gmail.com)');
console.log('  - SMTP_PORT:', process.env.SMTP_PORT || 'not set (default: 587)');
console.log('  - SMTP_USER:', process.env.SMTP_USER ? '✓ configured' : '✗ not set');
console.log('  - SMTP_PASS:', process.env.SMTP_PASS ? '✓ configured' : '✗ not set');

// Configure transporter - uses environment variables
const createTransporter = () => {
    const host = process.env.SMTP_HOST || 'smtp.gmail.com';
    const port = parseInt(process.env.SMTP_PORT || '587');
    const secure = process.env.SMTP_SECURE === 'true' || port === 465;
    
    return nodemailer.createTransport({
        host,
        port,
        secure,
        auth: {
            user: process.env.SMTP_USER,
            pass: process.env.SMTP_PASS
        },
        // Timeout settings for better reliability
        connectionTimeout: 10000,
        greetingTimeout: 10000,
        socketTimeout: 30000,
        // TLS options for Gmail
        tls: {
            rejectUnauthorized: false // Accept self-signed certs
        }
    });
};

interface SendEmailOptions {
    to: string;
    subject: string;
    html: string;
}

export const sendEmail = async ({ to, subject, html }: SendEmailOptions): Promise<boolean> => {
    // Check if email is configured
    if (!process.env.SMTP_USER || !process.env.SMTP_PASS) {
        console.log('[Email] SMTP not configured - email NOT sent');
        console.log('[Email] To send emails, configure SMTP_USER and SMTP_PASS environment variables');
        console.log('[Email] Would send to:', to);
        console.log('[Email] Subject:', subject);
        // Return true to not block user flow, but log the issue
        return false;
    }

    try {
        const transporter = createTransporter();
        
        // Verify connection first
        await transporter.verify();
        console.log('[Email] SMTP connection verified');
        
        const info = await transporter.sendMail({
            from: `"Magazine/MGT" <${process.env.SMTP_USER}>`,
            to,
            subject,
            html
        });
        
        console.log('[Email] Sent successfully!');
        console.log('[Email] Message ID:', info.messageId);
        console.log('[Email] To:', to);
        return true;
    } catch (error: any) {
        console.error('[Email] Failed to send email:');
        console.error('[Email] Error name:', error.name);
        console.error('[Email] Error message:', error.message);
        if (error.code) console.error('[Email] Error code:', error.code);
        if (error.response) console.error('[Email] Server response:', error.response);
        return false;
    }
};

export const sendPasswordResetEmail = async (to: string, resetToken: string, userName: string): Promise<boolean> => {
    const frontendUrl = process.env.FRONTEND_URL || 'https://rovexcommunities.vercel.app';
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

export const sendWelcomeToMagazineEmail = async (to: string, userName: string): Promise<boolean> => {
    const frontendUrl = process.env.FRONTEND_URL || 'https://rovexcommunities.vercel.app';

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
                    <h2 style="color: #fff; font-size: 24px; margin: 0 0 20px 0;">🎉 Parabéns, ${userName}!</h2>
                    
                    <p style="color: #aaa; font-size: 16px; line-height: 1.6; margin-bottom: 20px;">
                        Sua solicitação foi <strong style="color: #d4af37;">aprovada</strong>! 
                        Você agora faz parte da <strong style="color: #d4af37;">Magazine</strong>, a elite do sucesso.
                    </p>

                    <p style="color: #aaa; font-size: 16px; line-height: 1.6; margin-bottom: 30px;">
                        Atualize a página para ver seu novo layout exclusivo e aproveitar todos os benefícios de ser um membro Magazine!
                    </p>

                    <!-- Button -->
                    <div style="text-align: center; margin: 30px 0;">
                        <a href="${frontendUrl}/feed" 
                           style="display: inline-block; background: linear-gradient(135deg, #d4af37 0%, #b8962e 100%); 
                                  color: #000; text-decoration: none; padding: 16px 40px; border-radius: 8px; 
                                  font-weight: bold; font-size: 14px; letter-spacing: 1px; text-transform: uppercase;">
                            Acessar Magazine
                        </a>
                    </div>

                    <div style="background: rgba(212, 175, 55, 0.1); border-radius: 8px; padding: 20px; margin-top: 20px;">
                        <h3 style="color: #d4af37; font-size: 14px; margin: 0 0 10px 0; text-transform: uppercase; letter-spacing: 1px;">Benefícios Magazine</h3>
                        <ul style="color: #aaa; font-size: 14px; line-height: 1.8; margin: 0; padding-left: 20px;">
                            <li>Layout exclusivo dourado</li>
                            <li>Badge de membro Magazine</li>
                            <li>Acesso a conteúdos exclusivos</li>
                            <li>Prioridade em eventos</li>
                        </ul>
                    </div>
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
        subject: '🌟 Bem-vindo à Magazine! - Sua solicitação foi aprovada',
        html
    });
};

// Send welcome email to NEW Magazine members with temporary password
export const sendNewMagazineMemberEmail = async (to: string, userName: string, tempPassword: string): Promise<boolean> => {
    const frontendUrl = process.env.FRONTEND_URL || 'https://rovexcommunities.vercel.app';

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
                    <h2 style="color: #fff; font-size: 24px; margin: 0 0 20px 0;">🎉 Bem-vindo à Magazine, ${userName}!</h2>
                    
                    <p style="color: #aaa; font-size: 16px; line-height: 1.6; margin-bottom: 20px;">
                        Sua solicitação foi <strong style="color: #d4af37;">aprovada</strong>! 
                        Você agora faz parte da <strong style="color: #d4af37;">Magazine</strong>, a elite do sucesso.
                    </p>

                    <!-- Credentials Box -->
                    <div style="background: rgba(212, 175, 55, 0.1); border-radius: 8px; padding: 24px; margin: 24px 0; border: 1px solid rgba(212, 175, 55, 0.3);">
                        <h3 style="color: #d4af37; font-size: 16px; margin: 0 0 16px 0; text-transform: uppercase; letter-spacing: 1px;">🔐 Suas Credenciais de Acesso</h3>
                        <p style="color: #fff; font-size: 14px; margin: 8px 0;">
                            <strong>Email:</strong> ${to}
                        </p>
                        <p style="color: #fff; font-size: 14px; margin: 8px 0;">
                            <strong>Senha Temporária:</strong> <span style="color: #d4af37; font-family: monospace; font-size: 16px;">${tempPassword}</span>
                        </p>
                        <p style="color: #888; font-size: 12px; margin-top: 16px;">
                            ⚠️ Recomendamos que você altere sua senha após o primeiro login.
                        </p>
                    </div>

                    <!-- Button -->
                    <div style="text-align: center; margin: 30px 0;">
                        <a href="${frontendUrl}/login" 
                           style="display: inline-block; background: linear-gradient(135deg, #d4af37 0%, #b8962e 100%); 
                                  color: #000; text-decoration: none; padding: 16px 40px; border-radius: 8px; 
                                  font-weight: bold; font-size: 14px; letter-spacing: 1px; text-transform: uppercase;">
                            Fazer Login
                        </a>
                    </div>

                    <div style="background: rgba(212, 175, 55, 0.1); border-radius: 8px; padding: 20px; margin-top: 20px;">
                        <h3 style="color: #d4af37; font-size: 14px; margin: 0 0 10px 0; text-transform: uppercase; letter-spacing: 1px;">Benefícios Magazine</h3>
                        <ul style="color: #aaa; font-size: 14px; line-height: 1.8; margin: 0; padding-left: 20px;">
                            <li>Layout exclusivo dourado</li>
                            <li>Badge de membro Magazine</li>
                            <li>Acesso a conteúdos exclusivos</li>
                            <li>Prioridade em eventos</li>
                        </ul>
                    </div>
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
        subject: '🎉 Bem-vindo à Magazine! - Suas credenciais de acesso',
        html
    });
};

/**
 * Send admin-generated password reset email
 * This is used when an admin resets a user's password
 */
export const sendAdminPasswordResetEmail = async (to: string, newPassword: string, userName: string): Promise<boolean> => {
    const frontendUrl = process.env.FRONTEND_URL || 'https://magazine-srt.vercel.app';
    
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
                    <h2 style="color: #d4af37; font-size: 24px; margin: 0 0 20px 0; text-align: center;">🔐 Sua Senha Foi Redefinida</h2>
                    
                    <p style="color: #ccc; font-size: 16px; line-height: 1.6; margin-bottom: 24px;">
                        Olá <strong style="color: #d4af37;">${userName}</strong>,
                    </p>
                    
                    <p style="color: #ccc; font-size: 16px; line-height: 1.6; margin-bottom: 24px;">
                        Um administrador redefiniu sua senha de acesso. Use as credenciais abaixo para fazer login:
                    </p>

                    <!-- Credentials Box -->
                    <div style="background: rgba(212, 175, 55, 0.1); border: 1px solid rgba(212, 175, 55, 0.3); border-radius: 12px; padding: 24px; margin: 24px 0;">
                        <p style="color: #888; font-size: 14px; margin: 0 0 8px 0;">Nova Senha:</p>
                        <p style="color: #d4af37; font-size: 24px; font-family: monospace; margin: 0; letter-spacing: 2px; background: rgba(0,0,0,0.3); padding: 12px; border-radius: 8px; text-align: center;">
                            ${newPassword}
                        </p>
                    </div>

                    <div style="background: rgba(255, 193, 7, 0.1); border: 1px solid rgba(255, 193, 7, 0.3); border-radius: 8px; padding: 16px; margin: 24px 0;">
                        <p style="color: #ffc107; font-size: 14px; margin: 0;">
                            ⚠️ <strong>Recomendação de Segurança:</strong> Altere sua senha assim que fizer login através das configurações da sua conta.
                        </p>
                    </div>

                    <!-- Login Button -->
                    <div style="text-align: center; margin-top: 32px;">
                        <a href="${frontendUrl}" 
                           style="display: inline-block; background: linear-gradient(135deg, #d4af37 0%, #b8962d 100%); color: #000; text-decoration: none; padding: 14px 40px; border-radius: 8px; font-weight: bold; font-size: 16px; letter-spacing: 1px;">
                            ACESSAR MAGAZINE
                        </a>
                    </div>
                </div>

                <!-- Footer -->
                <div style="text-align: center; margin-top: 40px;">
                    <p style="color: #666; font-size: 12px; margin-bottom: 8px;">
                        Se você não solicitou esta alteração, entre em contato com o suporte imediatamente.
                    </p>
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
        subject: '🔐 Sua senha foi redefinida - Magazine',
        html
    });
};

/**
 * Send product purchase keys via email
 */
export const sendProductKeysEmail = async (
    to: string,
    userName: string,
    productName: string,
    keys: string[],
    orderId: string
): Promise<boolean> => {
    const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:5173';
    
    const keysList = keys.map((key, idx) => `
        <div style="background: #2a2a2a; border: 1px solid #333; border-radius: 8px; padding: 16px; margin-bottom: 12px;">
            <p style="color: #888; font-size: 12px; margin: 0 0 4px 0;">Key ${idx + 1}</p>
            <code style="color: #d4af37; font-family: 'Courier New', monospace; font-size: 16px; letter-spacing: 1px; word-break: break-all;">
                ${key}
            </code>
        </div>
    `).join('');

    const html = `
        <!DOCTYPE html>
        <html>
        <head>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
        </head>
        <body style="margin: 0; padding: 0; background-color: #111; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;">
            <div style="max-width: 600px; margin: 0 auto; padding: 40px 20px;">
                <!-- Header -->
                <div style="text-align: center; margin-bottom: 40px;">
                    <h1 style="color: #d4af37; font-size: 28px; margin: 0; letter-spacing: 2px;">
                        🛒 COMPRA REALIZADA!
                    </h1>
                    <p style="color: #888; font-size: 14px; margin-top: 8px;">
                        Pedido #${orderId.slice(0, 8).toUpperCase()}
                    </p>
                </div>

                <!-- Main Content -->
                <div style="background: #1a1a1a; border: 1px solid #333; border-radius: 12px; padding: 32px;">
                    <p style="color: #fff; font-size: 16px; margin: 0 0 8px 0;">
                        Olá, <strong>${userName}</strong>!
                    </p>
                    <p style="color: #aaa; font-size: 14px; margin: 0 0 24px 0;">
                        Sua compra foi processada com sucesso. Confira abaixo suas keys para o produto:
                    </p>

                    <!-- Product Info -->
                    <div style="background: linear-gradient(135deg, #d4af3722, #b8962d22); border: 1px solid #d4af37; border-radius: 8px; padding: 16px; margin-bottom: 24px;">
                        <p style="color: #d4af37; font-weight: bold; font-size: 18px; margin: 0;">
                            ${productName}
                        </p>
                        <p style="color: #888; font-size: 12px; margin: 4px 0 0 0;">
                            Quantidade: ${keys.length} key(s)
                        </p>
                    </div>

                    <!-- Keys -->
                    <div style="margin-bottom: 24px;">
                        <h3 style="color: #fff; font-size: 14px; margin: 0 0 16px 0; text-transform: uppercase; letter-spacing: 1px;">
                            🔑 Suas Keys
                        </h3>
                        ${keysList}
                    </div>

                    <!-- Warning -->
                    <div style="background: #332200; border-left: 4px solid #d4af37; padding: 12px 16px; border-radius: 0 8px 8px 0;">
                        <p style="color: #d4af37; margin: 0; font-size: 13px;">
                            ⚠️ <strong>Importante:</strong> Guarde suas keys em local seguro. Por questões de segurança, não compartilhe este email.
                        </p>
                    </div>
                </div>

                <!-- View Order Button -->
                <div style="text-align: center; margin-top: 32px;">
                    <a href="${frontendUrl}/store" 
                       style="display: inline-block; background: linear-gradient(135deg, #d4af37 0%, #b8962d 100%); color: #000; text-decoration: none; padding: 14px 40px; border-radius: 8px; font-weight: bold; font-size: 16px; letter-spacing: 1px;">
                        VER MINHAS COMPRAS
                    </a>
                </div>

                <!-- Footer -->
                <div style="text-align: center; margin-top: 40px;">
                    <p style="color: #666; font-size: 12px; margin-bottom: 8px;">
                        Obrigado por comprar conosco!
                    </p>
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
        subject: `🛒 Sua compra: ${productName} - Magazine`,
        html
    });
};
