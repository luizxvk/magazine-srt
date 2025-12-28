import { Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { PrismaClient } from '@prisma/client';
import { z } from 'zod';

const prisma = new PrismaClient();


const registerSchema = z.object({
    email: z.string().email(),
    password: z.string().min(6),
    name: z.string().min(2),
    membershipType: z.enum(['MAGAZINE', 'SRT']).optional(),
});

const loginSchema = z.object({
    email: z.string().email(),
    password: z.string(),
});

export const register = async (req: Request, res: Response) => {
    try {
        const { email, password, name, membershipType } = registerSchema.parse(req.body);

        const existingUser = await prisma.user.findUnique({ where: { email } });
        if (existingUser) {
            return res.status(400).json({ error: 'User already exists' });
        }

        const passwordHash = await bcrypt.hash(password, 10);

        const user = await prisma.user.create({
            data: {
                email,
                passwordHash,
                name,
                displayName: name,
                membershipType: membershipType || 'MAGAZINE',
            },
        });

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
                membershipType: user.membershipType
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
        console.log('Login attempt:', req.body); // Log request body
        const { email, password } = loginSchema.parse(req.body);
        console.log('Login schema parsed for:', email);

        const user = await prisma.user.findUnique({ where: { email } });
        if (!user) {
            console.log('User not found:', email);
            return res.status(400).json({ error: 'Invalid credentials' });
        }
        console.log('User found:', user.email, user.passwordHash);

        const validPassword = await bcrypt.compare(password, user.passwordHash);
        console.log('Password valid:', validPassword);
        if (!validPassword) {
            console.log('Invalid password for:', email);
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
                    const updatedUser = await (prisma.user as any).update({
                        where: { id: user.id },
                        data: { trophies: { increment: 50 } },
                    });
                    (user as any).trophies = updatedUser.trophies;

                    // Create Notification
                    await (prisma as any).notification.create({
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
            const notificationCount = await (prisma as any).notification.count({ where: { userId: user.id } });
            if (notificationCount === 0) {
                await (prisma as any).notification.create({
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

        const token = jwt.sign({ userId: user.id, role: user.role }, process.env.JWT_SECRET!, {
            expiresIn: '7d',
        });

        res.json({
            token,
            user: {
                id: user.id,
                name: user.name,
                email: user.email,
                role: user.role,
                trophies: (user as any).trophies || 0,
                zions: (user as any).zions || 0,
                avatarUrl: user.avatarUrl,
                membershipType: user.membershipType
            }
        });
    } catch (error) {
        console.error('Login error:', error); // Log the actual error
        if (error instanceof z.ZodError) {
            return res.status(400).json({ error: (error as any).errors });
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
            return res.json({ message: 'If an account exists, a reset link has been sent.' });
        }

        // Generate Token (Simple random string for demo)
        const resetToken = Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
        const resetTokenExpiry = new Date(Date.now() + 3600000); // 1 hour

        await prisma.user.update({
            where: { id: user.id },
            data: { resetToken, resetTokenExpiry }
        });

        // DEMO ONLY: Return token in response
        res.json({ message: 'Reset link sent', demoToken: resetToken });

    } catch (error) {
        res.status(500).json({ error: 'Internal server error' });
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
            return res.status(400).json({ error: 'Invalid or expired token' });
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

        res.json({ message: 'Password reset successfully' });

    } catch (error) {
        if (error instanceof z.ZodError) {
            return res.status(400).json({ error: (error as any).errors });
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
