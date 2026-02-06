// Push Notification Service for Magazine SRT
// Hybrid: Uses Capacitor plugin on mobile, Web Push on browser
import api from './api';
import { Capacitor } from '@capacitor/core';
import { PushNotifications } from '@capacitor/push-notifications';
import type { Token, PushNotificationSchema, ActionPerformed } from '@capacitor/push-notifications';

// Fallback VAPID public key - will be fetched from server
let VAPID_PUBLIC_KEY = 'BLBx-hf2WrL7qLtN6HCTTOmxOv0qkNp8HpGRJMxQMGM2bDJ5VqNqT2Ls5xJ8yCTRPQX_UhLqNdZxH5PK5FTRPJ0';

class PushNotificationService {
    private swRegistration: ServiceWorkerRegistration | null = null;
    private isNative: boolean = false;
    private isWebSupported: boolean = false;
    private vapidKeyFetched: boolean = false;
    private fcmToken: string | null = null;

    constructor() {
        this.isNative = Capacitor.isNativePlatform();
        this.isWebSupported = !this.isNative && 'serviceWorker' in navigator && 'PushManager' in window;
        
        if (this.isNative) {
            this.setupNativeListeners();
        }
    }

    // Setup native push notification listeners
    private setupNativeListeners() {
        // On registration success
        PushNotifications.addListener('registration', async (token: Token) => {
            console.log('[Push Native] Registration success, token:', token.value);
            this.fcmToken = token.value;
            
            // Send FCM token to backend
            try {
                await api.post('/notifications/push/subscribe-fcm', {
                    token: token.value,
                    platform: Capacitor.getPlatform()
                });
                console.log('[Push Native] Token sent to server');
            } catch (error) {
                console.error('[Push Native] Failed to send token to server:', error);
            }
        });

        // On registration error
        PushNotifications.addListener('registrationError', (error: any) => {
            console.error('[Push Native] Registration error:', error);
        });

        // On push notification received (foreground)
        PushNotifications.addListener('pushNotificationReceived', (notification: PushNotificationSchema) => {
            console.log('[Push Native] Notification received:', notification);
            // You could show an in-app notification here
        });

        // On push notification action performed (user tapped)
        PushNotifications.addListener('pushNotificationActionPerformed', (action: ActionPerformed) => {
            console.log('[Push Native] Action performed:', action);
            
            // Handle deep linking based on notification data
            const data = action.notification.data;
            if (data?.url) {
                window.location.href = data.url;
            }
        });
    }

    // Check if push notifications are supported
    isNotificationSupported(): boolean {
        return this.isNative || this.isWebSupported;
    }

    // Get current permission status
    async getPermissionStatus(): Promise<NotificationPermission | 'unsupported'> {
        if (this.isNative) {
            const status = await PushNotifications.checkPermissions();
            if (status.receive === 'granted') return 'granted';
            if (status.receive === 'denied') return 'denied';
            return 'default';
        }
        
        if (!this.isWebSupported) return 'unsupported';
        return Notification.permission;
    }

    // Fetch VAPID key from server (web only)
    private async fetchVapidKey(): Promise<void> {
        if (this.vapidKeyFetched) return;
        
        try {
            const response = await api.get('/notifications/push/vapid-key');
            if (response.data?.publicKey) {
                VAPID_PUBLIC_KEY = response.data.publicKey;
                this.vapidKeyFetched = true;
                console.log('[Push] VAPID key fetched from server');
            }
        } catch (error) {
            console.warn('[Push] Could not fetch VAPID key, using fallback');
        }
    }

    // Register the service worker (web only)
    async registerServiceWorker(): Promise<ServiceWorkerRegistration | null> {
        if (this.isNative || !this.isWebSupported) {
            return null;
        }

        try {
            const registration = await navigator.serviceWorker.register('/sw.js', {
                scope: '/'
            });
            
            console.log('[Push] Service Worker registered:', registration.scope);
            this.swRegistration = registration;
            
            // Wait for the service worker to be ready
            await navigator.serviceWorker.ready;
            
            return registration;
        } catch (error) {
            console.error('[Push] Service Worker registration failed:', error);
            return null;
        }
    }

    // Request notification permission
    async requestPermission(): Promise<NotificationPermission> {
        if (this.isNative) {
            const result = await PushNotifications.requestPermissions();
            console.log('[Push Native] Permission result:', result.receive);
            
            if (result.receive === 'granted') {
                // Register for push notifications
                await PushNotifications.register();
                return 'granted';
            }
            return result.receive === 'denied' ? 'denied' : 'default';
        }

        if (!this.isWebSupported) {
            return 'denied';
        }

        try {
            const permission = await Notification.requestPermission();
            console.log('[Push] Permission result:', permission);
            return permission;
        } catch (error) {
            console.error('[Push] Error requesting permission:', error);
            return 'denied';
        }
    }

