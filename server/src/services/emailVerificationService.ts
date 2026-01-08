import nodemailer from 'nodemailer';

// Generate 6-digit verification code
export const generateVerificationCode = (): string => {
    return Math.floor(100000 + Math.random() * 900000).toString();
};

// Create email transporter
const createTransporter = () => {
    // For development: use Gmail or Ethereal (fake SMTP)
    // For production: use SendGrid, Mailgun, or AWS SES
    
    const emailConfig = {
        host: process.env.SMTP_HOST || 'smtp.gmail.com',
        port: parseInt(process.env.SMTP_PORT || '587'),
        secure: false, // true for 465, false for other ports
        auth: {
            user: process.env.SMTP_USER,
            pass: process.env.SMTP_PASS,
        },
    };

    return nodemailer.createTransport(emailConfig);
};

interface SendVerificationEmailParams {
    to: string;
    name: string;
    code: string;
}

export const sendVerificationEmail = async ({ to, name, code }: SendVerificationEmailParams): Promise<boolean> => {
    try {
        const transporter = createTransporter();

        const mailOptions = {
            from: `"MAGAZINE" <${process.env.SMTP_USER}>`,
            to,
            subject: '💎 Bem-vindo ao MAGAZINE - Verifique seu Email',
            html: `
                <!DOCTYPE html>
                <html>
                <head>
                    <style>
                        body {
                            font-family: 'Georgia', serif;
                            background-color: #000000;
                            color: #ffffff;
                            margin: 0;
                            padding: 0;
                        }
                        .container {
                            max-width: 600px;
                            margin: 0 auto;
                            padding: 40px 20px;
                        }
                        .header {
                            text-align: center;
                            margin-bottom: 40px;
                            padding: 30px 0;
                            border-bottom: 2px solid #d4af37;
                        }
                        .logo {
                            font-size: 48px;
                            font-weight: bold;
                            background: linear-gradient(135deg, #d4af37 0%, #f4e5a6 50%, #d4af37 100%);
                            -webkit-background-clip: text;
                            -webkit-text-fill-color: transparent;
                            background-clip: text;
                            letter-spacing: 8px;
                            margin-bottom: 10px;
                        }
                        .subtitle {
                            font-size: 12px;
                            color: #888;
                            text-transform: uppercase;
                            letter-spacing: 4px;
                        }
                        .content {
                            background: linear-gradient(135deg, #0a0a0a 0%, #1a1a1a 100%);
                            border-radius: 16px;
                            padding: 40px;
                            border: 2px solid #d4af37;
                            box-shadow: 0 8px 32px rgba(212, 175, 55, 0.2);
                        }
                        .title {
                            color: #d4af37;
                            font-size: 28px;
                            margin-bottom: 20px;
                            text-align: center;
                            font-weight: 300;
                            letter-spacing: 2px;
                        }
                        .message {
                            color: #cccccc;
                            line-height: 1.8;
                            margin-bottom: 30px;
                            font-size: 16px;
                        }
                        .code-container {
                            background: #000000;
                            border: 3px solid #d4af37;
                            border-radius: 12px;
                            padding: 30px;
                            text-align: center;
                            margin: 40px 0;
                            box-shadow: inset 0 0 20px rgba(212, 175, 55, 0.1);
                        }
                        .code-label {
                            font-size: 12px;
                            color: #888;
                            text-transform: uppercase;
                            letter-spacing: 3px;
                            margin-bottom: 15px;
                        }
                        .code {
                            font-size: 48px;
                            font-weight: bold;
                            color: #d4af37;
                            letter-spacing: 12px;
                            font-family: 'Courier New', monospace;
                        }
                        .warning {
                            background: linear-gradient(135deg, #8b0000 0%, #cc0000 100%);
                            color: white;
                            padding: 20px;
                            border-radius: 12px;
                            margin-top: 30px;
                            text-align: center;
                            font-weight: bold;
                            border: 1px solid #ff0000;
                        }
                        .divider {
                            height: 1px;
                            background: linear-gradient(90deg, transparent, #d4af37, transparent);
                            margin: 30px 0;
                        }
                        .footer {
                            margin-top: 40px;
                            text-align: center;
                            color: #555555;
                            font-size: 11px;
                            padding-top: 30px;
                            border-top: 1px solid #222;
                        }
                        .highlight {
                            color: #d4af37;
                            font-weight: bold;
                        }
                    </style>
                </head>
                <body>
                    <div class="container">
                        <div class="header">
                            <div class="logo">MAGAZINE</div>
                            <div class="subtitle">Luxury Community</div>
                        </div>
                        <div class="content">
                            <h1 class="title">Verificação de Email</h1>
                            <div class="message">
                                <p>Olá, <span class="highlight">${name}</span>!</p>
                                <p>Seja bem-vindo à <strong>MAGAZINE</strong>, a comunidade exclusiva para membros de elite.</p>
                                <p>Para ativar sua conta e começar a desfrutar de todos os privilégios, por favor insira o código de verificação abaixo:</p>
                            </div>
                            
                            <div class="code-container">
                                <div class="code-label">Seu Código de Acesso</div>
                                <div class="code">${code}</div>
                            </div>
                            
                            <div class="divider"></div>
                            
                            <div class="message">
                                <p>Este código é válido por <span class="highlight">3 dias</span>. Após esse período, sua conta será suspensa.</p>
                                <p style="font-size: 14px; color: #888;">Se você não criou esta conta, por favor ignore este email.</p>
                            </div>
                            
                            <div class="warning">
                                ⚠️ Atenção: Você tem 3 dias para verificar seu email!
                            </div>
                        </div>
                        <div class="footer">
                            <p>&copy; 2026 MAGAZINE. Todos os direitos reservados.</p>
                            <p>Este é um email automático. Por favor, não responda.</p>
                        </div>
                    </div>
                </body>
                </html>
            `,
            text: `
                Olá, ${name}!
                
                Seja bem-vindo à MAGAZINE - a comunidade exclusiva para membros de elite.
                
                Seu código de verificação é: ${code}
                
                Este código é válido por 3 dias. Após esse período, sua conta será suspensa.
                
                Se você não criou esta conta, por favor ignore este email.
                
                © 2026 MAGAZINE
            `,
        };

        const info = await transporter.sendMail(mailOptions);
        console.log('Verification email sent:', info.messageId);
        return true;
    } catch (error) {
        console.error('Error sending verification email:', error);
        return false;
    }
};

