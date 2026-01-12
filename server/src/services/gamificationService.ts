import prisma from '../utils/prisma';

// XP Table: Level X requires XP_TABLE[X-1] total XP
// Formula: Base 1000, increasing difficulty
export const XP_TABLE = Array.from({ length: 30 }, (_, i) => {
    const level = i + 1;
    if (level === 1) return 0;
    // Simple curve: Level 2 = 1000, Level 3 = 2500, etc.
    // Using a quadratic-ish progression
    return Math.floor(1000 * Math.pow(level - 1, 1.2));
});

export const getLevelFromXP = (xp: number): number => {
    for (let i = XP_TABLE.length - 1; i >= 0; i--) {
        if (xp >= XP_TABLE[i]) {
            return i + 1;
        }
    }
    return 1;
};

export const awardXP = async (userId: string, amount: number, reason: string) => {
    try {
        // 1. Get current user data
        const user = await prisma.user.findUnique({
            where: { id: userId },
            select: { id: true, xp: true, level: true }
        });

        if (!user) throw new Error('User not found');

        const newXP = user.xp + amount;
        const newLevel = getLevelFromXP(newXP);
        const levelUp = newLevel > user.level;

        // 2. Update User
        const updatedUser = await prisma.user.update({
            where: { id: userId },
            data: {
                xp: newXP,
                level: levelUp ? newLevel : undefined
            }
        });

        // 3. Log/Notify if Level Up
        if (levelUp) {
            console.log(`User ${userId} leveled up to ${newLevel}!`);

            // Create a system notification for level up
            await prisma.notification.create({
                data: {
                    userId,
                    type: 'SYSTEM',
                    content: JSON.stringify({
                        text: `Parabéns! Você alcançou o Nível ${newLevel}!`,
                        title: 'Level Up!',
                        level: newLevel
                    })
                }
            });

            // Optional: Award bonus Zions for leveling up?
            // await awardZions(userId, newLevel * 10, `Level Up Bonus (Lvl ${newLevel})`);
        }

        return {
            user: updatedUser,
            xpEarned: amount,
            levelUp,
            newLevel
        };

    } catch (error) {
        console.error('Error awarding XP:', error);
        throw error;
    }
};

export const awardTrophies = async (userId: string, amount: number, reason: string) => {
    try {
        // Update user trophies
        const user = await prisma.user.update({
            where: { id: userId },
            data: {
                trophies: { increment: amount }
            }
        });

        console.log(`Awarded ${amount} trophies to user ${userId} for ${reason}`);
        return user;
    } catch (error) {
        console.error('Error awarding trophies:', error);
        throw error;
    }
};

export const awardZions = async (userId: string, amount: number, reason: string) => {
    try {
        // Update user zions
        await prisma.$transaction([
            prisma.user.update({
                where: { id: userId },
                data: {
                    zions: { increment: amount }
                }
            }),
            prisma.zionHistory.create({
                data: {
                    userId,
                    amount,
                    reason
                }
            })
        ]);

        console.log(`Awarded ${amount} Zions to user ${userId} for ${reason}`);
        return amount;
    } catch (error) {
        console.error('Error awarding zions:', error);
        throw error;
    }
};

export const checkAndAwardBadges = async (userId: string, actionType: 'POST' | 'LIKE' | 'COMMENT' | 'LOGIN') => {
    try {
        const user = await prisma.user.findUnique({
            where: { id: userId },
            include: {
                posts: true,
                comments: true,
                likes: true,
                badges: { include: { badge: true } }
            }
        });

        if (!user) return null;

        const newBadges: string[] = [];
        const awardedBadges: any[] = [];

        // Helper to award badge
        const awardBadge = async (badgeName: string) => {
            // Check if user already has this badge
            const hasBadge = user.badges.some(ub => ub.badge.name === badgeName);
            if (hasBadge) return;

            // Find badge in DB
            const badge = await prisma.badge.findFirst({ where: { name: badgeName } });
            if (!badge) {
                console.warn(`Badge ${badgeName} not found in DB`);
                return;
            }

            // Award badge
            await prisma.userBadge.create({
                data: {
                    userId,
                    badgeId: badge.id
                }
            });

            // Award trophies for the badge
            if (badge.trophies > 0) {
                await awardTrophies(userId, badge.trophies, `Badge: ${badgeName}`);
            }

            newBadges.push(badgeName);
            awardedBadges.push(badge);
        };

        // --- BADGE LOGIC ---

        // 1. Primeira Voz (First Post)
        if (actionType === 'POST' && user.posts.length === 1) {
            await awardBadge('Primeira Voz');
        }

        // 2. Criador de Conteúdo (5 Posts)
        if (actionType === 'POST' && user.posts.length === 5) {
            await awardBadge('Criador de Conteúdo');
        }

        // Blogueiro (20 Posts)
        if (actionType === 'POST' && user.posts.length === 20) {
            await awardBadge('Blogueiro');
        }

        // Editor Chefe (50 Posts)
        if (actionType === 'POST' && user.posts.length === 50) {
            await awardBadge('Editor Chefe');
        }

        // 3. Socialite (10 Comments)
        if (actionType === 'COMMENT' && user.comments.length === 10) {
            await awardBadge('Socialite');
        }

        // Debatedor (50 Comments)
        if (actionType === 'COMMENT' && user.comments.length === 50) {
            await awardBadge('Debatedor');
        }

        // Comentador (First Comment)
        if (actionType === 'COMMENT' && user.comments.length === 1) {
            await awardBadge('Comentador');
        }

        // 4. Engajado (50 Likes given)
        if (actionType === 'LIKE' && user.likes.length === 50) {
            await awardBadge('Engajado');
        }

        // Super Fã (100 Likes given)
        if (actionType === 'LIKE' && user.likes.length === 100) {
            await awardBadge('Super Fã');
        }

        // 5. Influenciador (50 Likes received) & popularity badges
        if (actionType === 'LOGIN' || actionType === 'POST' || actionType === 'LIKE') {
            const totalLikesReceived = await prisma.post.aggregate({
                where: { userId },
                _sum: { likesCount: true }
            });

            const likesReceived = totalLikesReceived._sum.likesCount || 0;

            if (likesReceived >= 50) {
                await awardBadge('Influenciador');
            }

            if (likesReceived >= 100) {
                await awardBadge('Ícone');
            }

            // Viral (50 comments received on posts)
            const totalCommentsReceived = await prisma.post.aggregate({
                where: { userId },
                _sum: { commentsCount: true }
            });

            if ((totalCommentsReceived._sum.commentsCount || 0) >= 50) {
                await awardBadge('Viral');
            }
        }

        return { newBadges, awardedBadges };

    } catch (error) {
        console.error('Error checking badges:', error);
        return { newBadges: [], awardedBadges: [] };
    }
};
