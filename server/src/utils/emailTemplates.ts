/**
 * Rovex Email Template System
 * ----------------------------
 * Padrão de design para todos os emails da plataforma Magazine/Rovex.
 * Inspirado no estilo minimalista da Krafton com branding Rovex no rodapé.
 */

interface EmailTemplateOptions {
    /** Nome da comunidade (ex: "MAGAZINE", "GamerHub") */
    communityName?: string;
    /** Cor primária da comunidade em hex (ex: "#d4af37") */
    primaryColor?: string;
    /** Logo URL opcional */
    logoUrl?: string;
}

/**
 * Gera o CSS base para todos os emails
 */
const getBaseStyles = (primaryColor: string = '#d4af37') => `
    body {
        font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
        background-color: #0a0a0a;
        color: #ffffff;
        margin: 0;
        padding: 0;
        line-height: 1.6;
    }
    .email-wrapper {
        background-color: #0a0a0a;
        padding: 40px 20px;
    }
    .container {
        max-width: 560px;
        margin: 0 auto;
        background: linear-gradient(135deg, #111111 0%, #1a1a1a 100%);
        border-radius: 16px;
        overflow: hidden;
        border: 1px solid #333;
    }
    .header {
        background: linear-gradient(135deg, #0d0d0d 0%, #151515 100%);
        padding: 32px 40px;
        text-align: center;
        border-bottom: 1px solid #222;
    }
    .logo {
        font-size: 28px;
        font-weight: 700;
        color: ${primaryColor};
        letter-spacing: 4px;
        text-transform: uppercase;
    }
    .logo-img {
        max-height: 48px;
        margin-bottom: 8px;
    }
    .content {
        padding: 40px;
    }
    .title {
        color: #ffffff;
        font-size: 24px;
        font-weight: 600;
        margin: 0 0 24px 0;
        text-align: center;
    }
    .subtitle {
        color: #888;
        font-size: 14px;
        text-align: center;
        margin-bottom: 32px;
    }
    .message {
        color: #cccccc;
        font-size: 15px;
        margin-bottom: 24px;
    }
    .message p {
        margin: 0 0 16px 0;
    }
    .highlight {
        color: ${primaryColor};
        font-weight: 600;
    }
    .code-box {
        background: #0a0a0a;
        border: 2px solid ${primaryColor};
        border-radius: 12px;
        padding: 24px;
        text-align: center;
        margin: 32px 0;
    }
    .code-label {
        font-size: 11px;
        color: #666;
        text-transform: uppercase;
        letter-spacing: 2px;
        margin-bottom: 12px;
    }
    .code {
        font-size: 36px;
        font-weight: 700;
        color: ${primaryColor};
        letter-spacing: 8px;
        font-family: 'SF Mono', 'Consolas', monospace;
    }
    .button {
        display: inline-block;
        background: ${primaryColor};
        color: #000000;
        font-weight: 600;
        font-size: 14px;
        padding: 14px 32px;
        border-radius: 8px;
        text-decoration: none;
        text-transform: uppercase;
        letter-spacing: 1px;
    }
    .button-container {
        text-align: center;
        margin: 32px 0;
    }
    .info-box {
        background: rgba(255, 255, 255, 0.03);
        border: 1px solid #333;
        border-radius: 8px;
        padding: 16px;
        margin: 24px 0;
    }
    .info-row {
        display: flex;
        justify-content: space-between;
        padding: 8px 0;
        border-bottom: 1px solid #222;
    }
    .info-row:last-child {
        border-bottom: none;
    }
    .info-label {
        color: #666;
        font-size: 13px;
    }
    .info-value {
        color: #fff;
        font-size: 13px;
        font-weight: 500;
    }
    .warning-box {
        background: linear-gradient(135deg, #331a00 0%, #4d2600 100%);
        border: 1px solid #ff9500;
        border-radius: 8px;
        padding: 16px;
        margin: 24px 0;
        text-align: center;
    }
    .warning-box p {
        color: #ffcc80;
        font-size: 13px;
        margin: 0;
    }
    .error-box {
        background: linear-gradient(135deg, #330a0a 0%, #4d1515 100%);
        border: 1px solid #ff4444;
        border-radius: 8px;
        padding: 16px;
        margin: 24px 0;
        text-align: center;
    }
    .error-box p {
        color: #ff8888;
        font-size: 13px;
        margin: 0;
    }
    .success-box {
        background: linear-gradient(135deg, #0a330a 0%, #154d15 100%);
        border: 1px solid #44ff44;
        border-radius: 8px;
        padding: 16px;
        margin: 24px 0;
        text-align: center;
    }
    .success-box p {
        color: #88ff88;
        font-size: 13px;
        margin: 0;
    }
    .divider {
        height: 1px;
        background: linear-gradient(90deg, transparent, #333, transparent);
        margin: 32px 0;
    }
    .footer {
        background: #0d0d0d;
        padding: 24px 40px;
        text-align: center;
        border-top: 1px solid #222;
    }
    .footer-text {
        color: #555;
        font-size: 11px;
        margin: 0 0 16px 0;
    }
    .rovex-badge {
        display: inline-flex;
        align-items: center;
        gap: 6px;
        padding: 8px 16px;
        background: linear-gradient(135deg, #1a1a2e 0%, #16213e 100%);
        border: 1px solid #333366;
        border-radius: 20px;
    }
    .rovex-logo {
        font-size: 12px;
        font-weight: 700;
        background: linear-gradient(135deg, #667eea, #764ba2);
        -webkit-background-clip: text;
        -webkit-text-fill-color: transparent;
        background-clip: text;
        letter-spacing: 2px;
    }
    .rovex-text {
        color: #888;
        font-size: 10px;
    }
`;

