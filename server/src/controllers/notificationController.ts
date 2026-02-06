import { Response } from 'express';
import webpush from 'web-push';
import prisma from '../utils/prisma';
import { AuthRequest } from '../middleware/authMiddleware';

// VAPID keys - should be set in environment variables in production
// Generate with: npx web-push generate-vapid-keys
const VAPID_PUBLIC_KEY = process.env.VAPID_PUBLIC_KEY || 'BLBx-hf2WrL7qLtN6HCTTOmxOv0qkNp8HpGRJMxQMGM2bDJ5VqNqT2Ls5xJ8yCTRPQX_UhLqNdZxH5PK5FTRPJ0';
const VAPID_PRIVATE_KEY = process.env.VAPID_PRIVATE_KEY || '';
const VAPID_EMAIL = process.env.VAPID_EMAIL || 'mailto:contato@magazinesrt.com';

// Configure web-push if private key is available
if (VAPID_PRIVATE_KEY) {
    webpush.setVapidDetails(VAPID_EMAIL, VAPID_PUBLIC_KEY, VAPID_PRIVATE_KEY);
}

export const getNotifications = async (req: AuthRequest, res: Response) => {
    try {
        const userId = req.user?.userId;
        if (!userId) return res.status(401).json({ error: 'Unauthorized' });

        const notifications = await prisma.notification.findMany({
            where: { userId },
            orderBy: { createdAt: 'desc' },
        });

        res.json(notifications);
    } catch (error) {
        res.status(500).json({ error: 'Internal server error' });
    }
};

export const markAsRead = async (req: AuthRequest, res: Response) => {
    try {
        const userId = req.user?.userId;
        const { id } = req.params;
        if (!userId) return res.status(401).json({ error: 'Unauthorized' });

        if (id === 'all') {
            await prisma.notification.updateMany({
                where: { userId, read: false },
                data: { read: true },
            });
        } else {
            await prisma.notification.update({
                where: { id, userId },
                data: { read: true },
            });
        }

        res.json({ success: true });
    } catch (error) {
        res.status(500).json({ error: 'Internal server error' });
    }
};

// ============================================
// PUSH NOTIFICATIONS
// ============================================

// Get VAPID public key (for client to use)
export const getVapidKey = async (_req: AuthRequest, res: Response) => {
    res.json({ publicKey: VAPID_PUBLIC_KEY });
};

// Subscribe to push notifications
export const subscribeToPush = async (req: AuthRequest, res: Response) => {
    try {
        const userId = req.user?.userId;
        const subscription = req.body;

        if (!userId) {
            return res.status(401).json({ error: 'Unauthorized' });
        }

        if (!subscription || !subscription.endpoint) {
            return res.status(400).json({ error: 'Invalid subscription data' });
        }

        // Store subscription in database
        await prisma.pushSubscription.upsert({
            where: {
                endpoint: subscription.endpoint
            },
            update: {
                keys: subscription.keys,
                userId: userId,
                userAgent: req.headers['user-agent'] || null,
                updatedAt: new Date()
            },
            create: {
                endpoint: subscription.endpoint,
                keys: subscription.keys,
                userId: userId,
                userAgent: req.headers['user-agent'] || null
            }
        });

        console.log(`[Push] User ${userId} subscribed to push notifications`);

        res.json({ success: true, message: 'Subscribed to push notifications' });
    } catch (error) {
        console.error('Error subscribing to push notifications:', error);
        res.status(500).json({ error: 'Failed to subscribe' });
    }
};

// Unsubscribe from push notifications
export const unsubscribeFromPush = async (req: AuthRequest, res: Response) => {
    try {
        const { endpoint } = req.body;
        const userId = req.user?.userId;

        if (!endpoint) {
            return res.status(400).json({ error: 'Endpoint required' });
        }

        await prisma.pushSubscription.deleteMany({
            where: { endpoint, userId }
        });

        console.log(`[Push] User ${userId} unsubscribed from push`);

        res.json({ success: true });
    } catch (error) {
        console.error('Error unsubscribing:', error);
        res.status(500).json({ error: 'Failed to unsubscribe' });
    }
};

// Get push subscription status
export const getPushStatus = async (req: AuthRequest, res: Response) => {
    try {
        const userId = req.user?.userId;
        if (!userId) return res.status(401).json({ error: 'Unauthorized' });

        const subscriptions = await prisma.pushSubscription.count({
            where: { userId }
        });

        res.json({ 
            enabled: subscriptions > 0,
            subscriptionCount: subscriptions
        });
    } catch (error) {
        res.status(500).json({ error: 'Internal server error' });
    }
};

