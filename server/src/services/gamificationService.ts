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

export const awardZions = async (userId: string, amount: number, reason: string, currency: 'POINTS' | 'CASH' = 'POINTS') => {
    try {
        // Update user zions
        const [updatedUser] = await prisma.$transaction([
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
                    reason,
                    currency
                }
            })
        ]);

        console.log(`Awarded ${amount} Zions to user ${userId} for ${reason}`);

        // Check for Zion-related badges
        const newZionsTotal = updatedUser.zions;

        // Helper function to award badge
        const awardZionBadge = async (badgeName: string, threshold: number) => {
            if (newZionsTotal >= threshold) {
                const badge = await prisma.badge.findFirst({ where: { name: badgeName } });
                if (badge) {
                    const existing = await prisma.userBadge.findUnique({
                        where: { userId_badgeId: { userId, badgeId: badge.id } }
                    });
                    if (!existing) {
                        await prisma.userBadge.create({ data: { userId, badgeId: badge.id } });
                        await prisma.user.update({ where: { id: userId }, data: { trophies: { increment: badge.trophies } } });
                        await prisma.notification.create({
                            data: { userId, type: 'ACHIEVEMENT', content: `Você desbloqueou a conquista: ${badge.name}! (+${badge.trophies} Troféus)` }
                        });
                    }
                }
            }
        };

        // Colecionador de Zions (100 Zions)
        await awardZionBadge('Colecionador de Zions', 100);
        
        // Poupador (1.000 Zions)
        await awardZionBadge('Poupador', 1000);
        
        // Burguês (10.000 Zions)
        await awardZionBadge('Burguês', 10000);

        // Milionário (1.000.000 Zions)
        await awardZionBadge('Milionário', 1000000);

        return amount;
    } catch (error) {
        console.error('Error awarding zions:', error);
        throw error;
    }
};

export const checkAndAwardBadges = async (userId: string, actionType: 'POST' | 'LIKE' | 'COMMENT' | 'LOGIN' | 'STORY' | 'VIDEO') => {
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

            // Create notification for achievement
            await prisma.notification.create({
                data: {
                    userId,
                    type: 'ACHIEVEMENT',
                    content: `Você desbloqueou a conquista: ${badge.name}! (+${badge.trophies} Troféus)`
                }
            });

            newBadges.push(badgeName);
            awardedBadges.push(badge);
        };

        // --- CONTENT CREATION BADGES ---
        if (actionType === 'POST') {
            // Primeira Voz (First Post)
            if (user.posts.length === 1) {
                await awardBadge('Primeira Voz');
            }
            // Criador de Conteúdo (5 Posts)
            if (user.posts.length >= 5) {
                await awardBadge('Criador de Conteúdo');
            }
            // Blogueiro (20 Posts)
            if (user.posts.length >= 20) {
                await awardBadge('Blogueiro');
            }
            // Editor Chefe (50 Posts)
            if (user.posts.length >= 50) {
                await awardBadge('Editor Chefe');
            }
        }

        // Cineasta (10 Videos)
        if (actionType === 'VIDEO' || actionType === 'POST') {
            const videoCount = user.posts.filter((p: any) => p.mediaType === 'VIDEO').length;
            if (videoCount >= 10) {
                await awardBadge('Cineasta');
            }
        }

        // Storyteller (20 Stories) - check stories count from stories relation
        if (actionType === 'STORY' || actionType === 'POST') {
            const storyCount = await prisma.story.count({ where: { userId } });
            if (storyCount >= 20) {
                await awardBadge('Storyteller');
            }
        }

        // --- COMMENT BADGES ---
        if (actionType === 'COMMENT') {
            // Comentador (First Comment)
            if (user.comments.length === 1) {
                await awardBadge('Comentador');
            }
            // Socialite (10 Comments)
            if (user.comments.length >= 10) {
                await awardBadge('Socialite');
            }
            // Debatedor (50 Comments)
            if (user.comments.length >= 50) {
                await awardBadge('Debatedor');
            }
            // Tagarela (100 Comments)
            if (user.comments.length >= 100) {
                await awardBadge('Tagarela');
            }
        }

        // --- LIKE BADGES ---
        if (actionType === 'LIKE') {
            // Engajado (50 Likes given)
            if (user.likes.length >= 50) {
                await awardBadge('Engajado');
            }
            // Super Fã (100 Likes given)
            if (user.likes.length >= 100) {
                await awardBadge('Super Fã');
            }
            // Super Like (500 Likes given)
            if (user.likes.length >= 500) {
                await awardBadge('Super Like');
            }
        }

        // --- POPULARITY BADGES (check on multiple actions) ---
        if (actionType === 'LOGIN' || actionType === 'POST' || actionType === 'LIKE') {
            const totalLikesReceived = await prisma.post.aggregate({
                where: { userId },
                _sum: { likesCount: true }
            });

            const likesReceived = totalLikesReceived._sum.likesCount || 0;

            // Influenciador (50 Likes received)
            if (likesReceived >= 50) {
                await awardBadge('Influenciador');
            }
            // Ícone (100 Likes received)
            if (likesReceived >= 100) {
                await awardBadge('Ícone');
            }
            // Top Voice (500 Likes received)
            if (likesReceived >= 500) {
                await awardBadge('Top Voice');
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

        // --- BADGE COLLECTION BADGES ---
        const totalBadges = user.badges.length + newBadges.length;
        if (totalBadges >= 5) {
            await awardBadge('Colecionador');
        }
        if (totalBadges >= 15) {
            await awardBadge('Museu Vivo');
        }
        if (totalBadges >= 30) {
            await awardBadge('Lenda');
        }

        return { newBadges, awardedBadges };

    } catch (error) {
        console.error('Error checking badges:', error);
        return { newBadges: [], awardedBadges: [] };
    }
};

