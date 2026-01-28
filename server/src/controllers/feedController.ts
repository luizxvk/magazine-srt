import { Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { z } from 'zod';
import { AuthRequest } from '../middleware/authMiddleware';
import { awardTrophies, checkAndAwardBadges, awardZions, awardXP } from '../services/gamificationService';
import { uploadPostImage, uploadStoryImage } from '../services/cloudinaryService';
import { sendPushToUser } from './notificationController';

const prisma = new PrismaClient();

const createPostSchema = z.object({
    imageUrl: z.string().url().optional().nullable(),
    videoUrl: z.string().url().optional().nullable(),
    caption: z.string().optional(),
    isHighlight: z.boolean().optional(),
    tags: z.array(z.string()).optional(),
});

const commentSchema = z.object({
    text: z.string().min(1),
});

export const getFeed = async (req: AuthRequest, res: Response) => {
    try {
        const page = parseInt(req.query.page as string) || 1;
        const limit = parseInt(req.query.limit as string) || 10;
        const skip = (page - 1) * limit;

        const posts = await prisma.post.findMany({
            skip,
            take: limit,
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
                likes: {
                    where: { userId: req.user?.userId },
                    select: { userId: true },
                },
                tags: true,
                linkedProduct: {
                    select: {
                        id: true,
                        name: true,
                        imageUrl: true,
                        priceZions: true,
                        priceBRL: true,
                    }
                }
            },
        });

        const formattedPosts = posts.map((post) => ({
            ...post,
            isLiked: post.likes.length > 0,
            likes: undefined, // Remove raw likes array
        }));

        res.json(formattedPosts);
    } catch (error) {
        res.status(500).json({ error: 'Internal server error' });
    }
};

