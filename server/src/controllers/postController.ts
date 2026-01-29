import { Response } from 'express';
import prisma from '../utils/prisma';
import { z } from 'zod';
import { AuthRequest } from '../middleware/authMiddleware';
import { awardTrophies, checkAndAwardBadges, awardZions, awardXP } from '../services/gamificationService';

const createPostSchema = z.object({
    caption: z.string().optional(),
    imageUrl: z.string().optional(),
    videoUrl: z.string().optional(),
    tags: z.array(z.string()).optional(),
    isHighlight: z.boolean().optional(),
    mediaType: z.enum(['IMAGE', 'VIDEO', 'TEXT']).default('IMAGE'),
    linkedProductId: z.string().nullable().optional(),
    // Enquete
    pollQuestion: z.string().optional(),
    pollOptions: z.array(z.string()).optional(),
});

export const createPost = async (req: AuthRequest, res: Response) => {
    try {
        const userId = req.user?.userId;
        if (!userId) return res.status(401).json({ error: 'Unauthorized' });

        const data = createPostSchema.parse(req.body);

        // Check for highlight eligibility and cost
        if (data.isHighlight) {
            const user = await prisma.user.findUnique({ where: { id: userId } });

            // If user is not found, return error
            if (!user) return res.status(401).json({ error: 'User not found' });

            // If NOT admin, check balance and deduct
            if (user.role !== 'ADMIN') {
                if (user.zions < 300) {
                    return res.status(403).json({ error: 'Zions insuficientes para destaque (Custo: 300 Zions)' });
                }

                // Deduct Zions
                await prisma.user.update({
                    where: { id: userId },
                    data: { zions: { decrement: 300 } }
                });

                // Log transaction
                await prisma.zionHistory.create({
                    data: {
                        userId,
                        amount: -300,
                        reason: 'Highlight Post Cost'
                    }
                });
            }
        }

        // Validate linkedProductId if provided
        let validLinkedProductId: string | null = null;
        if (data.linkedProductId) {
            const product = await prisma.product.findUnique({
                where: { id: data.linkedProductId }
            });
            if (product) {
                validLinkedProductId = data.linkedProductId;
            }
        }

        const post = await prisma.post.create({
            data: {
                userId,
                caption: data.caption,
                imageUrl: data.imageUrl,
                videoUrl: data.videoUrl,
                isHighlight: data.isHighlight || false,
                mediaType: data.mediaType,
                linkedProductId: validLinkedProductId,
                pollQuestion: data.pollOptions?.length ? (data.pollQuestion || data.caption || 'Enquete') : null,
                tags: {
                    create: data.tags?.map(tag => ({ tag })) || [],
                },
                pollOptions: data.pollOptions?.length ? {
                    create: data.pollOptions.filter(opt => opt.trim()).map(text => ({ text }))
                } : undefined,
            },
            include: {
                user: {
                    select: {
                        id: true,
                        name: true,
                        avatarUrl: true,
                        trophies: true,
                    }
                },
                tags: true,
                pollOptions: {
                    include: {
                        votes: true
                    }
                },
                linkedProduct: {
                    select: {
                        id: true,
                        name: true,
                        imageUrl: true,
                        priceZions: true,
                        priceBRL: true,
                    }
                }
            }
        });

        // --- GAMIFICATION ---

        // 1. Award Zions (1) and XP (10)
        await awardZions(userId, 1, 'Created a post');
        await awardXP(userId, 10, 'Created a post');

        // 2. Check Badges (Trophies awarded if badge earned)
        const badgeResult = await checkAndAwardBadges(userId, 'POST');

        res.status(201).json({
            ...post,
            newBadges: badgeResult?.newBadges || [],
            zionsEarned: 1
        });
    } catch (error) {
        if (error instanceof z.ZodError) {
            return res.status(400).json({ error: (error as any).errors });
        }
        console.error(error);
        res.status(500).json({ error: 'Internal server error' });
    }
};

export const getPosts = async (req: AuthRequest, res: Response) => {
    try {
        const posts = await prisma.post.findMany({
            orderBy: { createdAt: 'desc' },
            include: {
                user: {
                    select: {
                        id: true,
                        name: true,
                        avatarUrl: true,
                        trophies: true,
                        membershipType: true,
                        equippedProfileBorder: true,
                    }
                },
                tags: true,
                likes: true,
                comments: true,
            }
        });
        res.json(posts);
    } catch (error) {
        res.status(500).json({ error: 'Internal server error' });
    }
};

