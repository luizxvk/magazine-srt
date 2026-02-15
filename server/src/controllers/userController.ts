import { Response } from 'express';
import prisma from '../utils/prisma';
import { z } from 'zod';
import bcrypt from 'bcryptjs';
import { AuthRequest } from '../middleware/authMiddleware';
import { uploadAvatar } from '../services/cloudinaryService';
import { sendAdminPasswordResetEmail } from '../services/emailService';
import { checkProfileCompletionBadge, checkPurchaseBadges, checkVIPBadge } from '../services/gamificationService';

// ... existing code ...

export const getAllUsers = async (req: AuthRequest, res: Response) => {
    try {
        const requestUser = await prisma.user.findUnique({
            where: { id: req.user?.userId }
        });

        const isAdmin = requestUser?.role === 'ADMIN';

        const users = await prisma.user.findMany({
            where: { deletedAt: null }, // Filter out deleted users
            orderBy: { trophies: 'desc' }, // Changed to trophies for ranking default
            select: {
                id: true,
                name: true,
                displayName: true,
                avatarUrl: true,
                trophies: true,
                level: true,
                membershipType: true,
                // Admin only fields
                email: isAdmin,
                role: isAdmin,
                createdAt: isAdmin,
                zions: isAdmin,
            }
        });

        res.json(users);
    } catch (error) {
        console.error('Error fetching users:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
};

export const deleteUser = async (req: AuthRequest, res: Response) => {
    try {
        const requestingUserId = req.user?.userId;
        const targetUserId = req.params.id;

        const requestUser = await prisma.user.findUnique({
            where: { id: requestingUserId }
        });

        const isAdmin = requestUser?.role === 'ADMIN';
        const isSelf = requestingUserId === targetUserId;

        if (!isAdmin && !isSelf) {
            return res.status(403).json({ error: 'Forbidden' });
        }

        const { id } = req.params;

        // HARD DELETE - Wipe total do usuário e todos os dados relacionados
        // Ordem importa para evitar violações de FK
        await prisma.$transaction(async (tx) => {
            // Mensagens de grupo (reações primeiro)
            await tx.groupMessageReaction.deleteMany({ where: { userId: id } });
            await tx.groupMessageRead.deleteMany({ where: { userId: id } });
            
            // Mensagens privadas
            await tx.message.deleteMany({ where: { OR: [{ senderId: id }, { receiverId: id }] } });
            
            // Posts (comentários, likes, poll votes primeiro)
            const userPosts = await tx.post.findMany({ where: { userId: id }, select: { id: true } });
            const postIds = userPosts.map(p => p.id);
            
            if (postIds.length > 0) {
                // Buscar poll options dos posts para deletar os votes
                const pollOptions = await tx.pollOption.findMany({ where: { postId: { in: postIds } }, select: { id: true } });
                const optionIds = pollOptions.map(o => o.id);
                if (optionIds.length > 0) {
                    await tx.pollVote.deleteMany({ where: { optionId: { in: optionIds } } });
                }
                await tx.pollOption.deleteMany({ where: { postId: { in: postIds } } });
                await tx.comment.deleteMany({ where: { postId: { in: postIds } } });
                await tx.like.deleteMany({ where: { postId: { in: postIds } } });
            }
            
            // Comentários e likes do usuário em posts de outros
            await tx.comment.deleteMany({ where: { userId: id } });
            await tx.like.deleteMany({ where: { userId: id } });
            await tx.pollVote.deleteMany({ where: { userId: id } });
            
            // Posts do usuário
            await tx.post.deleteMany({ where: { userId: id } });
            
            // Stories
            await tx.storyView.deleteMany({ where: { viewerId: id } });
            const userStories = await tx.story.findMany({ where: { userId: id }, select: { id: true } });
            if (userStories.length > 0) {
                await tx.storyView.deleteMany({ where: { storyId: { in: userStories.map(s => s.id) } } });
            }
            await tx.story.deleteMany({ where: { userId: id } });
            
            // Badges
            await tx.userBadge.deleteMany({ where: { userId: id } });
            
            // Redemptions
            await tx.redemption.deleteMany({ where: { userId: id } });
            
            // Notifications
            await tx.notification.deleteMany({ where: { userId: id } });
            
            // Feedbacks
            await tx.feedback.deleteMany({ where: { userId: id } });
            
            // Point/Zion History
            await tx.pointHistory.deleteMany({ where: { userId: id } });
            await tx.zionHistory.deleteMany({ where: { userId: id } });
            
            // Event Drop Claims
            await tx.eventDropClaim.deleteMany({ where: { userId: id } });
            
            // Group memberships e mensagens
            await tx.groupMessage.deleteMany({ where: { senderId: id } });
            await tx.groupMember.deleteMany({ where: { userId: id } });
            
            // Theme packs
            await tx.userThemePack.deleteMany({ where: { userId: id } });
            
            // Social connections
            await tx.socialConnection.deleteMany({ where: { userId: id } });
            await tx.socialActivity.deleteMany({ where: { userId: id } });
            
            // Catalog photos
            await tx.catalogPhoto.deleteMany({ where: { userId: id } });
            
            // ZionPurchase
            await tx.zionPurchase.deleteMany({ where: { userId: id } });
            
            // Friendships (both directions)
            await tx.friendship.deleteMany({ where: { OR: [{ requesterId: id }, { addresseeId: id }] } });
            
            // Orders
            await tx.order.deleteMany({ where: { buyerId: id } });
            
            // Withdrawal requests
            await tx.withdrawalRequest.deleteMany({ where: { userId: id } });
            
            // Push subscriptions
            await tx.pushSubscription.deleteMany({ where: { userId: id } });
            
            // Admin badges
            await tx.adminBadge.deleteMany({ where: { userId: id } });
            
            // Market listings e transactions
            await tx.marketTransaction.deleteMany({ where: { OR: [{ buyerId: id }, { sellerId: id }] } });
            await tx.marketListing.deleteMany({ where: { sellerId: id } });
            
            // Finalmente, deletar o usuário
            await tx.user.delete({ where: { id } });
        });

        res.json({ message: 'User and all data permanently deleted' });
    } catch (error) {
        console.error('Error deleting user:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
};

export const getMyRedemptions = async (req: AuthRequest, res: Response) => {
    try {
        const userId = req.user?.userId;
        if (!userId) return res.status(401).json({ error: 'Unauthorized' });

        const redemptions = await prisma.redemption.findMany({
            where: { userId },
            include: { reward: true },
            orderBy: { redeemedAt: 'desc' }
        });

        res.json(redemptions);
    } catch (error) {
        console.error('Error fetching redemptions:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
};

export const getAllRedemptions = async (req: AuthRequest, res: Response) => {
    try {
        const requestUser = await prisma.user.findUnique({
            where: { id: req.user?.userId }
        });

        if (requestUser?.role !== 'ADMIN') {
            return res.status(403).json({ error: 'Forbidden' });
        }

        const redemptions = await prisma.redemption.findMany({
            include: {
                reward: true,
                user: {
                    select: {
                        id: true,
                        name: true,
                        email: true
                    }
                }
            },
            orderBy: { redeemedAt: 'desc' }
        });

        res.json(redemptions);
    } catch (error) {
        console.error('Error fetching all redemptions:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
};

export const resetUserPassword = async (req: AuthRequest, res: Response) => {
    try {
        // Check if user is admin
        const requestUser = await prisma.user.findUnique({
            where: { id: req.user?.userId }
        });

        if (requestUser?.role !== 'ADMIN') {
            return res.status(403).json({ error: 'Forbidden' });
        }

        const { id } = req.params;

        // Get user to reset
        const targetUser = await prisma.user.findUnique({
            where: { id },
            select: { email: true, name: true }
        });

        if (!targetUser) {
            return res.status(404).json({ error: 'Usuário não encontrado' });
        }

        // Generate random password
        const generatedPassword = Math.random().toString(36).slice(-8);
        const passwordHash = await bcrypt.hash(generatedPassword, 10);

        await prisma.user.update({
            where: { id },
            data: { passwordHash }
        });

        // Send password via email - NEVER return the password to the admin
        const emailSent = await sendAdminPasswordResetEmail(
            targetUser.email,
            generatedPassword,
            targetUser.name
        );

        if (emailSent) {
            res.json({
                success: true,
                message: 'Nova senha enviada para o email do usuário'
            });
        } else {
            // Password was changed but email failed - still don't expose the password
            res.json({
                success: true,
                message: 'Senha alterada. O email não pôde ser enviado, peça ao usuário para usar "Esqueci minha senha".'
            });
        }
    } catch (error) {
        console.error('Error resetting password:', error);
        res.status(500).json({ error: 'Erro ao resetar senha' });
    }
};

const updateProfileSchema = z.object({
    name: z.string().min(2).optional().or(z.literal('')),
    displayName: z.string().optional().or(z.literal('')),
    bio: z.string().max(500).optional().or(z.literal('')),
    avatarUrl: z.string().optional().or(z.literal('')),
    trophies: z.number().optional(),
    level: z.number().min(1).max(30).optional(),
    zions: z.number().min(0).optional(),
    zionsPoints: z.number().min(0).optional(),
    zionsCash: z.number().min(0).optional(),
});

const updateProfileBgSchema = z.object({
    profileBgUrl: z.string().nullable().optional(),
    profileBgScale: z.number().min(0.5).max(3).optional(),
    profileBgPosX: z.number().min(0).max(100).optional(),
    profileBgPosY: z.number().min(0).max(100).optional(),
});

export const updateProfileBackground = async (req: AuthRequest, res: Response) => {
    try {
        const userId = req.user?.userId;
        if (!userId) return res.status(401).json({ error: 'Unauthorized' });

        const data = updateProfileBgSchema.parse(req.body);

        // Upload image to Cloudinary if base64
        if (data.profileBgUrl && data.profileBgUrl.startsWith('data:')) {
            console.log(`[updateProfileBg] Uploading background image to CDN...`);
            const cloudinaryUrl = await uploadAvatar(data.profileBgUrl);
            if (cloudinaryUrl) {
                data.profileBgUrl = cloudinaryUrl;
                console.log(`[updateProfileBg] Background uploaded: ${cloudinaryUrl.substring(0, 50)}...`);
            }
        }

        const user = await prisma.user.update({
            where: { id: userId },
            data: {
                profileBgUrl: data.profileBgUrl,
                profileBgScale: data.profileBgScale,
                profileBgPosX: data.profileBgPosX,
                profileBgPosY: data.profileBgPosY,
            },
            select: {
                id: true,
                profileBgUrl: true,
                profileBgScale: true,
                profileBgPosX: true,
                profileBgPosY: true,
            },
        });

        res.json(user);
    } catch (error) {
        if (error instanceof z.ZodError) {
            return res.status(400).json({ error: (error as any).errors });
        }
        console.error('Error updating profile background:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
};

// Claim Beta Reward - 500 Zions Points for beta users when v0.5.0 launches
const BETA_REWARD_POINTS = 500;

export const claimBetaReward = async (req: AuthRequest, res: Response) => {
    try {
        const userId = req.user?.userId;
        if (!userId) return res.status(401).json({ error: 'Unauthorized' });

        // Check if user exists and hasn't claimed yet
        const user = await prisma.user.findUnique({
            where: { id: userId },
            select: { id: true, betaRewardClaimed: true, zionsPoints: true }
        });

        if (!user) {
            return res.status(404).json({ error: 'User not found' });
        }

        // Check if already claimed
        if (user.betaRewardClaimed) {
            return res.status(400).json({ error: 'Beta reward already claimed' });
        }

        // Credit the reward
        const updatedUser = await prisma.user.update({
            where: { id: userId },
            data: {
                zionsPoints: { increment: BETA_REWARD_POINTS },
                betaRewardClaimed: true
            },
            select: {
                id: true,
                zionsPoints: true,
                betaRewardClaimed: true
            }
        });

        console.log(`[BetaReward] User ${userId} claimed ${BETA_REWARD_POINTS} Zions Points`);

        res.json({ 
            success: true, 
            pointsAwarded: BETA_REWARD_POINTS,
            newBalance: updatedUser.zionsPoints
        });
    } catch (error) {
        console.error('Error claiming beta reward:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
};

// Check if any admin is currently online (for support button)
export const checkAdminOnline = async (req: AuthRequest, res: Response) => {
    try {
        // Check if any admin user is online (seen in last 5 minutes)
        const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000);
        
        const onlineAdmin = await prisma.user.findFirst({
            where: {
                role: 'ADMIN',
                OR: [
                    { isOnline: true },
                    { lastSeenAt: { gte: fiveMinutesAgo } }
                ]
            },
            select: { 
                id: true,
                name: true,
                displayName: true,
                avatarUrl: true,
                membershipType: true,
                equippedProfileBorder: true
            },
            orderBy: { lastSeenAt: 'desc' }
        });

        res.json({ 
            isOnline: !!onlineAdmin,
            admin: onlineAdmin ? {
                id: onlineAdmin.id,
                name: onlineAdmin.name,
                displayName: onlineAdmin.displayName,
                avatarUrl: onlineAdmin.avatarUrl,
                membershipType: onlineAdmin.membershipType,
                equippedProfileBorder: onlineAdmin.equippedProfileBorder
            } : null
        });
    } catch (error) {
        console.error('Error checking admin online status:', error);
        res.json({ isOnline: false, admin: null });
    }
};

export const getMe = async (req: AuthRequest, res: Response) => {
    try {
        const userId = req.user?.userId;
        if (!userId) return res.status(401).json({ error: 'Unauthorized' });

        const user = await prisma.user.findUnique({
            where: { id: userId },
            select: {
                id: true,
                email: true,
                name: true,
                displayName: true,
                avatarUrl: true,
                bio: true,
                role: true,
                points: true,
                trophies: true,
                xp: true,
                zions: true,
                zionsPoints: true,
                zionsCash: true,
                level: true,
                createdAt: true,
                membershipType: true,
                ownedCustomizations: true,
                equippedBackground: true,
                equippedBadge: true,
                equippedColor: true,
                equippedProfileBorder: true,
                isVerified: true,
                profileBgUrl: true,
                profileBgScale: true,
                profileBgPosX: true,
                profileBgPosY: true,
                betaRewardClaimed: true,
                showWelcomeCard: true,
                // Elite subscription
                isElite: true,
                eliteUntil: true,
                eliteSince: true,
                eliteStreak: true,
                // Prestige system
                prestigeLevel: true,
                prestigeStars: true,
                lastPrestigedAt: true,
                _count: {
                    select: {
                        posts: true
                    }
                }
            },
        });

        if (!user) return res.status(404).json({ error: 'User not found' });

        // Parse ownedCustomizations from JSON string to array
        const userData = {
            ...user,
            ownedCustomizations: user.ownedCustomizations
                ? JSON.parse(user.ownedCustomizations)
                : [],
            postCount: user._count?.posts || 0
        };

        // Remove _count from response
        delete (userData as any)._count;

        res.json(userData);
    } catch (error) {
        res.status(500).json({ error: 'Internal server error' });
    }
};

export const updateMe = async (req: AuthRequest, res: Response) => {
    try {
        const userId = req.user?.userId;
        if (!userId) return res.status(401).json({ error: 'Unauthorized' });

        const data = updateProfileSchema.parse(req.body);

        // Upload avatar to Cloudinary CDN if base64 (reduces DB egress)
        if (data.avatarUrl && data.avatarUrl.startsWith('data:')) {
            console.log(`[updateMe] avatarUrl size: ${data.avatarUrl.length} chars, uploading to CDN...`);
            const cloudinaryUrl = await uploadAvatar(data.avatarUrl);
            if (cloudinaryUrl) {
                data.avatarUrl = cloudinaryUrl;
                console.log(`[updateMe] Avatar uploaded to CDN: ${cloudinaryUrl.substring(0, 50)}...`);
            }
        }

        // Security Check: Only ADMIN can update level, trophies, zions
        if ((data.level !== undefined || data.zions !== undefined || data.zionsPoints !== undefined || data.zionsCash !== undefined) && req.user?.role !== 'ADMIN') {
            // Strip them or throw error? Let's strip them to be safe or throw.
            // Given the context, throwing might be better to signal unauthorized attempt if someone tries.
            return res.status(403).json({ error: 'You are not authorized to update level or zions.' });
        }

        const user = await prisma.user.update({
            where: { id: userId },
            data,
            select: {
                id: true,
                email: true,
                name: true,
                displayName: true,
                avatarUrl: true,
                bio: true,
                role: true,
                points: true,
                trophies: true,
                zions: true,
                level: true,
                membershipType: true,
                updatedAt: true,
            },
        });

        // Check and award "Identidade Revelada" badge (First Profile Edit)
        try {
            const badgeName = 'Identidade Revelada';
            const badge = await prisma.badge.findFirst({ where: { name: badgeName } });

            if (badge) {
                const alreadyHas = await prisma.userBadge.findUnique({
                    where: {
                        userId_badgeId: {
                            userId,
                            badgeId: badge.id
                        }
                    }
                });

                if (!alreadyHas) {
                    await prisma.$transaction([
                        prisma.userBadge.create({
                            data: { userId, badgeId: badge.id }
                        }),
                        prisma.user.update({
                            where: { id: userId },
                            data: { trophies: { increment: badge.trophies } }
                        }),
                        prisma.notification.create({
                            data: {
                                userId,
                                type: 'BADGE',
                                content: `Você desbloqueou a conquista: ${badge.name}! (+${badge.trophies} Troféus)`
                            }
                        })
                    ]);
                    console.log(`[updateMe] Awarded badge: ${badgeName}`);
                }
            }
            
            // Check for "Perfil Completo" badge
            await checkProfileCompletionBadge(userId);
        } catch (badgeError) {
            console.error('[updateMe] Error checking badge:', badgeError);
            // Non-blocking error
        }

        res.json(user);
    } catch (error) {
        if (error instanceof z.ZodError) {
            return res.status(400).json({ error: (error as any).errors });
        }
        res.status(500).json({ error: 'Internal server error' });
    }
};

export const getUserProfile = async (req: AuthRequest, res: Response) => {
    try {
        const { id } = req.params;

        const user = await prisma.user.findUnique({
            where: { id },
            select: {
                id: true,
                name: true,
                displayName: true,
                avatarUrl: true,
                bio: true,
                level: true,
                trophies: true,
                createdAt: true,
                membershipType: true,
                equippedBackground: true,
                equippedBadge: true,
                equippedColor: true,
                equippedProfileBorder: true,
                profileBgUrl: true,
                profileBgScale: true,
                profileBgPosX: true,
                profileBgPosY: true,
                deletedAt: true,
                isVerified: true,
                isElite: true,
                eliteUntil: true,
            },
        });

        if (!user) return res.status(404).json({ error: 'User not found' });
        
        // Check if account was deleted
        if (user.deletedAt) {
            return res.status(410).json({ error: 'Esta conta foi excluída ou removida' });
        }

        // Remove deletedAt from response
        const { deletedAt, ...userResponse } = user;
        res.json(userResponse);
    } catch (error) {
        res.status(500).json({ error: 'Internal server error' });
    }
};

// Get user posts
export const getUserPosts = async (req: AuthRequest, res: Response) => {
    try {
        const { id } = req.params;

        const posts = await prisma.post.findMany({
            where: { userId: id },
            orderBy: { createdAt: 'desc' },
            include: {
                user: {
                    select: {
                        id: true,
                        name: true,
                        displayName: true,
                        avatarUrl: true,
                        trophies: true,
                    },
                },
                likes: true,
                tags: true,
            },
        });

        const formattedPosts = posts.map((post: any) => ({
            id: post.id,
            caption: post.caption,
            imageUrl: post.imageUrl,
            videoUrl: post.videoUrl,
            likesCount: post.likesCount,
            commentsCount: post.commentsCount,
            createdAt: post.createdAt,
            isHighlight: post.isHighlight,
            tags: post.tags,
            isLiked: post.likes.some((like: any) => like.userId === req.user?.userId),
        }));

        res.json(formattedPosts);
    } catch (error) {
        console.error('Error fetching user posts:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
};

export const updateUserMembership = async (req: AuthRequest, res: Response) => {
    try {
        // Check if user is admin
        const requestUser = await prisma.user.findUnique({
            where: { id: req.user?.userId }
        });

        if (requestUser?.role !== 'ADMIN') {
            return res.status(403).json({ error: 'Forbidden' });
        }

        const { id } = req.params;
        const { membershipType } = req.body;

        if (!['MAGAZINE', 'MGT'].includes(membershipType)) {
            return res.status(400).json({ error: 'Invalid membership type' });
        }

        const updatedUser = await prisma.user.update({
            where: { id },
            data: { membershipType },
            select: {
                id: true,
                name: true,
                email: true,
                role: true,
                membershipType: true
            }
        });

        res.json(updatedUser);
    } catch (error) {
        console.error('Error updating user membership:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
};

export const updateUserLevel = async (req: AuthRequest, res: Response) => {
    try {
        // Check if user is admin
        const requestUser = await prisma.user.findUnique({
            where: { id: req.user?.userId }
        });

        if (requestUser?.role !== 'ADMIN') {
            return res.status(403).json({ error: 'Forbidden' });
        }

        const { id } = req.params;
        const { level } = req.body;

        if (typeof level !== 'number' || level < 1 || level > 30) {
            return res.status(400).json({ error: 'Level must be a number between 1 and 30' });
        }

        const updatedUser = await prisma.user.update({
            where: { id },
            data: { level },
            select: {
                id: true,
                name: true,
                email: true,
                role: true,
                level: true
            }
        });

        res.json(updatedUser);
    } catch (error) {
        console.error('Error updating user level:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
};

export const getRecentMembers = async (req: AuthRequest, res: Response) => {
    try {
        const users = await prisma.user.findMany({
            take: 5,
            orderBy: { createdAt: 'desc' },
            select: {
                id: true,
                name: true,
                displayName: true,
                avatarUrl: true,
                role: true,
                membershipType: true,
                createdAt: true
            }
        });
        res.json(users);
    } catch (error) {
        console.error('Error fetching recent members:', error);
        res.status(500).json({ error: 'Failed to fetch recent members' });
    }
};

// ================= CUSTOMIZATION SHOP =================

// Available customization items (stored in code, not DB for simplicity)
const CUSTOMIZATION_ITEMS = {
    backgrounds: [
        { id: 'bg_galaxy', name: 'Galáxia', price: 500, type: 'animated', preview: '🌌' },
        { id: 'bg_aurora', name: 'Aurora Boreal', price: 600, type: 'animated', preview: '🌈' },
        { id: 'bg_retrowave', name: 'Retrowave', price: 850, type: 'animated', preview: '🌆' },
        { id: 'bg_fire', name: 'Fogo', price: 400, type: 'animated', preview: '🔥' },
        { id: 'bg_oceano', name: 'Oceano', price: 800, type: 'animated', preview: '🌊' },
        { id: 'bg_forest', name: 'Floresta', price: 300, type: 'static', preview: '🌲' },
        { id: 'bg_city', name: 'Cidade Neon', price: 550, type: 'animated', preview: '🌃' },
        { id: 'bg_space', name: 'Espaço Profundo', price: 700, type: 'animated', preview: '🚀' },
        // NOVOS FUNDOS
        { id: 'bg_sunset', name: 'Pôr do Sol', price: 650, type: 'animated', preview: '🌅' },
        { id: 'bg_cyberpunk', name: 'Cyberpunk', price: 750, type: 'animated', preview: '🤖' },
        { id: 'bg_lava', name: 'Lava', price: 800, type: 'animated', preview: '🌋' },
        { id: 'bg_ice', name: 'Gelo Ártico', price: 600, type: 'animated', preview: '❄️' },
        { id: 'bg_chuva_neon', name: 'Chuva Neon', price: 850, type: 'animated', preview: '🌧️' },
        { id: 'bg_emerald', name: 'Esmeralda', price: 700, type: 'static', preview: '💚' },
        { id: 'bg_royal', name: 'Real Púrpura', price: 900, type: 'animated', preview: '👑' },
        { id: 'bg_carbon', name: 'Fibra de Carbono', price: 500, type: 'static', preview: '⬛' },
        // FUNDOS ANIMADOS PREMIUM
        { id: 'anim-cosmic-triangles', name: 'Triângulos Cósmicos', price: 2500, type: 'animated', preview: '🔺' },
        { id: 'anim-gradient-waves', name: 'Ondas Gradiente', price: 2000, type: 'animated', preview: '🌊' },
        { id: 'anim-rainbow-skies', name: 'Rainbow Skies', price: 3000, type: 'animated', preview: '🌈' },
        { id: 'anim-infinite-triangles', name: 'Infinite Triangles', price: 3500, type: 'animated', preview: '🔷' },
        { id: 'anim-moonlit-sky', name: 'Moonlit Sky', price: 4000, type: 'animated', preview: '🌙' },
        { id: 'anim-dark-veil', name: 'Véu Sombrio', price: 5000, type: 'animated', preview: '🌑' },
        { id: 'anim-iridescence', name: 'Prisma Iridescente', price: 4500, type: 'animated', preview: '🔮' },
    ],
    badges: [
        { id: 'badge_skull', name: 'Caveira', price: 300, preview: 'https://img.icons8.com/?size=100&id=1aDNYh2zesKP&format=png&color=000000' },
        { id: 'badge_pony', name: 'Unicórnio', price: 250, preview: 'https://img.icons8.com/?size=100&id=16114&format=png&color=000000' },
        { id: 'badge_fire', name: 'Fogo', price: 200, preview: 'https://img.icons8.com/?size=100&id=NjzqV0aREXb6&format=png&color=000000' },
        { id: 'badge_diamond', name: 'Diamante', price: 500, preview: 'https://img.icons8.com/?size=100&id=8k9NF5LzoTVC&format=png&color=000000' },
        { id: 'badge_crown', name: 'Coroa', price: 600, preview: 'https://img.icons8.com/?size=100&id=hcZ65S78dSp6&format=png&color=000000' },
        { id: 'badge_star', name: 'Estrela', price: 350, preview: 'https://img.icons8.com/?size=100&id=PEfxi3mNT0kR&format=png&color=000000' },
        { id: 'badge_heart', name: 'Coração', price: 200, preview: 'https://img.icons8.com/?size=100&id=yQTLnfG3Agzl&format=png&color=000000' },
        { id: 'badge_lightning', name: 'Raio', price: 400, preview: 'https://img.icons8.com/?size=100&id=PEfxi3mNT0kR&format=png&color=000000' },
        { id: 'badge_moon', name: 'Lua', price: 300, preview: 'https://img.icons8.com/?size=100&id=6DXM8bs2tFSU&format=png&color=000000' },
        { id: 'badge_sun', name: 'Sol', price: 350, preview: 'https://img.icons8.com/?size=100&id=OIr0zJdeXCbg&format=png&color=000000' },
        { id: 'badge_seal', name: 'Foca', price: 250, preview: 'https://img.icons8.com/?size=100&id=FVRVluUvxBrh&format=png&color=000000' },
        { id: 'badge_shark', name: 'Grande Norke', price: 450, preview: 'https://img.icons8.com/?size=100&id=81021&format=png&color=000000' },
        { id: 'badge_egghead', name: 'Cabeça de Ovo', price: 350, preview: 'https://img.icons8.com/?size=100&id=_jtfUqyZM2Pw&format=png&color=000000' },
        { id: 'badge_xitada', name: 'Ta Xitada', price: 400, preview: 'https://img.icons8.com/?size=100&id=8S7SkmQtNOry&format=png&color=000000' },
    ],
    colors: [
        { id: 'color_rgb', name: 'RGB Dinâmico', price: 1000, hex: 'rgb-dynamic' },
        { id: 'color_cyan', name: 'Ciano Neon', price: 400, hex: '#00FFFF' },
        { id: 'color_magenta', name: 'Magenta Neon', price: 400, hex: '#FF00FF' },
        { id: 'color_lime', name: 'Verde Limão', price: 400, hex: '#00FF00' },
        { id: 'color_orange', name: 'Laranja Neon', price: 400, hex: '#FF6600' },
        { id: 'color_pink', name: 'Rosa Neon', price: 400, hex: '#FF69B4' },
        { id: 'color_blue', name: 'Azul Elétrico', price: 400, hex: '#0066FF' },
        { id: 'color_purple', name: 'Roxo Neon', price: 400, hex: '#9933FF' },
        { id: 'color_red', name: 'Vermelho Neon', price: 400, hex: '#FF0033' },
        // Pastel colors
        { id: 'color_pastel_pink', name: 'Rosa Pastel', price: 350, hex: '#ffb6c1' },
        { id: 'color_pastel_lavender', name: 'Lavanda Pastel', price: 350, hex: '#e6e6fa' },
        { id: 'color_pastel_mint', name: 'Menta Pastel', price: 350, hex: '#98fb98' },
        { id: 'color_pastel_peach', name: 'Pêssego Pastel', price: 350, hex: '#ffdab9' },
        { id: 'color_pastel_sky', name: 'Céu Pastel', price: 350, hex: '#87ceeb' },
        { id: 'color_pastel_coral', name: 'Coral Pastel', price: 350, hex: '#ffb5a7' },
        { id: 'color_pastel_lilac', name: 'Lilás Pastel', price: 350, hex: '#dda0dd' },
        { id: 'color_pastel_sage', name: 'Sálvia Pastel', price: 350, hex: '#9dc183' },
        { id: 'color_pastel_butter', name: 'Manteiga Pastel', price: 350, hex: '#fffacd' },
        { id: 'color_pastel_periwinkle', name: 'Pervinca Pastel', price: 350, hex: '#ccccff' },
        // Gradient colors
        { id: 'color_gradient_sunset', name: 'Pôr do Sol', price: 600, hex: 'linear-gradient(135deg, #ff6b35, #f72585)' },
        { id: 'color_gradient_ocean', name: 'Oceano', price: 600, hex: 'linear-gradient(135deg, #0077b6, #00f5d4)' },
        { id: 'color_gradient_aurora', name: 'Aurora Boreal', price: 600, hex: 'linear-gradient(135deg, #7b4397, #00d9ff)' },
        { id: 'color_gradient_fire', name: 'Fogo Infernal', price: 600, hex: 'linear-gradient(135deg, #ff0000, #ffc300)' },
        { id: 'color_gradient_galaxy', name: 'Galáxia', price: 600, hex: 'linear-gradient(135deg, #1a0033, #7303c0, #ec38bc)' },
        { id: 'color_gradient_neon', name: 'Neon Elétrico', price: 600, hex: 'linear-gradient(135deg, #ff00ff, #00ffff)' },
        { id: 'color_gradient_forest', name: 'Floresta Mística', price: 600, hex: 'linear-gradient(135deg, #134e5e, #71b280)' },
        { id: 'color_gradient_gold', name: 'Dourado Premium', price: 600, hex: 'linear-gradient(135deg, #8b7335, #d4af37, #f4e4a6)' },
        { id: 'color_gradient_midnight', name: 'Meia-Noite', price: 600, hex: 'linear-gradient(135deg, #0f0c29, #302b63, #24243e)' },
        { id: 'color_gradient_candy', name: 'Doce Intenso', price: 600, hex: 'linear-gradient(135deg, #ff9a9e, #fecfef, #a18cd1)' },
    ],
    profileBorders: [
        // Free defaults
        { id: 'border_gold', name: 'Dourado (Magazine)', price: 0, preview: '🟡' },
        { id: 'border_emerald', name: 'Esmeralda (MGT)', price: 0, preview: '💚' },
        // Pastel (400 Zions)
        { id: 'border_pastel_pink', name: 'Rosa Pastel', price: 400, preview: '🌸' },
        { id: 'border_pastel_lavender', name: 'Lavanda Pastel', price: 400, preview: '💜' },
        { id: 'border_pastel_mint', name: 'Menta Pastel', price: 400, preview: '🌿' },
        { id: 'border_pastel_peach', name: 'Pêssego Pastel', price: 400, preview: '🍑' },
        { id: 'border_pastel_sky', name: 'Céu Pastel', price: 400, preview: '☁️' },
        // Classic (500 Zions)
        { id: 'border_rose', name: 'Rosa', price: 500, preview: '🌹' },
        { id: 'border_blue', name: 'Azul', price: 500, preview: '💙' },
        { id: 'border_purple', name: 'Roxo', price: 500, preview: '💟' },
        { id: 'border_green', name: 'Verde', price: 500, preview: '💚' },
        { id: 'border_red', name: 'Vermelho', price: 500, preview: '❤️' },
        { id: 'border_cyan', name: 'Ciano', price: 500, preview: '🩵' },
        { id: 'border_orange', name: 'Laranja', price: 500, preview: '🧡' },
        // Mid-tier (600-800 Zions)
        { id: 'border_midnight', name: 'Meia-Noite', price: 600, preview: '🌙' },
        { id: 'border_ocean', name: 'Oceano', price: 700, preview: '🌊' },
        { id: 'border_forest', name: 'Floresta', price: 700, preview: '🌲' },
        { id: 'border_cherry_blossom', name: 'Flor de Cerejeira', price: 750, preview: '🌸' },
        { id: 'border_autumn', name: 'Outono', price: 750, preview: '🍂' },
        { id: 'border_cotton_candy', name: 'Algodão Doce', price: 800, preview: '🍬' },
        { id: 'border_ice', name: 'Gelo', price: 800, preview: '❄️' },
        // Premium (900-1200 Zions)
        { id: 'border_sunset', name: 'Pôr do Sol', price: 900, preview: '🌅' },
        { id: 'border_fire', name: 'Chamas', price: 1000, preview: '🔥' },
        { id: 'border_aurora', name: 'Aurora Boreal', price: 1100, preview: '✨' },
        { id: 'border_neon', name: 'Neon Vibes', price: 1100, preview: '💜' },
        { id: 'border_lava', name: 'Lava Vulcânica', price: 1100, preview: '🌋' },
        { id: 'border_electric', name: 'Elétrico', price: 1100, preview: '⚡' },
        { id: 'border_mystic', name: 'Místico', price: 1200, preview: '🔮' },
        { id: 'border_galaxy', name: 'Galáxia', price: 1200, preview: '🌌' },
        // Ultra Premium (1500-2500 Zions)
        { id: 'border_rainbow', name: 'Arco-Íris', price: 1500, preview: '🌈' },
        { id: 'border_diamond', name: 'Diamante', price: 2000, preview: '💎' },
        { id: 'border_platinum', name: 'Platina', price: 2000, preview: '🪙' },
        { id: 'border_holographic', name: 'Holográfico', price: 2500, preview: '🪩' },
        { id: 'border_cosmic', name: 'Cósmico', price: 2500, preview: '🪐' },
        { id: 'border_phoenix', name: 'Fênix', price: 2500, preview: '🦅' },
    ]
};

export const getCustomizations = async (req: AuthRequest, res: Response) => {
    try {
        const userId = req.user?.userId;

        const user = await prisma.user.findUnique({
            where: { id: userId },
            select: {
                zions: true,
                ownedCustomizations: true,
                equippedBackground: true,
                equippedBadge: true,
                equippedColor: true,
                equippedProfileBorder: true,
            }
        });

        if (!user) {
            return res.status(404).json({ error: 'User not found' });
        }

        // Parse owned customizations (stored as JSON string)
        const owned = user.ownedCustomizations ? JSON.parse(user.ownedCustomizations as string) : [];

        res.json({
            zions: user.zions,
            owned,
            equipped: {
                background: user.equippedBackground,
                badge: user.equippedBadge,
                color: user.equippedColor,
                profileBorder: user.equippedProfileBorder,
            },
            shop: CUSTOMIZATION_ITEMS
        });
    } catch (error) {
        console.error('Error fetching customizations:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
};

export const purchaseCustomization = async (req: AuthRequest, res: Response) => {
    try {
        const userId = req.user?.userId;
        const { itemId, category } = req.body;

        if (!itemId || !category) {
            return res.status(400).json({ error: 'Item ID and category required' });
        }

        // Find the item in our catalog
        const categoryItems = CUSTOMIZATION_ITEMS[category as keyof typeof CUSTOMIZATION_ITEMS];
        if (!categoryItems) {
            return res.status(400).json({ error: 'Invalid category' });
        }

        const item = categoryItems.find((i: any) => i.id === itemId);
        if (!item) {
            return res.status(404).json({ error: 'Item not found' });
        }

        const user = await prisma.user.findUnique({
            where: { id: userId },
            select: { zionsPoints: true, ownedCustomizations: true }
        });

        if (!user) {
            return res.status(404).json({ error: 'User not found' });
        }

        // Check if user has enough Zions Points
        if (user.zionsPoints < item.price) {
            return res.status(400).json({ error: 'Not enough Zions Points' });
        }

        // Check if already owned
        const owned = user.ownedCustomizations ? JSON.parse(user.ownedCustomizations as string) : [];
        if (owned.includes(itemId)) {
            return res.status(400).json({ error: 'Item already owned' });
        }

        // Purchase: deduct Zions Points and add to owned
        owned.push(itemId);

        await prisma.user.update({
            where: { id: userId },
            data: {
                zionsPoints: { decrement: item.price },
                ownedCustomizations: JSON.stringify(owned)
            }
        });

        // Check for "Consumista" badge (5 items bought)
        if (userId) {
            await checkPurchaseBadges(userId);
        }

        res.json({
            success: true,
            message: `${item.name} purchased successfully!`,
            newBalance: user.zionsPoints - item.price,
            owned
        });
    } catch (error) {
        console.error('Error purchasing customization:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
};

export const equipCustomization = async (req: AuthRequest, res: Response) => {
    try {
        const userId = req.user?.userId;
        const { itemId, category } = req.body;

        console.log('[equipCustomization] Request:', { userId, itemId, category });

        if (!itemId || !category) {
            console.log('[equipCustomization] Missing itemId or category');
            return res.status(400).json({ error: 'Item ID and category required' });
        }

        if (!userId) {
            console.log('[equipCustomization] No userId found');
            return res.status(401).json({ error: 'Unauthorized' });
        }

        const user = await prisma.user.findUnique({
            where: { id: userId },
            select: { ownedCustomizations: true }
        });

        if (!user) {
            console.log('[equipCustomization] User not found:', userId);
            return res.status(404).json({ error: 'User not found' });
        }

        // Default items (free) that don't require ownership - available for all users
        const defaultItemIds = ['bg_default', 'badge_crown', 'color_gold'];
        // MGT default items
        const mgtDefaultItems = ['badge_star', 'color_cyan', 'bg_galaxy'];
        const allDefaultItems = [...defaultItemIds, ...mgtDefaultItems];

        // Check if user owns this item (skip check for default items)
        if (!allDefaultItems.includes(itemId)) {
            const owned = user.ownedCustomizations ? JSON.parse(user.ownedCustomizations as string) : [];
            console.log('[equipCustomization] Owned items:', owned, 'Checking for:', itemId);
            if (!owned.includes(itemId)) {
                console.log('[equipCustomization] User does not own item:', itemId);
                return res.status(400).json({ error: 'You do not own this item' });
            }
        } else {
            console.log('[equipCustomization] Item is a default item, skipping ownership check:', itemId);
        }

        // Equip based on category
        const updateData: any = {};
        if (category === 'backgrounds') {
            updateData.equippedBackground = itemId;
        } else if (category === 'badges') {
            updateData.equippedBadge = itemId;
        } else if (category === 'colors') {
            updateData.equippedColor = itemId;
        } else if (category === 'profileBorders') {
            updateData.equippedProfileBorder = itemId;
        } else {
            console.log('[equipCustomization] Invalid category:', category);
            return res.status(400).json({ error: 'Invalid category' });
        }

        await prisma.user.update({
            where: { id: userId },
            data: updateData
        });

        console.log('[equipCustomization] Success:', { itemId, category });
        res.json({ success: true, message: 'Item equipped!' });
    } catch (error) {
        console.error('Error equipping customization:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
};

export const unequipCustomization = async (req: AuthRequest, res: Response) => {
    try {
        const userId = req.user?.userId;
        const { category } = req.body;

        if (!category) {
            return res.status(400).json({ error: 'Category required' });
        }

        // Unequip based on category
        const updateData: any = {};
        if (category === 'backgrounds') {
            updateData.equippedBackground = null;
        } else if (category === 'badges') {
            updateData.equippedBadge = null;
        } else if (category === 'colors') {
            updateData.equippedColor = null;
        } else if (category === 'profileBorders') {
            updateData.equippedProfileBorder = null;
        } else {
            return res.status(400).json({ error: 'Invalid category' });
        }

        await prisma.user.update({
            where: { id: userId },
            data: updateData
        });

        res.json({ success: true, message: 'Item unequipped!' });
    } catch (error) {
        console.error('Error unequipping customization:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
};

// ================= SEARCH =================

export const searchAll = async (req: AuthRequest, res: Response) => {
    try {
        const { q } = req.query;

        if (!q || typeof q !== 'string') {
            return res.status(400).json({ error: 'Search query required' });
        }

        const searchTerm = q.trim().toLowerCase();

        // Search users
        const users = await prisma.user.findMany({
            where: {
                OR: [
                    { name: { contains: searchTerm, mode: 'insensitive' } },
                    { displayName: { contains: searchTerm, mode: 'insensitive' } },
                ],
                deletedAt: null
            },
            take: 10,
            select: {
                id: true,
                name: true,
                displayName: true,
                avatarUrl: true,
                level: true,
                membershipType: true
            }
        });

        // Search posts by caption
        const posts = await prisma.post.findMany({
            where: {
                caption: { contains: searchTerm, mode: 'insensitive' }
            },
            take: 10,
            include: {
                user: {
                    select: {
                        id: true,
                        name: true,
                        displayName: true,
                        avatarUrl: true
                    }
                }
            },
            orderBy: { createdAt: 'desc' }
        });

        res.json({
            users: users.map(u => ({ ...u, type: 'user' })),
            posts: posts.map(p => ({ ...p, type: 'post' }))
        });
    } catch (error) {
        console.error('Error searching:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
};

// Update user preferences (doNotDisturb, liteMode, showWelcomeCard)
export const updatePreferences = async (req: AuthRequest, res: Response) => {
    try {
        const userId = req.user?.userId;
        if (!userId) return res.status(401).json({ error: 'Unauthorized' });

        const { doNotDisturb, liteMode, showWelcomeCard } = req.body;

        const updateData: any = {};
        if (typeof doNotDisturb === 'boolean') updateData.doNotDisturb = doNotDisturb;
        if (typeof liteMode === 'boolean') updateData.liteMode = liteMode;
        if (typeof showWelcomeCard === 'boolean') updateData.showWelcomeCard = showWelcomeCard;

        const user = await prisma.user.update({
            where: { id: userId },
            data: updateData,
            select: {
                id: true,
                doNotDisturb: true,
                liteMode: true,
                showWelcomeCard: true,
                isOnline: true
            }
        });

        res.json(user);
    } catch (error) {
        console.error('Error updating preferences:', error);
        res.status(500).json({ error: 'Failed to update preferences' });
    }
};