// ====== FRIENDSHIP BADGES ======
export const checkFriendshipBadges = async (userId: string) => {
    try {
        // Count accepted friendships
        const friendCount = await prisma.friendship.count({
            where: {
                OR: [
                    { requesterId: userId, status: 'ACCEPTED' },
                    { addresseeId: userId, status: 'ACCEPTED' }
                ]
            }
        });

        const user = await prisma.user.findUnique({
            where: { id: userId },
            include: {
                badges: { include: { badge: true } }
            }
        });

        if (!user) return;

        const awardBadgeIfNew = async (badgeName: string) => {
            const hasBadge = user.badges.some((ub: any) => ub.badge.name === badgeName);
            if (hasBadge) return;

            const badge = await prisma.badge.findFirst({ where: { name: badgeName } });
            if (!badge) return;

            await prisma.userBadge.create({ data: { userId, badgeId: badge.id } });
            await prisma.user.update({ where: { id: userId }, data: { trophies: { increment: badge.trophies } } });
            await prisma.notification.create({
                data: { userId, type: 'ACHIEVEMENT', content: `Você desbloqueou a conquista: ${badge.name}! (+${badge.trophies} Troféus)` }
            });
        };

        // Roda de Amigos (10 friends)
        if (friendCount >= 10) {
            await awardBadgeIfNew('Roda de Amigos');
        }
        // Popular (50 friends) - already checked in socialController
        if (friendCount >= 50) {
            await awardBadgeIfNew('Popular');
        }
        // Celebridade (100 friends)
        if (friendCount >= 100) {
            await awardBadgeIfNew('Celebridade');
        }
    } catch (error) {
        console.error('Error checking friendship badges:', error);
    }
};

