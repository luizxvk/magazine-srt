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
            from: `"Magazine SRT" <${process.env.SMTP_USER}>`,
            to,
            subject: '🔐 Verificação de Email - Magazine SRT',
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
                        .header {
                            text-align: center;
                            margin-bottom: 40px;
                        }
                        .logo {
                            font-size: 32px;
                            font-weight: bold;
                            color: #d4af37;
                            margin-bottom: 10px;
                        }
                        .content {
                            background: linear-gradient(135deg, #1a1a1a 0%, #2a2a2a 100%);
                            border-radius: 12px;
                            padding: 30px;
                            border: 1px solid #d4af37;
                        }
                        .title {
                            color: #d4af37;
                            font-size: 24px;
                            margin-bottom: 20px;
                            text-align: center;
                        }
                        .message {
                            color: #cccccc;
                            line-height: 1.6;
                            margin-bottom: 30px;
                        }
                        .code-container {
                            background: #0a0a0a;
                            border: 2px dashed #d4af37;
                            border-radius: 8px;
                            padding: 20px;
                            text-align: center;
                            margin: 30px 0;
                        }
                        .code {
                            font-size: 36px;
                            font-weight: bold;
                            color: #d4af37;
                            letter-spacing: 8px;
                            font-family: 'Courier New', monospace;
                        }
                        .warning {
                            background: #ff4444;
                            color: white;
                            padding: 15px;
                            border-radius: 8px;
                            margin-top: 20px;
                            text-align: center;
                            font-weight: bold;
                        }
                        .footer {
                            margin-top: 30px;
                            text-align: center;
                            color: #888888;
                            font-size: 12px;
                        }
                    </style>
                </head>
                <body>
                    <div class="container">
                        <div class="header">
                            <div class="logo">MAGAZINE SRT</div>
                        </div>
                        <div class="content">
                            <h1 class="title">Verificação de Email</h1>
                            <div class="message">
                                <p>Olá, <strong>${name}</strong>!</p>
                                <p>Obrigado por se registrar no <strong>Magazine SRT</strong>. Para ativar sua conta e começar a usar nossa plataforma, por favor insira o código de verificação abaixo:</p>
                            </div>
                            
                            <div class="code-container">
                                <div class="code">${code}</div>
                            </div>
                            
                            <div class="message">
                                <p>Este código é válido por <strong>3 dias</strong>. Após esse período, sua conta será suspensa e você precisará criar uma nova.</p>
                                <p>Se você não criou esta conta, por favor ignore este email.</p>
                            </div>
                            
                            <div class="warning">
                                ⚠️ Você tem 3 dias para verificar seu email!
                            </div>
                        </div>
                        <div class="footer">
                            <p>&copy; 2026 Magazine SRT. Todos os direitos reservados.</p>
                            <p>Este é um email automático, por favor não responda.</p>
                        </div>
                    </div>
                </body>
                </html>
            `,
            text: `
                Olá, ${name}!
                
                Obrigado por se registrar no Magazine SRT.
                
                Seu código de verificação é: ${code}
                
                Este código é válido por 3 dias. Após esse período, sua conta será suspensa.
                
                Se você não criou esta conta, por favor ignore este email.
                
                © 2026 Magazine SRT
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
