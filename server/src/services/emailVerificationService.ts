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

// Send reward redemption email
interface SendRewardRedemptionEmailParams {
    to: string;
    name: string;
    rewardTitle: string;
    ticketCode: string;
    costZions: number;
}

export const sendRewardRedemptionEmail = async ({ to, name, rewardTitle, ticketCode, costZions }: SendRewardRedemptionEmailParams): Promise<boolean> => {
    try {
        const transporter = createTransporter();

        const mailOptions = {
            from: `"MAGAZINE - No Reply" <noreply@magazine.com>`,
            replyTo: process.env.SMTP_USER,
            to,
            subject: '✅ Resgate Confirmado - MAGAZINE',
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
                        .success-icon {
                            text-align: center;
                            font-size: 64px;
                            margin-bottom: 20px;
                        }
                        .message {
                            color: #cccccc;
                            line-height: 1.8;
                            margin-bottom: 30px;
                            font-size: 16px;
                        }
                        .ticket-container {
                            background: #000000;
                            border: 3px solid #d4af37;
                            border-radius: 12px;
                            padding: 30px;
                            margin: 40px 0;
                            box-shadow: inset 0 0 20px rgba(212, 175, 55, 0.1);
                        }
                        .ticket-label {
                            font-size: 12px;
                            color: #888;
                            text-transform: uppercase;
                            letter-spacing: 3px;
                            margin-bottom: 10px;
                        }
                        .ticket-code {
                            font-size: 32px;
                            font-weight: bold;
                            color: #d4af37;
                            letter-spacing: 2px;
                            font-family: 'Courier New', monospace;
                            text-align: center;
                            padding: 15px 0;
                        }
                        .reward-details {
                            background: linear-gradient(135deg, #1a1a1a 0%, #0a0a0a 100%);
                            border-radius: 12px;
                            padding: 25px;
                            margin: 30px 0;
                            border: 1px solid #333;
                        }
                        .detail-row {
                            display: flex;
                            justify-content: space-between;
                            padding: 12px 0;
                            border-bottom: 1px solid #222;
                        }
                        .detail-row:last-child {
                            border-bottom: none;
                        }
                        .detail-label {
                            color: #888;
                            font-size: 14px;
                        }
                        .detail-value {
                            color: #d4af37;
                            font-weight: bold;
                            font-size: 14px;
                        }
                        .info-box {
                            background: linear-gradient(135deg, #1a3a1a 0%, #0a2a0a 100%);
                            color: #8fce00;
                            padding: 20px;
                            border-radius: 12px;
                            margin-top: 30px;
                            text-align: center;
                            border: 1px solid #2a5a2a;
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
                        .steps {
                            background: #0a0a0a;
                            padding: 25px;
                            border-radius: 12px;
                            border-left: 4px solid #d4af37;
                            margin: 20px 0;
                        }
                        .step {
                            padding: 10px 0;
                            color: #cccccc;
                        }
                        .step-number {
                            display: inline-block;
                            width: 30px;
                            height: 30px;
                            background: #d4af37;
                            color: #000;
                            border-radius: 50%;
                            text-align: center;
                            line-height: 30px;
                            font-weight: bold;
                            margin-right: 10px;
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
                            <div class="success-icon">✅</div>
                            <h1 class="title">Resgate Confirmado</h1>
                            
                            <div class="message">
                                <p>Olá, <span class="highlight">${name}</span>!</p>
                                <p>Parabéns! Seu resgate foi processado com sucesso. Sua recompensa exclusiva está sendo preparada pela nossa equipe.</p>
                            </div>
                            
                            <div class="ticket-container">
                                <div class="ticket-label">🎫 Número do Ticket</div>
                                <div class="ticket-code">${ticketCode}</div>
                                <div style="text-align: center; color: #888; font-size: 12px; margin-top: 10px;">
                                    Guarde este código para acompanhamento
                                </div>
                            </div>
                            
                            <div class="reward-details">
                                <div class="detail-row">
                                    <span class="detail-label">Recompensa</span>
                                    <span class="detail-value">${rewardTitle}</span>
                                </div>
                                <div class="detail-row">
                                    <span class="detail-label">Custo</span>
                                    <span class="detail-value">${costZions} Zions</span>
                                </div>
                                <div class="detail-row">
                                    <span class="detail-label">Data do Resgate</span>
                                    <span class="detail-value">${new Date().toLocaleDateString('pt-BR', { 
                                        day: '2-digit', 
                                        month: 'long', 
                                        year: 'numeric',
                                        hour: '2-digit',
                                        minute: '2-digit'
                                    })}</span>
                                </div>
                                <div class="detail-row">
                                    <span class="detail-label">Status</span>
                                    <span class="detail-value">✓ Em Processamento</span>
                                </div>
                            </div>
                            
                            <div class="divider"></div>
                            
                            <div class="steps">
                                <div style="color: #d4af37; font-weight: bold; margin-bottom: 15px; font-size: 18px;">
                                    📋 Próximos Passos
                                </div>
                                <div class="step">
                                    <span class="step-number">1</span>
                                    Nossa equipe administrativa foi notificada do seu resgate
                                </div>
                                <div class="step">
                                    <span class="step-number">2</span>
                                    Você receberá atualizações sobre o processamento
                                </div>
                                <div class="step">
                                    <span class="step-number">3</span>
                                    Em caso de dúvidas, entre em contato informando o ticket: <strong style="color: #d4af37;">${ticketCode}</strong>
                                </div>
                            </div>
                            
                            <div class="info-box">
                                💎 Obrigado por fazer parte da comunidade MAGAZINE!<br>
                                Continue acumulando Zions para resgatar ainda mais recompensas exclusivas.
                            </div>
                        </div>
                        
                        <div class="footer">
                            <p>&copy; 2026 MAGAZINE. Todos os direitos reservados.</p>
                            <p>Este é um email automático de confirmação. Por favor, não responda.</p>
                            <p style="color: #666; margin-top: 10px;">
                                Este email foi enviado para confirmar o resgate da recompensa "${rewardTitle}".<br>
                                Se você não realizou este resgate, entre em contato imediatamente com nossa equipe.
                            </p>
                        </div>
                    </div>
                </body>
                </html>
            `,
            text: `
                MAGAZINE - Resgate Confirmado
                
                Olá, ${name}!
                
                Parabéns! Seu resgate foi processado com sucesso.
                
                DETALHES DO RESGATE:
                
                🎫 Ticket: ${ticketCode}
                🎁 Recompensa: ${rewardTitle}
                💎 Custo: ${costZions} Zions
                📅 Data: ${new Date().toLocaleDateString('pt-BR')} às ${new Date().toLocaleTimeString('pt-BR')}
                ✓ Status: Em Processamento
                
                PRÓXIMOS PASSOS:
                
                1. Nossa equipe administrativa foi notificada do seu resgate
                2. Você receberá atualizações sobre o processamento
                3. Em caso de dúvidas, entre em contato informando o ticket: ${ticketCode}
                
                💎 Obrigado por fazer parte da comunidade MAGAZINE!
                
                ---
                © 2026 MAGAZINE
                Este é um email automático. Não responda esta mensagem.
            `,
        };

        const info = await transporter.sendMail(mailOptions);
        console.log('Reward redemption email sent:', info.messageId);
        return true;
    } catch (error) {
        console.error('Error sending reward redemption email:', error);
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
