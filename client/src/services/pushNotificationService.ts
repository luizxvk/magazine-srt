// Push Notification Service for Magazine SRT
import api from './api';

// Fallback VAPID public key - will be fetched from server
let VAPID_PUBLIC_KEY = 'BLBx-hf2WrL7qLtN6HCTTOmxOv0qkNp8HpGRJMxQMGM2bDJ5VqNqT2Ls5xJ8yCTRPQX_UhLqNdZxH5PK5FTRPJ0';

class PushNotificationService {
    private swRegistration: ServiceWorkerRegistration | null = null;
    private isSupported: boolean = false;
    private vapidKeyFetched: boolean = false;

    constructor() {
        this.isSupported = 'serviceWorker' in navigator && 'PushManager' in window;
    }

    // Check if push notifications are supported
    isNotificationSupported(): boolean {
        return this.isSupported;
    }

    // Get current permission status
    getPermissionStatus(): NotificationPermission | 'unsupported' {
        if (!this.isSupported) return 'unsupported';
        return Notification.permission;
    }

    // Fetch VAPID key from server
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

    // Register the service worker
    async registerServiceWorker(): Promise<ServiceWorkerRegistration | null> {
        if (!this.isSupported) {
            console.log('[Push] Service workers not supported');
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
        if (!this.isSupported) {
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
    async subscribe(): Promise<PushSubscription | null> {
        // Fetch VAPID key from server first
        await this.fetchVapidKey();

        if (!this.swRegistration) {
            await this.registerServiceWorker();
        }

        if (!this.swRegistration) {
            console.error('[Push] No service worker registration');
            return null;
        }

        try {
            // Check existing subscription
            let subscription = await this.swRegistration.pushManager.getSubscription();
            
            if (subscription) {
                console.log('[Push] Existing subscription found');
                // Send to backend
                await this.sendSubscriptionToServer(subscription);
                return subscription;
            }

            // Create new subscription
            subscription = await this.swRegistration.pushManager.subscribe({
                userVisibleOnly: true,
                applicationServerKey: this.urlBase64ToUint8Array(VAPID_PUBLIC_KEY) as BufferSource
            });

            console.log('[Push] New subscription created');
            
            // Send to backend
            await this.sendSubscriptionToServer(subscription);
            
            return subscription;
        } catch (error) {
            console.error('[Push] Subscription failed:', error);
            return null;
        }
    }

    // Unsubscribe from push notifications
    async unsubscribe(): Promise<boolean> {
        if (!this.swRegistration) {
            return false;
        }

        try {
            const subscription = await this.swRegistration.pushManager.getSubscription();
            
            if (subscription) {
                await subscription.unsubscribe();
                
                // Notify backend
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

    // Send subscription to backend
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

    // Convert VAPID key to Uint8Array
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
}

// Singleton instance
const pushService = new PushNotificationService();

export default pushService;