/**
 * Wrapper base para todos os emails
 */
export const createEmailTemplate = (
    content: string,
    options: EmailTemplateOptions = {}
): string => {
    const {
        communityName = 'MAGAZINE',
        primaryColor = '#d4af37',
        logoUrl
    } = options;

    return `
        <!DOCTYPE html>
        <html lang="pt-BR">
        <head>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <meta http-equiv="X-UA-Compatible" content="IE=edge">
            <title>${communityName}</title>
            <style>
                ${getBaseStyles(primaryColor)}
            </style>
        </head>
        <body>
            <div class="email-wrapper">
                <div class="container">
                    <div class="header">
                        ${logoUrl 
                            ? `<img src="${logoUrl}" alt="${communityName}" class="logo-img" />`
                            : `<div class="logo">${communityName}</div>`
                        }
                    </div>
                    <div class="content">
                        ${content}
                    </div>
                    <div class="footer">
                        <p class="footer-text">
                            &copy; ${new Date().getFullYear()} ${communityName}. Todos os direitos reservados.<br>
                            Este é um email automático. Por favor, não responda.
                        </p>
                        <div class="rovex-badge">
                            <span class="rovex-logo">ROVEX</span>
                            <span class="rovex-text">Powered by</span>
                        </div>
                    </div>
                </div>
            </div>
        </body>
        </html>
    `;
};

// ============================================
// TEMPLATES PRÉ-DEFINIDOS
// ============================================

/**
 * Email de verificação de conta
 */
export const verificationEmailTemplate = (
    name: string,
    code: string,
    options: EmailTemplateOptions = {}
): string => {
    const content = `
        <h1 class="title">Verificação de Email</h1>
        <p class="subtitle">Ative sua conta para começar</p>
        
        <div class="message">
            <p>Olá, <span class="highlight">${name}</span>!</p>
            <p>Seja bem-vindo! Para ativar sua conta, insira o código de verificação abaixo:</p>
        </div>
        
        <div class="code-box">
            <div class="code-label">Código de Verificação</div>
            <div class="code">${code}</div>
        </div>
        
        <div class="warning-box">
            <p>⏱️ Este código expira em <strong>30 minutos</strong></p>
        </div>
        
        <div class="divider"></div>
        
        <div class="message">
            <p style="font-size: 13px; color: #888;">
                Se você não solicitou esta verificação, ignore este email.
            </p>
        </div>
    `;

    return createEmailTemplate(content, options);
};

/**
 * Email de recuperação de senha
 */
export const passwordResetEmailTemplate = (
    name: string,
    resetLink: string,
    options: EmailTemplateOptions = {}
): string => {
    const content = `
        <h1 class="title">Recuperação de Senha</h1>
        <p class="subtitle">Redefina sua senha de acesso</p>
        
        <div class="message">
            <p>Olá, <span class="highlight">${name}</span>!</p>
            <p>Recebemos uma solicitação para redefinir sua senha. Clique no botão abaixo para continuar:</p>
        </div>
        
        <div class="button-container">
            <a href="${resetLink}" class="button">Redefinir Senha</a>
        </div>
        
        <div class="warning-box">
            <p>⏱️ Este link expira em <strong>1 hora</strong></p>
        </div>
        
        <div class="divider"></div>
        
        <div class="message">
            <p style="font-size: 13px; color: #888;">
                Se você não solicitou a redefinição de senha, ignore este email.
                Sua senha permanecerá inalterada.
            </p>
        </div>
    `;

    return createEmailTemplate(content, options);
};