    // Subscribe to push notifications
    async subscribe(): Promise<boolean> {
        if (this.isNative) {
            // For native, just request permission - registration happens in listener
            const permission = await this.requestPermission();
            return permission === 'granted';
        }

        // Web Push subscription
        await this.fetchVapidKey();

        if (!this.swRegistration) {
            await this.registerServiceWorker();
        }

        if (!this.swRegistration) {
            console.error('[Push] No service worker registration');
            return false;
        }

        try {
            // Check existing subscription
            let subscription = await this.swRegistration.pushManager.getSubscription();
            
            if (subscription) {
                console.log('[Push] Existing subscription found');
                await this.sendSubscriptionToServer(subscription);
                return true;
            }

            // Create new subscription
            subscription = await this.swRegistration.pushManager.subscribe({
                userVisibleOnly: true,
                applicationServerKey: this.urlBase64ToUint8Array(VAPID_PUBLIC_KEY) as BufferSource
            });

            console.log('[Push] New subscription created');
            await this.sendSubscriptionToServer(subscription);
            
            return true;
        } catch (error) {
            console.error('[Push] Subscription failed:', error);
            return false;
        }
    }

    // Unsubscribe from push notifications
    async unsubscribe(): Promise<boolean> {
        if (this.isNative) {
            try {
                await PushNotifications.unregister();
                
                if (this.fcmToken) {
                    await api.post('/notifications/push/unsubscribe-fcm', {
                        token: this.fcmToken
                    });
                }
                
                this.fcmToken = null;
                console.log('[Push Native] Unsubscribed successfully');
                return true;
            } catch (error) {
                console.error('[Push Native] Unsubscribe failed:', error);
                return false;
            }
        }

        if (!this.swRegistration) {
            return false;
        }

        try {
            const subscription = await this.swRegistration.pushManager.getSubscription();
            
            if (subscription) {
                await subscription.unsubscribe();
                
                await api.post('/notifications/push/unsubscribe', {
                    endpoint: subscription.endpoint
                });
                
                console.log('[Push] Unsubscribed successfully');
                return true;
            }
            
            return false;
        } catch (error) {
            console.error('[Push] Unsubscribe failed:', error);
            return false;
        }
    }

    // Send subscription to backend (web only)
    private async sendSubscriptionToServer(subscription: PushSubscription): Promise<void> {
        try {
            await api.post('/notifications/push/subscribe', subscription.toJSON());
            console.log('[Push] Subscription sent to server');
        } catch (error) {
            console.error('[Push] Failed to send subscription to server:', error);
        }
    }

    // Check if user is subscribed
    async isSubscribed(): Promise<boolean> {
        if (this.isNative) {
            const status = await PushNotifications.checkPermissions();
            return status.receive === 'granted' && this.fcmToken !== null;
        }

        if (!this.swRegistration) {
            await this.registerServiceWorker();
        }

        if (!this.swRegistration) return false;

        const subscription = await this.swRegistration.pushManager.getSubscription();
        return subscription !== null;
    }

    // Get push status from server
    async getServerStatus(): Promise<{ enabled: boolean; subscriptionCount: number } | null> {
        try {
            const response = await api.get('/notifications/push/status');
            return response.data;
        } catch (error) {
            console.error('[Push] Failed to get status:', error);
            return null;
        }
    }

    // Send test notification
    async sendTestNotification(): Promise<boolean> {
        try {
            const response = await api.post('/notifications/push/test');
            return response.data?.success === true;
        } catch (error) {
            console.error('[Push] Test notification failed:', error);
            return false;
        }
    }

    // Convert VAPID key to Uint8Array (web only)
    private urlBase64ToUint8Array(base64String: string): Uint8Array {
        const padding = '='.repeat((4 - base64String.length % 4) % 4);
        const base64 = (base64String + padding)
            .replace(/-/g, '+')
            .replace(/_/g, '/');
        
        const rawData = window.atob(base64);
        const outputArray = new Uint8Array(rawData.length);
        
        for (let i = 0; i < rawData.length; ++i) {
            outputArray[i] = rawData.charCodeAt(i);
        }
        
        return outputArray;
    }

    // Show local notification (for testing)
    async showLocalNotification(title: string, options?: NotificationOptions): Promise<void> {
        if (this.isNative) {
            // Use Capacitor Local Notifications for this
            // For now, just log
            console.log('[Push Native] Local notification:', title, options);
            return;
        }

        if (!this.swRegistration) {
            await this.registerServiceWorker();
        }

        if (this.swRegistration && Notification.permission === 'granted') {
            await this.swRegistration.showNotification(title, {
                icon: '/logo192.png',
                badge: '/logo192.png',
                ...options
            } as NotificationOptions);
        }
    }

    // Get platform info
    getPlatformInfo(): { isNative: boolean; platform: string } {
        return {
            isNative: this.isNative,
            platform: Capacitor.getPlatform()
        };
    }
}

// Singleton instance
const pushService = new PushNotificationService();

export default pushService;