// ====== LOGIN STREAK BADGES ======
export const checkLoginStreakBadges = async (userId: string, streak: number) => {
    try {
        const user = await prisma.user.findUnique({
            where: { id: userId },
            include: { badges: { include: { badge: true } } }
        });

        if (!user) return;

        const awardBadgeIfNew = async (badgeName: string) => {
            const hasBadge = user.badges.some((ub: any) => ub.badge.name === badgeName);
            if (hasBadge) return;

            const badge = await prisma.badge.findFirst({ where: { name: badgeName } });
            if (!badge) return;

            await prisma.userBadge.create({ data: { userId, badgeId: badge.id } });
            await prisma.user.update({ where: { id: userId }, data: { trophies: { increment: badge.trophies } } });
            await prisma.notification.create({
                data: { userId, type: 'ACHIEVEMENT', content: `Você desbloqueou a conquista: ${badge.name}! (+${badge.trophies} Troféus)` }
            });
        };

        // Conectado (7 days streak)
        if (streak >= 7) {
            await awardBadgeIfNew('Conectado');
        }
        // Dedicado (14 days streak)
        if (streak >= 14) {
            await awardBadgeIfNew('Dedicado');
        }
        // Viciado (30 days streak)
        if (streak >= 30) {
            await awardBadgeIfNew('Viciado');
        }
    } catch (error) {
        console.error('Error checking login streak badges:', error);
    }
};

// ====== SHOP & PURCHASE BADGES ======
export const checkPurchaseBadges = async (userId: string) => {
    try {
        const user = await prisma.user.findUnique({
            where: { id: userId },
            include: { badges: { include: { badge: true } } }
        });

        if (!user) return;
        
        // Count purchased items
        const ownedItems = user.ownedCustomizations ? JSON.parse(user.ownedCustomizations as string) : [];
        
        const awardBadgeIfNew = async (badgeName: string) => {
            const hasBadge = user.badges.some((ub: any) => ub.badge.name === badgeName);
            if (hasBadge) return;

            const badge = await prisma.badge.findFirst({ where: { name: badgeName } });
            if (!badge) return;

            await prisma.userBadge.create({ data: { userId, badgeId: badge.id } });
            await prisma.user.update({ where: { id: userId }, data: { trophies: { increment: badge.trophies } } });
            await prisma.notification.create({
                data: { userId, type: 'ACHIEVEMENT', content: `Você desbloqueou a conquista: ${badge.name}! (+${badge.trophies} Troféus)` }
            });
        };

        // Consumista (5 items bought)
        if (ownedItems.length >= 5) {
            await awardBadgeIfNew('Consumista');
        }
    } catch (error) {
        console.error('Error checking purchase badges:', error);
    }
};

// ====== REWARD REDEMPTION BADGES ======
export const checkRewardBadges = async (userId: string) => {
    try {
        // Count redemptions
        const redemptionCount = await prisma.redemption.count({
            where: { userId }
        });

        const user = await prisma.user.findUnique({
            where: { id: userId },
            include: { 
                badges: { include: { badge: true } }
            }
        });

        if (!user) return;
        
        const awardBadgeIfNew = async (badgeName: string) => {
            const hasBadge = user.badges.some((ub: any) => ub.badge.name === badgeName);
            if (hasBadge) return;

            const badge = await prisma.badge.findFirst({ where: { name: badgeName } });
            if (!badge) return;

            await prisma.userBadge.create({ data: { userId, badgeId: badge.id } });
            await prisma.user.update({ where: { id: userId }, data: { trophies: { increment: badge.trophies } } });
            await prisma.notification.create({
                data: { userId, type: 'ACHIEVEMENT', content: `Você desbloqueou a conquista: ${badge.name}! (+${badge.trophies} Troféus)` }
            });
        };

        // Rei do Cashback (10 rewards redeemed)
        if (redemptionCount >= 10) {
            await awardBadgeIfNew('Rei do Cashback');
        }
    } catch (error) {
        console.error('Error checking reward badges:', error);
    }
};