// Send password reset email
interface SendPasswordResetEmailParams {
    to: string;
    name: string;
    resetLink: string;
}

export const sendPasswordResetEmail = async ({ to, name, resetLink }: SendPasswordResetEmailParams): Promise<boolean> => {
    try {
        const transporter = createTransporter();

        const mailOptions = {
            from: `"MAGAZINE" <${process.env.SMTP_USER}>`,
            to,
            subject: '🔑 Redefinição de Senha - MAGAZINE',
            html: `
                <!DOCTYPE html>
                <html>
                <head>
                    <style>
                        body {
                            font-family: 'Georgia', serif;
                            background-color: #000000;
                            color: #ffffff;
                            margin: 0;
                            padding: 0;
                        }
                        .container {
                            max-width: 600px;
                            margin: 0 auto;
                            padding: 40px 20px;
                        }
                        .header {
                            text-align: center;
                            margin-bottom: 40px;
                            padding: 30px 0;
                            border-bottom: 2px solid #d4af37;
                        }
                        .logo {
                            font-size: 48px;
                            font-weight: bold;
                            background: linear-gradient(135deg, #d4af37 0%, #f4e5a6 50%, #d4af37 100%);
                            -webkit-background-clip: text;
                            -webkit-text-fill-color: transparent;
                            background-clip: text;
                            letter-spacing: 8px;
                            margin-bottom: 10px;
                        }
                        .subtitle {
                            font-size: 12px;
                            color: #888;
                            text-transform: uppercase;
                            letter-spacing: 4px;
                        }
                        .content {
                            background: linear-gradient(135deg, #0a0a0a 0%, #1a1a1a 100%);
                            border-radius: 16px;
                            padding: 40px;
                            border: 2px solid #d4af37;
                            box-shadow: 0 8px 32px rgba(212, 175, 55, 0.2);
                        }
                        .title {
                            color: #d4af37;
                            font-size: 28px;
                            margin-bottom: 20px;
                            text-align: center;
                            font-weight: 300;
                            letter-spacing: 2px;
                        }
                        .message {
                            color: #cccccc;
                            line-height: 1.8;
                            margin-bottom: 30px;
                            font-size: 16px;
                        }
                        .button-container {
                            text-align: center;
                            margin: 40px 0;
                        }
                        .reset-button {
                            display: inline-block;
                            background: linear-gradient(135deg, #d4af37 0%, #f4e5a6 50%, #d4af37 100%);
                            color: #000000;
                            text-decoration: none;
                            padding: 18px 50px;
                            border-radius: 8px;
                            font-weight: bold;
                            font-size: 16px;
                            letter-spacing: 2px;
                            text-transform: uppercase;
                            box-shadow: 0 4px 20px rgba(212, 175, 55, 0.4);
                        }
                        .warning {
                            background: linear-gradient(135deg, #8b0000 0%, #cc0000 100%);
                            color: white;
                            padding: 20px;
                            border-radius: 12px;
                            margin-top: 30px;
                            text-align: center;
                            font-weight: bold;
                            border: 1px solid #ff0000;
                        }
                        .divider {
                            height: 1px;
                            background: linear-gradient(90deg, transparent, #d4af37, transparent);
                            margin: 30px 0;
                        }
                        .footer {
                            margin-top: 40px;
                            text-align: center;
                            color: #555555;
                            font-size: 11px;
                            padding-top: 30px;
                            border-top: 1px solid #222;
                        }
                        .highlight {
                            color: #d4af37;
                            font-weight: bold;
                        }
                        .link-text {
                            color: #888;
                            font-size: 12px;
                            word-break: break-all;
                            margin-top: 20px;
                        }
                    </style>
                </head>
                <body>
                    <div class="container">
                        <div class="header">
                            <div class="logo">MAGAZINE</div>
                            <div class="subtitle">Luxury Community</div>
                        </div>
                        <div class="content">
                            <h1 class="title">Redefinição de Senha</h1>
                            <div class="message">
                                <p>Olá, <span class="highlight">${name}</span>!</p>
                                <p>Recebemos uma solicitação para redefinir a senha da sua conta na <strong>MAGAZINE</strong>.</p>
                                <p>Para criar uma nova senha, clique no botão abaixo:</p>
                            </div>
                            
                            <div class="button-container">
                                <a href="${resetLink}" class="reset-button">Redefinir Senha</a>
                            </div>
                            
                            <div class="link-text">
                                Ou copie e cole este link no seu navegador:<br>
                                <a href="${resetLink}" style="color: #d4af37;">${resetLink}</a>
                            </div>
                            
                            <div class="divider"></div>
                            
                            <div class="message">
                                <p>Este link é válido por <span class="highlight">1 hora</span>. Após esse período, você precisará solicitar um novo.</p>
                                <p style="font-size: 14px; color: #888;">Se você não solicitou esta redefinição, ignore este email. Sua senha permanecerá inalterada.</p>
                            </div>
                            
                            <div class="warning">
                                ⚠️ Por segurança, nunca compartilhe este link com ninguém!
                            </div>
                        </div>
                        <div class="footer">
                            <p>&copy; 2026 MAGAZINE. Todos os direitos reservados.</p>
                            <p>Este é um email automático. Por favor, não responda.</p>
                        </div>
                    </div>
                </body>
                </html>
            `,
            text: `
                Olá, ${name}!
                
                Recebemos uma solicitação para redefinir a senha da sua conta na MAGAZINE.
                
                Para criar uma nova senha, acesse o link abaixo:
                ${resetLink}
                
                Este link é válido por 1 hora.
                
                Se você não solicitou esta redefinição, ignore este email.
                
                © 2026 MAGAZINE
            `,
        };

        const info = await transporter.sendMail(mailOptions);
        console.log('Password reset email sent:', info.messageId);
        return true;
    } catch (error) {
        console.error('Error sending password reset email:', error);
        return false;
    }
};

