import webpush from 'web-push';
import { WebPushSubscription } from '../types';

export class WebPushService {
  private initialized: boolean = false;

  constructor() {
    const publicKey = process.env.VAPID_PUBLIC_KEY;
    const privateKey = process.env.VAPID_PRIVATE_KEY;
    const subject = process.env.VAPID_SUBJECT;

    if (publicKey && privateKey && subject) {
      webpush.setVapidDetails(subject, publicKey, privateKey);
      this.initialized = true;
    } else {
      console.warn('Web Push VAPID keys not configured. Web push notifications will be disabled.');
    }
  }

  async sendNotification(
    subscription: WebPushSubscription,
    payload: {
      title: string;
      body: string;
      icon?: string;
      badge?: string;
      image?: string;
      data?: any;
    }
  ): Promise<boolean> {
    if (!this.initialized) {
      throw new Error('Web Push service not initialized. Please configure VAPID keys.');
    }

    try {
      const notificationPayload = JSON.stringify({
        title: payload.title,
        body: payload.body,
        icon: payload.icon,
        badge: payload.badge,
        image: payload.image,
        data: payload.data,
      });

      await webpush.sendNotification(subscription, notificationPayload);
      return true;
    } catch (error: any) {
      console.error('Web push notification error:', error);
      if (error.statusCode === 410 || error.statusCode === 404) {
        // Subscription expired or invalid
        throw new Error('Subscription expired or invalid');
      }
      throw error;
    }
  }

  async sendBatchNotifications(
    subscriptions: WebPushSubscription[],
    payload: {
      title: string;
      body: string;
      icon?: string;
      badge?: string;
      image?: string;
      data?: any;
    }
  ): Promise<{ success: number; failed: number }> {
    const results = await Promise.allSettled(
      subscriptions.map((sub) => this.sendNotification(sub, payload))
    );

    const success = results.filter((r) => r.status === 'fulfilled').length;
    const failed = results.filter((r) => r.status === 'rejected').length;

    return { success, failed };
  }

  getPublicKey(): string | null {
    return process.env.VAPID_PUBLIC_KEY || null;
  }

  isInitialized(): boolean {
    return this.initialized;
  }
}