export const deletePost = async (req: AuthRequest, res: Response) => {
    try {
        const userId = req.user?.userId;
        const { id } = req.params;

        if (!userId) return res.status(401).json({ error: 'Unauthorized' });

        const post = await prisma.post.findUnique({ where: { id } });
        if (!post) return res.status(404).json({ error: 'Post not found' });

        // Check if user is admin
        const user = await prisma.user.findUnique({ where: { id: userId } });
        const isAdmin = user?.role === 'ADMIN';

        // Only allow deletion if owner or admin
        if (post.userId !== userId && !isAdmin) {
            return res.status(403).json({ error: 'Unauthorized' });
        }

        // Check if this is the user's last post (to remove 'Primeira Voz' badge)
        const userPostCount = await prisma.post.count({ where: { userId: post.userId } });
        const isLastPost = userPostCount === 1;

        // Delete related records first (cascading delete manually)
        await prisma.$transaction([
            prisma.comment.deleteMany({ where: { postId: id } }),
            prisma.like.deleteMany({ where: { postId: id } }),
            prisma.postTag.deleteMany({ where: { postId: id } }),
            prisma.post.delete({ where: { id } })
        ]);

        // If this was the user's last post, remove 'Primeira Voz' badge and trophies
        if (isLastPost) {
            const primeiraVozBadge = await prisma.badge.findFirst({ where: { name: 'Primeira Voz' } });
            if (primeiraVozBadge) {
                // Remove the badge from the post owner (not admin)
                await prisma.userBadge.deleteMany({
                    where: {
                        userId: post.userId,
                        badgeId: primeiraVozBadge.id
                    }
                });

                // Remove the trophies associated with the badge from post owner
                if (primeiraVozBadge.trophies > 0) {
                    await prisma.user.update({
                        where: { id: post.userId },
                        data: {
                            trophies: {
                                decrement: primeiraVozBadge.trophies
                            }
                        }
                    });
                }
            }
        }

        res.json({ message: 'Post deleted' });
    } catch (error) {
        res.status(500).json({ error: 'Internal server error' });
    }
};

export const getComments = async (req: AuthRequest, res: Response) => {
    try {
        const { postId } = req.params;
        const comments = await prisma.comment.findMany({
            where: { postId },
            orderBy: { createdAt: 'asc' },
            include: {
                user: {
                    select: {
                        id: true,
                        name: true,
                        displayName: true,
                        avatarUrl: true,
                    }
                }
            }
        });
        res.json(comments);
    } catch (error) {
        res.status(500).json({ error: 'Internal server error' });
    }
};

// Votar em uma enquete
export const votePoll = async (req: AuthRequest, res: Response) => {
    try {
        const userId = req.user?.userId;
        if (!userId) return res.status(401).json({ error: 'Não autorizado' });

        const { optionId } = req.body;
        if (!optionId) return res.status(400).json({ error: 'ID da opção é obrigatório' });

        // Verificar se a opção existe e obter o postId
        const option = await prisma.pollOption.findUnique({
            where: { id: optionId },
            include: { post: true }
        });

        if (!option) return res.status(404).json({ error: 'Opção não encontrada' });

        // Verificar se o usuário já votou em alguma opção deste post
        const existingVote = await prisma.pollVote.findFirst({
            where: {
                userId,
                option: {
                    postId: option.postId
                }
            }
        });

        if (existingVote) {
            // Se votou na mesma opção, remove o voto
            if (existingVote.optionId === optionId) {
                await prisma.pollVote.delete({ where: { id: existingVote.id } });
                return res.json({ message: 'Voto removido', voted: false });
            }
            // Se votou em outra opção, muda o voto
            await prisma.pollVote.update({
                where: { id: existingVote.id },
                data: { optionId }
            });
            return res.json({ message: 'Voto alterado', voted: true, optionId });
        }

        // Criar novo voto
        await prisma.pollVote.create({
            data: { optionId, userId }
        });

        res.json({ message: 'Voto registrado', voted: true, optionId });
    } catch (error) {
        console.error('Error voting on poll:', error);
        res.status(500).json({ error: 'Erro ao votar' });
    }
};