interface SendVerificationReminderParams {
    to: string;
    name: string;
    hoursRemaining: number;
}

export const sendVerificationReminder = async ({ to, name, hoursRemaining }: SendVerificationReminderParams): Promise<boolean> => {
    try {
        const transporter = createTransporter();

        const mailOptions = {
            from: `"Magazine SRT" <${process.env.SMTP_USER}>`,
            to,
            subject: '⏰ Lembrete: Verifique seu email - Magazine SRT',
            html: `
                <!DOCTYPE html>
                <html>
                <head>
                    <style>
                        body {
                            font-family: Arial, sans-serif;
                            background-color: #0a0a0a;
                            color: #ffffff;
                            margin: 0;
                            padding: 0;
                        }
                        .container {
                            max-width: 600px;
                            margin: 0 auto;
                            padding: 40px 20px;
                        }
                        .content {
                            background: linear-gradient(135deg, #1a1a1a 0%, #2a2a2a 100%);
                            border-radius: 12px;
                            padding: 30px;
                            border: 1px solid #ff4444;
                        }
                        .title {
                            color: #ff4444;
                            font-size: 24px;
                            margin-bottom: 20px;
                            text-align: center;
                        }
                        .urgent {
                            background: #ff4444;
                            color: white;
                            padding: 20px;
                            border-radius: 8px;
                            text-align: center;
                            font-size: 18px;
                            font-weight: bold;
                            margin: 20px 0;
                        }
                        .message {
                            color: #cccccc;
                            line-height: 1.6;
                        }
                    </style>
                </head>
                <body>
                    <div class="container">
                        <div class="content">
                            <h1 class="title">⚠️ Ação Necessária</h1>
                            <div class="urgent">
                                Faltam ${hoursRemaining} horas para verificar seu email!
                            </div>
                            <div class="message">
                                <p>Olá, <strong>${name}</strong>,</p>
                                <p>Sua conta no <strong>Magazine SRT</strong> ainda não foi verificada.</p>
                                <p>Por favor, verifique seu email o quanto antes. Se você não verificar dentro de ${hoursRemaining} horas, sua conta será suspensa automaticamente.</p>
                                <p>Acesse a plataforma e insira o código de verificação que enviamos anteriormente.</p>
                            </div>
                        </div>
                    </div>
                </body>
                </html>
            `,
        };

        await transporter.sendMail(mailOptions);
        return true;
    } catch (error) {
        console.error('Error sending reminder email:', error);
        return false;
    }
};