// ====== PROFILE COMPLETION BADGE ======
export const checkProfileCompletionBadge = async (userId: string) => {
    try {
        const user = await prisma.user.findUnique({
            where: { id: userId },
            include: { badges: { include: { badge: true } } }
        });

        if (!user) return;

        // Check if profile is complete (essential fields)
        const isComplete = !!(
            user.displayName &&
            user.bio &&
            user.avatarUrl &&
            user.profileBgUrl // Profile background image
        );

        if (!isComplete) return;

        const hasBadge = user.badges.some((ub: any) => ub.badge.name === 'Perfil Completo');
        if (hasBadge) return;

        const badge = await prisma.badge.findFirst({ where: { name: 'Perfil Completo' } });
        if (!badge) return;

        await prisma.userBadge.create({ data: { userId, badgeId: badge.id } });
        await prisma.user.update({ where: { id: userId }, data: { trophies: { increment: badge.trophies } } });
        await prisma.notification.create({
            data: { userId, type: 'ACHIEVEMENT', content: `Você desbloqueou a conquista: ${badge.name}! (+${badge.trophies} Troféus)` }
        });
    } catch (error) {
        console.error('Error checking profile completion badge:', error);
    }
};

// ====== VIP/MGT BADGE ======
export const checkVIPBadge = async (userId: string) => {
    try {
        const user = await prisma.user.findUnique({
            where: { id: userId },
            include: { badges: { include: { badge: true } } }
        });

        if (!user || user.membershipType !== 'MGT') return;

        const hasBadge = user.badges.some((ub: any) => ub.badge.name === 'VIP');
        if (hasBadge) return;

        const badge = await prisma.badge.findFirst({ where: { name: 'VIP' } });
        if (!badge) return;

        await prisma.userBadge.create({ data: { userId, badgeId: badge.id } });
        await prisma.user.update({ where: { id: userId }, data: { trophies: { increment: badge.trophies } } });
        await prisma.notification.create({
            data: { userId, type: 'ACHIEVEMENT', content: `Você desbloqueou a conquista: ${badge.name}! (+${badge.trophies} Troféus)` }
        });
    } catch (error) {
        console.error('Error checking VIP badge:', error);
    }
};

// ====== REPORT BADGE (XERIFE) ======
export const checkReportBadge = async (userId: string) => {
    try {
        const user = await prisma.user.findUnique({
            where: { id: userId },
            include: { badges: { include: { badge: true } } }
        });

        if (!user) return;

        const hasBadge = user.badges.some((ub: any) => ub.badge.name === 'Xerife');
        if (hasBadge) return;

        const badge = await prisma.badge.findFirst({ where: { name: 'Xerife' } });
        if (!badge) return;

        await prisma.userBadge.create({ data: { userId, badgeId: badge.id } });
        await prisma.user.update({ where: { id: userId }, data: { trophies: { increment: badge.trophies } } });
        await prisma.notification.create({
            data: { userId, type: 'ACHIEVEMENT', content: `Você desbloqueou a conquista: ${badge.name}! (+${badge.trophies} Troféus)` }
        });
    } catch (error) {
        console.error('Error checking report badge:', error);
    }
};

// ====== GROUP CREATOR BADGE (ANFITRIÃO) ======
export const checkGroupCreatorBadge = async (userId: string) => {
    try {
        const user = await prisma.user.findUnique({
            where: { id: userId },
            include: { badges: { include: { badge: true } } }
        });

        if (!user) return;

        const hasBadge = user.badges.some((ub: any) => ub.badge.name === 'Anfitrião');
        if (hasBadge) return;

        const badge = await prisma.badge.findFirst({ where: { name: 'Anfitrião' } });
        if (!badge) return;

        await prisma.userBadge.create({ data: { userId, badgeId: badge.id } });
        await prisma.user.update({ where: { id: userId }, data: { trophies: { increment: badge.trophies } } });
        await prisma.notification.create({
            data: { userId, type: 'ACHIEVEMENT', content: `Você desbloqueou a conquista: ${badge.name}! (+${badge.trophies} Troféus)` }
        });
    } catch (error) {
        console.error('Error checking group creator badge:', error);
    }
};