// Send push notification to a specific user
export const sendPushToUser = async (userId: string, title: string, body: string, data?: Record<string, unknown>) => {
    if (!VAPID_PRIVATE_KEY) {
        console.log('[Push] VAPID_PRIVATE_KEY not configured, skipping push notification');
        return false;
    }

    try {
        // Get only web push subscriptions (those with endpoint)
        const subscriptions = await prisma.pushSubscription.findMany({
            where: { 
                userId,
                endpoint: { not: null }
            }
        });

        if (subscriptions.length === 0) {
            return false;
        }

        const payload = JSON.stringify({
            title,
            body,
            icon: '/logo192.png',
            badge: '/logo192.png',
            tag: `notification-${Date.now()}`,
            data: data || {}
        });

        const results = await Promise.allSettled(
            subscriptions.map(async (sub) => {
                if (!sub.endpoint) return { success: false, endpoint: null };
                
                try {
                    await webpush.sendNotification(
                        {
                            endpoint: sub.endpoint,
                            keys: sub.keys as { p256dh: string; auth: string }
                        },
                        payload
                    );
                    return { success: true, endpoint: sub.endpoint };
                } catch (error: unknown) {
                    const err = error as { statusCode?: number };
                    // Remove invalid subscriptions (410 Gone, 404 Not Found)
                    if (err.statusCode === 410 || err.statusCode === 404) {
                        await prisma.pushSubscription.delete({
                            where: { id: sub.id }
                        });
                        console.log(`[Push] Removed invalid subscription: ${sub.endpoint}`);
                    }
                    throw error;
                }
            })
        );

        const successCount = results.filter(r => r.status === 'fulfilled').length;
        console.log(`[Push] Sent ${successCount}/${subscriptions.length} notifications to user ${userId}`);

        return successCount > 0;
    } catch (error) {
        console.error(`[Push] Error sending to user ${userId}:`, error);
        return false;
    }
};

// Send push to multiple users
export const sendPushToUsers = async (userIds: string[], title: string, body: string, data?: Record<string, unknown>) => {
    const results = await Promise.allSettled(
        userIds.map(userId => sendPushToUser(userId, title, body, data))
    );
    
    return results.filter(r => r.status === 'fulfilled' && r.value === true).length;
};

// Test endpoint - send test notification to self
export const sendTestNotification = async (req: AuthRequest, res: Response) => {
    try {
        const userId = req.user?.userId;
        
        if (!userId) {
            return res.status(401).json({ error: 'Not authenticated' });
        }

        if (!VAPID_PRIVATE_KEY) {
            return res.status(500).json({ error: 'Push notifications not configured on server' });
        }

        const success = await sendPushToUser(
            userId,
            '🔔 Notificação de Teste',
            'Se você está vendo isso, as notificações push estão funcionando!',
            { url: '/feed', test: true }
        );

        if (success) {
            res.json({ success: true, message: 'Test notification sent' });
        } else {
            res.status(400).json({ error: 'No active subscriptions found. Enable notifications first.' });
        }
    } catch (error) {
        console.error('Error sending test notification:', error);
        res.status(500).json({ error: 'Failed to send test notification' });
    }
};

// Subscribe to FCM push notifications (Android/iOS native apps)
export const subscribeToFcm = async (req: AuthRequest, res: Response) => {
    try {
        const userId = req.user?.userId;
        const { token, platform } = req.body;

        if (!userId) {
            return res.status(401).json({ error: 'Unauthorized' });
        }

        if (!token) {
            return res.status(400).json({ error: 'FCM token required' });
        }

        // Store FCM token in database
        await prisma.pushSubscription.upsert({
            where: {
                fcmToken: token
            },
            update: {
                userId: userId,
                platform: platform || 'android',
                userAgent: req.headers['user-agent'] || null,
                updatedAt: new Date()
            },
            create: {
                fcmToken: token,
                platform: platform || 'android',
                userId: userId,
                userAgent: req.headers['user-agent'] || null
            }
        });

        console.log(`[Push FCM] User ${userId} subscribed on platform ${platform}`);

        res.json({ success: true, message: 'Subscribed to FCM push notifications' });
    } catch (error) {
        console.error('Error subscribing to FCM push notifications:', error);
        res.status(500).json({ error: 'Failed to subscribe' });
    }
};

// Unsubscribe from FCM push notifications
export const unsubscribeFromFcm = async (req: AuthRequest, res: Response) => {
    try {
        const { token } = req.body;
        const userId = req.user?.userId;

        if (!token) {
            return res.status(400).json({ error: 'FCM token required' });
        }

        await prisma.pushSubscription.deleteMany({
            where: { fcmToken: token, userId }
        });

        console.log(`[Push FCM] User ${userId} unsubscribed from FCM`);

        res.json({ success: true });
    } catch (error) {
        console.error('Error unsubscribing from FCM:', error);
        res.status(500).json({ error: 'Failed to unsubscribe' });
    }
};