export const getHighlights = async (req: AuthRequest, res: Response) => {
    try {
        // Calculate 5 days ago for highlight expiration
        const fiveDaysAgo = new Date();
        fiveDaysAgo.setDate(fiveDaysAgo.getDate() - 5);
        
        const posts = await prisma.post.findMany({
            where: {
                isHighlight: true,
                createdAt: {
                    gte: fiveDaysAgo // Only highlights from last 5 days
                },
                linkedProductId: null, // Only show posts WITHOUT linked products (user posts only)
            },
            take: 20,
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
                likes: {
                    where: { userId: req.user?.userId },
                    select: { userId: true },
                },
                tags: true,
                linkedProduct: {
                    select: {
                        id: true,
                        name: true,
                        imageUrl: true,
                        priceZions: true,
                        priceBRL: true,
                    }
                }
            },
        });

        const formattedPosts = posts.map((post) => ({
            ...post,
            isLiked: post.likes.length > 0,
            likes: undefined,
        }));

        res.json(formattedPosts);
    } catch (error) {
        console.error('Error fetching highlights:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
};

// Get top posts ordered by likes (Destaques da Semana)
export const getTopPosts = async (req: AuthRequest, res: Response) => {
    try {
        const posts = await prisma.post.findMany({
            where: {
                linkedProductId: null, // Only user posts
                imageUrl: {
                    not: null
                }
            },
            take: 50,
            orderBy: { likesCount: 'desc' },
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
                likes: {
                    where: { userId: req.user?.userId },
                    select: { userId: true },
                },
                tags: true,
            },
        });

        const formattedPosts = posts.map((post) => ({
            ...post,
            isLiked: post.likes.length > 0,
            likes: undefined,
        }));

        res.json(formattedPosts);
    } catch (error) {
        console.error('Error fetching top posts:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
};

export const likePost = async (req: AuthRequest, res: Response) => {
    try {
        const userId = req.user?.userId;
        const { id } = req.params;
        if (!userId) return res.status(401).json({ error: 'Unauthorized' });

        const post = await prisma.post.findUnique({ where: { id } });
        if (!post) return res.status(404).json({ error: 'Post not found' });

        const existingLike = await prisma.like.findUnique({
            where: {
                postId_userId: {
                    postId: id,
                    userId,
                },
            },
        });

        if (existingLike) {
            // Unlike
            await prisma.$transaction([
                prisma.like.delete({
                    where: { id: existingLike.id },
                }),
                prisma.post.update({
                    where: { id },
                    data: { likesCount: { decrement: 1 } },
                }),
            ]);
            return res.json({ message: 'Unliked', isLiked: false });
        } else {
            // Like
            const [like, updatedPost] = await prisma.$transaction([
                prisma.like.create({
                    data: {
                        postId: id,
                        userId,
                    },
                }),
                prisma.post.update({
                    where: { id },
                    data: { likesCount: { increment: 1 } },
                }),
            ]);

            // Create Notification if not self-like
            if (post.userId !== userId) {
                const actor = await prisma.user.findUnique({
                    where: { id: userId },
                    select: { id: true, name: true, avatarUrl: true }
                });

                const notificationContent = JSON.stringify({
                    text: 'curtiu sua postagem.',
                    actor: {
                        id: actor?.id,
                        name: actor?.name || 'Alguém',
                        avatarUrl: actor?.avatarUrl
                    },
                    postId: id
                });

                await prisma.notification.create({
                    data: {
                        userId: post.userId,
                        type: 'LIKE',
                        content: notificationContent,
                    }
                });
            }

            // --- GAMIFICATION (Liker) ---
            // Check if user already received Zions for liking this specific post
            const alreadyAwarded = await prisma.zionHistory.findFirst({
                where: {
                    userId,
                    reason: `Liked post ${id}`
                }
            });

            let zionsEarned = 0;
            if (!alreadyAwarded) {
                // Award 1 Zion for liking
                await awardZions(userId, 1, `Liked post ${id}`);
                zionsEarned = 1;
            }

            // Check Badges (Trophies awarded if badge earned)
            const badgeResult = await checkAndAwardBadges(userId, 'LIKE');

            // Get updated user stats
            const updatedUser = await prisma.user.findUnique({
                where: { id: userId },
                select: { id: true, xp: true, level: true, zions: true, trophies: true }
            });

            return res.json({
                message: 'Liked',
                isLiked: true,
                newBadges: badgeResult?.newBadges || [],
                zionsEarned,
                user: updatedUser
            });
        }
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Internal server error' });
    }
};

export const createPost = async (req: AuthRequest, res: Response) => {
    try {
        const userId = req.user?.userId;
        if (!userId) return res.status(401).json({ error: 'Unauthorized' });

        const { imageUrl, videoUrl, caption, isHighlight, tags } = createPostSchema.parse(req.body);

        // Validate: must have either caption or media
        if (!caption?.trim() && !imageUrl && !videoUrl) {
            return res.status(400).json({ error: 'Post deve ter texto ou mídia' });
        }

        // Upload to Cloudinary CDN if base64 (reduces DB egress)
        let finalImageUrl = imageUrl || null;
        if (imageUrl && imageUrl.startsWith('data:')) {
            const cloudinaryUrl = await uploadPostImage(imageUrl);
            if (cloudinaryUrl) {
                finalImageUrl = cloudinaryUrl;
                console.log(`[createPost] Image uploaded to CDN: ${cloudinaryUrl.substring(0, 50)}...`);
            }
        }

        // Check daily limit (10 posts/day)
        const twentyFourHoursAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
        const dailyPostCount = await prisma.post.count({
            where: {
                userId,
                createdAt: { gte: twentyFourHoursAgo }
            }
        });

        if (dailyPostCount >= 10) {
            return res.status(400).json({ error: 'Você atingiu o limite de 10 postagens por dia.' });
        }

        // Create post with tags
        const post = await prisma.post.create({
            data: {
                userId,
                imageUrl: finalImageUrl,
                videoUrl: videoUrl || null,
                caption,
                isHighlight: isHighlight || false,
                tags: tags && tags.length > 0 ? {
                    create: tags.map((tag: string) => ({
                        tag: tag
                    }))
                } : undefined,
            },
            include: {
                user: {
                    select: {
                        id: true,
                        name: true,
                        displayName: true,
                        avatarUrl: true,
                    },
                },
                tags: true,
            },
        });

        // Award 1 Zion for posting
        await awardZions(userId, 1, 'Created a post');

        // Award 250 XP for posting
        await awardXP(userId, 250, 'Created a post');

        // Detect mentions in caption and send push notifications
        if (caption) {
            const mentionRegex = /@(\w+)/g;
            const mentions = caption.match(mentionRegex);
            if (mentions && mentions.length > 0) {
                // Get unique usernames (remove @ prefix)
                const usernames = [...new Set(mentions.map((m: string) => m.substring(1).toLowerCase()))];
                
                // Find users by name or displayName
                const mentionedUsers = await prisma.user.findMany({
                    where: {
                        OR: [
                            { name: { in: usernames, mode: 'insensitive' } },
                            { displayName: { in: usernames, mode: 'insensitive' } }
                        ],
                        id: { not: userId } // Don't notify yourself
                    },
                    select: { id: true, name: true }
                });

                // Get poster name for notification
                const poster = await prisma.user.findUnique({
                    where: { id: userId },
                    select: { name: true, displayName: true }
                });
                const posterName = poster?.displayName || poster?.name || 'Alguém';

                // Send push to each mentioned user
                for (const mentionedUser of mentionedUsers) {
                    await sendPushToUser(
                        mentionedUser.id,
                        '📢 Você foi mencionado!',
                        `${posterName} mencionou você em uma postagem`,
                        { url: `/post/${post.id}` }
                    );
                }
            }
        }

        // Get updated user stats
        const updatedUser = await prisma.user.findUnique({
            where: { id: userId },
            select: { id: true, xp: true, level: true, zions: true, trophies: true }
        });

        res.status(201).json({
            ...post,
            userStats: updatedUser
        });
    } catch (error) {
        if (error instanceof z.ZodError) {
            return res.status(400).json({ error: (error as any).errors });
        }
        res.status(500).json({ error: 'Internal server error' });
    }
};

export const commentPost = async (req: AuthRequest, res: Response) => {
    try {
        const userId = req.user?.userId;
        const { id } = req.params;
        if (!userId) return res.status(401).json({ error: 'Unauthorized' });

        const { text } = commentSchema.parse(req.body);

        const post = await prisma.post.findUnique({ where: { id } });
        if (!post) return res.status(404).json({ error: 'Post not found' });

        const [comment] = await prisma.$transaction([
            prisma.comment.create({
                data: {
                    postId: id,
                    userId,
                    text,
                },
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
                },
            }),
            prisma.post.update({
                where: { id },
                data: { commentsCount: { increment: 1 } },
            }),
        ]);

        // Create Notification if not self-comment
        if (post.userId !== userId) {
            const actor = await prisma.user.findUnique({
                where: { id: userId },
                select: { id: true, name: true, avatarUrl: true }
            });

            const notificationContent = JSON.stringify({
                text: `comentou: "${text.substring(0, 20)}${text.length > 20 ? '...' : ''}"`,
                actor: {
                    id: actor?.id,
                    name: actor?.name || 'Alguém',
                    avatarUrl: actor?.avatarUrl
                },
                postId: id
            });

            await prisma.notification.create({
                data: {
                    userId: post.userId,
                    type: 'COMMENT',
                    content: notificationContent,
                }
            });

            // Send push notification for comment
            sendPushToUser(
                post.userId,
                `💬 ${actor?.name || 'Alguém'} comentou`,
                text.length > 50 ? text.substring(0, 50) + '...' : text,
                { url: `/post/${id}`, postId: id, type: 'comment' }
            ).catch(err => console.error('[Push] Error sending comment notification:', err));
        }

        // --- GAMIFICATION ---
        // Award 2 Zions for commenting (to commenter)
        await awardZions(userId, 2, 'Commented on a post');

        // Award 100 XP to Commenter
        await awardXP(userId, 100, 'Commented on a post');

        // Award 20 XP to Post Owner (if not self-comment)
        if (post.userId !== userId) {
            await awardXP(post.userId, 20, 'Received a comment');
        }

        // Check Badges
        const badgeResult = await checkAndAwardBadges(userId, 'COMMENT');

        // Get updated user stats
        const updatedUser = await prisma.user.findUnique({
            where: { id: userId },
            select: { id: true, xp: true, level: true, zions: true, trophies: true }
        });

        res.status(201).json({
            ...comment,
            newBadges: badgeResult?.newBadges || [],
            zionsEarned: 2,
            userStats: updatedUser
        });
    } catch (error) {
        if (error instanceof z.ZodError) {
            return res.status(400).json({ error: (error as any).errors });
        }
        console.error(error);
        res.status(500).json({ error: 'Internal server error' });
    }
};

export const createStory = async (req: AuthRequest, res: Response) => {
    try {
        const userId = req.user?.userId;
        if (!userId) return res.status(401).json({ error: 'Unauthorized' });

        const { imageUrl } = req.body;
        if (!imageUrl) return res.status(400).json({ error: 'Image URL is required' });

        // Upload to Cloudinary CDN if base64 (reduces DB egress)
        let finalImageUrl = imageUrl;
        if (imageUrl.startsWith('data:')) {
            const cloudinaryUrl = await uploadStoryImage(imageUrl);
            if (cloudinaryUrl) {
                finalImageUrl = cloudinaryUrl;
                console.log(`[createStory] Image uploaded to CDN: ${cloudinaryUrl.substring(0, 50)}...`);
            }
        }

        // Create Story in DB
        // Expires in 24 hours
        const expiresAt = new Date();
        expiresAt.setHours(expiresAt.getHours() + 24);

        const story = await prisma.story.create({
            data: {
                userId,
                imageUrl: finalImageUrl,
                expiresAt
            }
        });

        // Award 50 XP for posting a story
        await awardXP(userId, 50, 'Posted a story');

        // Award 1 Zion (optional, but consistent with other actions)
        await awardZions(userId, 1, 'Posted a story');

        // Get updated user stats
        const updatedUser = await prisma.user.findUnique({
            where: { id: userId },
            select: { id: true, xp: true, level: true, zions: true, trophies: true }
        });

        res.status(201).json({
            message: 'Story created',
            story,
            xpEarned: 50,
            userStats: updatedUser
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Internal server error' });
    }
};

export const likeStory = async (req: AuthRequest, res: Response) => {
    try {
        const userId = req.user?.userId;
        const { id } = req.params; // Story ID

        if (!userId) return res.status(401).json({ error: 'Unauthorized' });

        // Get the story to find the owner
        const story = await prisma.story.findUnique({
            where: { id },
            select: { userId: true }
        });

        if (!story) {
            return res.status(404).json({ error: 'Story not found' });
        }

        if (userId === story.userId) {
            return res.status(400).json({ error: 'Cannot like own story' });
        }

        const actor = await prisma.user.findUnique({
            where: { id: userId },
            select: { id: true, name: true, avatarUrl: true }
        });

        const notificationContent = JSON.stringify({
            text: 'curtiu seu story.',
            actor: {
                id: actor?.id,
                name: actor?.name || 'Alguém',
                avatarUrl: actor?.avatarUrl
            },
            isStory: true
        });

        await prisma.notification.create({
            data: {
                userId: story.userId,
                type: 'LIKE',
                content: notificationContent,
            }
        });

        res.json({ message: 'Story liked' });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Internal server error' });
    }
};

export const getStoryLikeStatus = async (req: AuthRequest, res: Response) => {
    try {
        const userId = req.user?.userId;
        const { storyId } = req.params;

        if (!userId) return res.status(401).json({ error: 'Unauthorized' });

        // Check if user has liked this story by looking for a recent notification
        const recentLike = await prisma.notification.findFirst({
            where: {
                type: 'LIKE',
                content: {
                    contains: userId
                },
                createdAt: {
                    gte: new Date(Date.now() - 24 * 60 * 60 * 1000) // Within 24 hours
                }
            },
            orderBy: { createdAt: 'desc' }
        });

        // For now, we'll use a simpler approach - check StoryLike table if exists
        // Since we don't have StoryLike model, return false for now
        // This will be improved when StoryLike model is added
        res.json({ isLiked: false });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Internal server error' });
    }
};

export const getStories = async (req: AuthRequest, res: Response) => {
    try {
        const userId = req.user?.userId;
        if (!userId) return res.status(401).json({ error: 'Unauthorized' });

        // Fetch active stories (created in the last 24 hours)
        const twentyFourHoursAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);

        // First, get user's friends
        const friendships = await prisma.friendship.findMany({
            where: {
                OR: [
                    { requesterId: userId, status: 'ACCEPTED' },
                    { addresseeId: userId, status: 'ACCEPTED' }
                ]
            },
            select: {
                requesterId: true,
                addresseeId: true
            }
        });

        // Extract friend IDs
        const friendIds = friendships.map(f => 
            f.requesterId === userId ? f.addresseeId : f.requesterId
        );

        // Include self to see own stories
        const allowedUserIds = [userId, ...friendIds];

        const stories = await prisma.story.findMany({
            where: {
                createdAt: {
                    gte: twentyFourHoursAgo
                },
                userId: {
                    in: allowedUserIds
                }
            },
            include: {
                user: {
                    select: {
                        id: true,
                        name: true,
                        displayName: true,
                        avatarUrl: true,
                        membershipType: true
                    }
                },
                views: {
                    where: {
                        viewerId: userId
                    }
                }
            },
            orderBy: {
                createdAt: 'desc'
            }
        });

        // Group stories by user
        const storiesByUser = new Map();

        stories.forEach(story => {
            if (!storiesByUser.has(story.userId)) {
                storiesByUser.set(story.userId, {
                    user: story.user,
                    stories: [],
                    hasUnseen: false
                });
            }

            const userGroup = storiesByUser.get(story.userId);
            const isSeen = story.views.length > 0;

            userGroup.stories.push({
                id: story.id,
                imageUrl: story.imageUrl,
                createdAt: story.createdAt,
                isSeen
            });

            if (!isSeen) {
                userGroup.hasUnseen = true;
            }
        });

        // Format for frontend
        const formattedStories = Array.from(storiesByUser.values()).map((group: any) => ({
            id: `story-group-${group.user.id}`,
            user: group.user,
            items: group.stories,
            hasUnseen: group.hasUnseen,
            // Use the latest story for the preview
            latestStory: group.stories[0]
        }));

        res.json(formattedStories);
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Internal server error' });
    }
};

export const deleteStory = async (req: AuthRequest, res: Response) => {
    try {
        const userId = req.user?.userId;
        const { storyId } = req.params;

        if (!userId) return res.status(401).json({ error: 'Unauthorized' });

        // Find the story
        const story = await prisma.story.findUnique({
            where: { id: storyId }
        });

        if (!story) {
            return res.status(404).json({ error: 'Story not found' });
        }

        // Check if user is admin
        const user = await prisma.user.findUnique({ where: { id: userId } });
        const isAdmin = user?.role === 'ADMIN';

        // Check if user owns the story or is admin
        if (story.userId !== userId && !isAdmin) {
            return res.status(403).json({ error: 'You can only delete your own stories' });
        }

        // Delete the story and its views
        await prisma.$transaction([
            prisma.storyView.deleteMany({
                where: { storyId }
            }),
            prisma.story.delete({
                where: { id: storyId }
            })
        ]);

        res.json({ message: 'Story deleted successfully' });
    } catch (error) {
        console.error('Error deleting story:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
};

export const markStoryAsViewed = async (req: any, res: any) => {
    try {
        const { storyId } = req.params;
        const userId = req.user.userId;

        // Ignore local stories (they don't exist in DB yet)
        if (storyId.startsWith('story-local-') || storyId === 'undefined' || !storyId) {
            return res.json({ message: 'Local or invalid story, skipping view tracking' });
        }

        // Check if story exists
        const story = await prisma.story.findUnique({
            where: { id: storyId }
        });

        if (!story) {
            console.log(`Story not found: ${storyId}`);
            return res.status(404).json({ error: 'Story not found' });
        }

        // Don't create view for own story
        if (story.userId === userId) {
            return res.json({ message: 'Own story, skipping view tracking' });
        }

        // Create or update story view
        await prisma.storyView.upsert({
            where: {
                storyId_viewerId: {
                    storyId,
                    viewerId: userId
                }
            },
            create: {
                storyId,
                viewerId: userId
            },
            update: {}
        });

        res.json({ message: 'Story marked as viewed' });
    } catch (error) {
        console.error('Error marking story as viewed:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
};

export const getStoryViewers = async (req: any, res: any) => {
    try {
        const { storyId } = req.params;

        // Ignore local stories
        if (storyId.startsWith('story-local-')) {
            return res.json([]);
        }

        // Check if story exists
        const story = await prisma.story.findUnique({
            where: { id: storyId },
            include: {
                views: {
                    include: {
                        viewer: {
                            select: {
                                id: true,
                                name: true,
                                avatarUrl: true
                            }
                        }
                    }
                }
            }
        });

        if (!story) {
            return res.status(404).json({ error: 'Story not found' });
        }

        const viewers = story.views.map(view => ({
            id: view.id,
            viewer: {
                id: view.viewer.id,
                name: view.viewer.name,
                displayName: view.viewer.name,
                avatarUrl: view.viewer.avatarUrl
            },
            viewedAt: view.viewedAt
        }));

        res.json(viewers);
    } catch (error) {
        console.error('Error fetching story viewers:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
};
