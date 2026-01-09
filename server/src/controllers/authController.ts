import { Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { PrismaClient } from '@prisma/client';
import { z } from 'zod';
import crypto from 'crypto';
import { generateVerificationCode, sendVerificationEmail, sendPasswordResetEmail } from '../services/emailVerificationService';

const prisma = new PrismaClient();

// Generate unique session token for single device login
const generateSessionToken = (): string => {
    return crypto.randomBytes(32).toString('hex');
};

const registerSchema = z.object({
    email: z.string().email(),
    password: z.string().min(6),
    name: z.string().min(2),
    membershipType: z.enum(['MAGAZINE', 'MGT']).optional(),
    avatarUrl: z.string().optional(),
});

const loginSchema = z.object({
    email: z.string().email(),
    password: z.string(),
});

// Maintenance mode flag - set to true to block registration/login
const MAINTENANCE_MODE = false;
const MAINTENANCE_MESSAGE = 'Estamos em manutenção! 🚧 Aguarde, em breve lançaremos a versão Beta com novidades incríveis. Fique atento às nossas redes sociais!';

export const register = async (req: Request, res: Response) => {
    try {
        // Block registration during maintenance
        if (MAINTENANCE_MODE) {
            return res.status(503).json({ 
                error: 'maintenance',
                message: MAINTENANCE_MESSAGE 
            });
        }

        const { email, password, name, membershipType, avatarUrl } = registerSchema.parse(req.body);

        const existingUser = await prisma.user.findUnique({ where: { email } });
        if (existingUser) {
            return res.status(400).json({ error: 'User already exists' });
        }

        const passwordHash = await bcrypt.hash(password, 10);

        // Generate verification code valid for 3 days
        const verificationCode = generateVerificationCode();
        const verificationExpiry = new Date();
        verificationExpiry.setDate(verificationExpiry.getDate() + 3); // 3 days

        const user = await prisma.user.create({
            data: {
                email,
                passwordHash,
                name,
                displayName: name,
                membershipType: membershipType || 'MAGAZINE',
                avatarUrl: avatarUrl || null,
                isVerified: false,
                verificationCode,
                verificationExpiry,
                verificationSentAt: new Date(),
            },
        });

        // Send verification email (don't block registration if it fails)
        try {
            await sendVerificationEmail({
                to: email,
                name,
                code: verificationCode,
            });
        } catch (emailError) {
            console.error('Failed to send verification email:', emailError);
            // Continue with registration even if email fails
        }

        const token = jwt.sign({ userId: user.id, role: user.role }, process.env.JWT_SECRET!, {
            expiresIn: '7d',
        });

        res.status(201).json({
            token,
            user: {
                id: user.id,
                name: user.name,
                email: user.email,
                role: user.role,
                membershipType: user.membershipType,
                isVerified: user.isVerified,
            }
        });
    } catch (error) {
        if (error instanceof z.ZodError) {
            return res.status(400).json({ error: (error as any).errors });
        }
        res.status(500).json({ error: 'Internal server error' });
    }
};

export const login = async (req: Request, res: Response) => {
    try {
        // Block login during maintenance (except admin)
        const { email } = req.body;
        if (MAINTENANCE_MODE && email !== 'admin@magazine.com') {
            return res.status(503).json({ 
                error: 'maintenance',
                message: MAINTENANCE_MESSAGE 
            });
        }

        const { email: parsedEmail, password } = loginSchema.parse(req.body);

        const user = await prisma.user.findUnique({ where: { email: parsedEmail } });
        if (!user) {
            return res.status(400).json({ error: 'Invalid credentials' });
        }

        const validPassword = await bcrypt.compare(password, user.passwordHash);
        if (!validPassword) {
            return res.status(400).json({ error: 'Invalid credentials' });
        }

        // Award "Primeiros Passos" badge and 50 trophies (fail-safe)
        try {
            const badge = await prisma.badge.findFirst({ where: { name: 'Primeiros Passos' } });
            if (badge) {
                const hasBadge = await prisma.userBadge.findUnique({
                    where: { userId_badgeId: { userId: user.id, badgeId: badge.id } }
                });

                if (!hasBadge) {
                    // Award Badge
                    await prisma.userBadge.create({
                        data: {
                            userId: user.id,
                            badgeId: badge.id,
                        }
                    });

                    // Award Trophies (Only once)
                    const updatedUser = await prisma.user.update({
                        where: { id: user.id },
                        data: { trophies: { increment: 50 } },
                    });
                    (user as any).trophies = updatedUser.trophies;

                    // Create Notification
                    await prisma.notification.create({
                        data: {
                            userId: user.id,
                            type: 'BADGE',
                            content: `Você desbloqueou a conquista: ${badge.name}! (+50 Troféus)`,
                        }
                    });
                }
            }
        } catch (err) {
            console.error('Failed to award badge/trophies:', err);
        }

        // Create Welcome Notification (fail-safe)
        try {
            const notificationCount = await prisma.notification.count({ where: { userId: user.id } });
            if (notificationCount === 0) {
                await prisma.notification.create({
                    data: {
                        userId: user.id,
                        type: 'SYSTEM',
                        content: 'Bem-vindo ao Clube Magazine! Explore benefícios exclusivos.',
                    }
                });
            }
        } catch (err) {
            console.error('Failed to create welcome notification:', err);
        }

        // Generate unique session token for single device login
        const sessionToken = generateSessionToken();
        
        // Store session token in database (invalidates any previous sessions)
        try {
            await prisma.user.update({
                where: { id: user.id },
                data: { sessionToken }
            });
        } catch (err) {
            console.error('Failed to update session token');
            // Continue even if session token update fails
        }

        const token = jwt.sign({ userId: user.id, role: user.role, sessionToken }, process.env.JWT_SECRET!, {
            expiresIn: '7d',
        });

        res.json({
            token,
            user: {
                id: user.id,
                name: user.name,
                email: user.email,
                role: user.role,
                trophies: user.trophies || 0,
                zions: user.zions || 0,
                avatarUrl: user.avatarUrl,
                membershipType: user.membershipType || 'MAGAZINE', // Use default from schema
                isVerified: user.isVerified
            }
        });
    } catch (error) {
        console.error('Login error:', error);
        if (error instanceof z.ZodError) {
            return res.status(400).json({ error: 'Invalid input' });
        }
        res.status(500).json({ error: 'Internal server error' });
    }
};

export const requestPasswordReset = async (req: Request, res: Response) => {
    try {
        const { email } = z.object({ email: z.string().email() }).parse(req.body);

        const user = await prisma.user.findUnique({ where: { email } });
        if (!user) {
            // Security: Don't reveal if user exists
            return res.json({ 
                message: 'Se uma conta existir com este email, você receberá instruções.',
                success: true
            });
        }

        // Generate secure Token
        const resetToken = crypto.randomBytes(32).toString('hex');
        const resetTokenExpiry = new Date(Date.now() + 3600000); // 1 hour

        await prisma.user.update({
            where: { id: user.id },
            data: { resetToken, resetTokenExpiry }
        });

        // Build reset link
        const frontendUrl = process.env.FRONTEND_URL || 'https://magazine-frontend.vercel.app';
        const resetLink = `${frontendUrl}/reset-password?token=${resetToken}`;

        // Send password reset email via Nodemailer
        await sendPasswordResetEmail({
            to: user.email,
            name: user.name || user.displayName || 'Usuário',
            resetLink
        });

        res.json({ 
            message: 'Email de redefinição de senha enviado com sucesso!',
            success: true
        });

    } catch (error) {
        console.error('[Auth] Request password reset error:', error);
        res.status(500).json({ error: 'Erro interno do servidor' });
    }
};

export const resetPassword = async (req: Request, res: Response) => {
    try {
        const { token, newPassword } = z.object({
            token: z.string(),
            newPassword: z.string().min(6)
        }).parse(req.body);

        const user = await prisma.user.findFirst({
            where: {
                resetToken: token,
                resetTokenExpiry: { gt: new Date() }
            }
        });

        if (!user) {
            return res.status(400).json({ error: 'Token inválido ou expirado. Solicite um novo link.' });
        }

        const passwordHash = await bcrypt.hash(newPassword, 10);

        await prisma.user.update({
            where: { id: user.id },
            data: {
                passwordHash,
                resetToken: null,
                resetTokenExpiry: null
            }
        });

        res.json({ message: 'Senha redefinida com sucesso! Faça login com sua nova senha.' });

    } catch (error) {
        if (error instanceof z.ZodError) {
            return res.status(400).json({ error: 'Invalid input' });
        }
        res.status(500).json({ error: 'Internal server error' });
    }
};

export const changePassword = async (req: Request, res: Response) => {
    try {
        const userId = (req as any).user?.userId;
        if (!userId) return res.status(401).json({ error: 'Unauthorized' });

        const { currentPassword, newPassword } = z.object({
            currentPassword: z.string(),
            newPassword: z.string().min(6)
        }).parse(req.body);

        const user = await prisma.user.findUnique({ where: { id: userId } });
        if (!user) return res.status(404).json({ error: 'User not found' });

        const validPassword = await bcrypt.compare(currentPassword, user.passwordHash);
        if (!validPassword) {
            return res.status(400).json({ error: 'Senha atual incorreta' });
        }

        const passwordHash = await bcrypt.hash(newPassword, 10);

        await prisma.user.update({
            where: { id: userId },
            data: { passwordHash }
        });

        res.json({ message: 'Senha alterada com sucesso' });
    } catch (error) {
        if (error instanceof z.ZodError) {
            return res.status(400).json({ error: (error as any).errors });
        }
        console.error('Change password error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
};

// Verify email with code
export const verifyEmail = async (req: Request, res: Response) => {
    try {
        const { code } = z.object({
            code: z.string().length(6)
        }).parse(req.body);

        const userId = (req as any).user?.userId;
        if (!userId) return res.status(401).json({ error: 'Unauthorized' });

        const user = await prisma.user.findUnique({ where: { id: userId } });
        if (!user) return res.status(404).json({ error: 'User not found' });

        if (user.isVerified) {
            return res.status(400).json({ error: 'Email already verified' });
        }

        if (!user.verificationCode || !user.verificationExpiry) {
            return res.status(400).json({ error: 'No verification code found. Please request a new one.' });
        }

        // Check if code expired
        if (new Date() > user.verificationExpiry) {
            return res.status(400).json({ error: 'Verification code expired. Your account will be suspended.' });
        }

        // Check if code matches
        if (user.verificationCode !== code) {
            return res.status(400).json({ error: 'Invalid verification code' });
        }

        // Verify user
        await prisma.user.update({
            where: { id: userId },
            data: {
                isVerified: true,
                verificationCode: null,
                verificationExpiry: null,
            }
        });

        res.json({ message: 'Email verified successfully!' });
    } catch (error) {
        if (error instanceof z.ZodError) {
            return res.status(400).json({ error: (error as any).errors });
        }
        console.error('Verify email error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
};

// Resend verification code
export const resendVerificationCode = async (req: Request, res: Response) => {
    try {
        const userId = (req as any).user?.userId;
        if (!userId) return res.status(401).json({ error: 'Unauthorized' });

        const user = await prisma.user.findUnique({ where: { id: userId } });
        if (!user) return res.status(404).json({ error: 'User not found' });

        if (user.isVerified) {
            return res.status(400).json({ error: 'Email already verified' });
        }

        // Generate new code
        const verificationCode = generateVerificationCode();
        const verificationExpiry = new Date();
        verificationExpiry.setDate(verificationExpiry.getDate() + 3);

        await prisma.user.update({
            where: { id: userId },
            data: {
                verificationCode,
                verificationExpiry,
                verificationSentAt: new Date(),
            }
        });

        // Send new verification email
        await sendVerificationEmail({
            to: user.email,
            name: user.name,
            code: verificationCode,
        });

        res.json({ message: 'Verification code sent successfully!' });
    } catch (error) {
        console.error('Resend verification error:', error);
        res.status(500).json({ error: 'Failed to resend verification code' });
    }
};