/**
 * Email de resgate de recompensa
 */
export const rewardRedemptionEmailTemplate = (
    name: string,
    rewardTitle: string,
    ticketCode: string,
    costZions: number,
    options: EmailTemplateOptions = {}
): string => {
    const content = `
        <h1 class="title">Resgate Confirmado!</h1>
        <p class="subtitle">Sua recompensa foi processada com sucesso</p>
        
        <div class="message">
            <p>Parabéns, <span class="highlight">${name}</span>!</p>
            <p>Você resgatou uma recompensa exclusiva.</p>
        </div>
        
        <div class="info-box">
            <div class="info-row">
                <span class="info-label">Recompensa</span>
                <span class="info-value">${rewardTitle}</span>
            </div>
            <div class="info-row">
                <span class="info-label">Custo</span>
                <span class="info-value">${costZions.toLocaleString('pt-BR')} Zions</span>
            </div>
        </div>
        
        <div class="code-box">
            <div class="code-label">Seu Código de Resgate</div>
            <div class="code">${ticketCode}</div>
        </div>
        
        <div class="success-box">
            <p>✓ Guarde este código! Ele será necessário para retirar sua recompensa.</p>
        </div>
    `;

    return createEmailTemplate(content, options);
};

/**
 * Email de compra no mercado
 */
export const purchaseConfirmationEmailTemplate = (
    name: string,
    productName: string,
    price: string,
    transactionId: string,
    options: EmailTemplateOptions = {}
): string => {
    const content = `
        <h1 class="title">Compra Confirmada!</h1>
        <p class="subtitle">Seu pedido foi processado</p>
        
        <div class="message">
            <p>Olá, <span class="highlight">${name}</span>!</p>
            <p>Sua compra foi concluída com sucesso.</p>
        </div>
        
        <div class="info-box">
            <div class="info-row">
                <span class="info-label">Produto</span>
                <span class="info-value">${productName}</span>
            </div>
            <div class="info-row">
                <span class="info-label">Valor</span>
                <span class="info-value">${price}</span>
            </div>
            <div class="info-row">
                <span class="info-label">Transação</span>
                <span class="info-value">#${transactionId}</span>
            </div>
        </div>
        
        <div class="success-box">
            <p>✓ Obrigado por sua compra!</p>
        </div>
    `;

    return createEmailTemplate(content, options);
};

/**
 * Email de notificação genérica
 */
export const notificationEmailTemplate = (
    name: string,
    title: string,
    message: string,
    ctaText?: string,
    ctaLink?: string,
    options: EmailTemplateOptions = {}
): string => {
    const content = `
        <h1 class="title">${title}</h1>
        
        <div class="message">
            <p>Olá, <span class="highlight">${name}</span>!</p>
            <p>${message}</p>
        </div>
        
        ${ctaText && ctaLink ? `
            <div class="button-container">
                <a href="${ctaLink}" class="button">${ctaText}</a>
            </div>
        ` : ''}
    `;

    return createEmailTemplate(content, options);
};

/**
 * Email de boas-vindas
 */
export const welcomeEmailTemplate = (
    name: string,
    options: EmailTemplateOptions = {}
): string => {
    const communityName = options.communityName || 'MAGAZINE';
    
    const content = `
        <h1 class="title">Bem-vindo à ${communityName}!</h1>
        <p class="subtitle">Sua jornada começa agora</p>
        
        <div class="message">
            <p>Olá, <span class="highlight">${name}</span>!</p>
            <p>Estamos muito felizes em tê-lo conosco. Sua conta foi verificada e você agora tem acesso completo à plataforma.</p>
        </div>
        
        <div class="info-box">
            <div class="info-row">
                <span class="info-label">🎁 Bônus Diário</span>
                <span class="info-value">Resgate seus Zions todos os dias</span>
            </div>
            <div class="info-row">
                <span class="info-label">🏆 Ranking</span>
                <span class="info-value">Suba de nível e desbloqueie conquistas</span>
            </div>
            <div class="info-row">
                <span class="info-label">💬 Comunidade</span>
                <span class="info-value">Conecte-se com outros membros</span>
            </div>
        </div>
        
        <div class="success-box">
            <p>🚀 Comece explorando a plataforma agora mesmo!</p>
        </div>
    `;

    return createEmailTemplate(content, options);
};

export default {
    createEmailTemplate,
    verificationEmailTemplate,
    passwordResetEmailTemplate,
    rewardRedemptionEmailTemplate,
    purchaseConfirmationEmailTemplate,
    notificationEmailTemplate,
    welcomeEmailTemplate
};
