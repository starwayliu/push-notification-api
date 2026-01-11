import webpush from 'web-push';
import dotenv from 'dotenv';

dotenv.config();

export class WebPushService {
  private vapidPublicKey: string;
  private vapidPrivateKey: string;
  private vapidSubject: string;

  constructor() {
    this.vapidPublicKey = process.env.VAPID_PUBLIC_KEY || '';
    this.vapidPrivateKey = process.env.VAPID_PRIVATE_KEY || '';
    this.vapidSubject = process.env.VAPID_SUBJECT || 'mailto:example@example.com';

    if (!this.vapidPublicKey || !this.vapidPrivateKey) {
      console.warn('⚠️  VAPID keys not configured. Web push notifications will not work.');
      return;
    }

    webpush.setVapidDetails(this.vapidSubject, this.vapidPublicKey, this.vapidPrivateKey);
  }

  /**
   * 检查服务是否可用
   */
  isAvailable(): boolean {
    return !!(this.vapidPublicKey && this.vapidPrivateKey);
  }

  /**
   * 获取 VAPID 公钥
   */
  getPublicKey(): string {
    return this.vapidPublicKey;
  }

  /**
   * 发送推送通知到单个设备
   */
  async sendNotification(
    subscription: webpush.PushSubscription,
    payload: {
      title: string;
      body: string;
      icon?: string;
      badge?: string;
      image?: string;
      url?: string;
      data?: Record<string, any>;
    }
  ): Promise<void> {
    if (!this.isAvailable()) {
      throw new Error('Web push service is not configured');
    }

    const notificationPayload = JSON.stringify({
      title: payload.title,
      body: payload.body,
      icon: payload.icon,
      badge: payload.badge,
      image: payload.image,
      data: {
        url: payload.url,
        ...payload.data,
      },
    });

    await webpush.sendNotification(subscription, notificationPayload);
  }

  /**
   * 批量发送推送通知
   */
  async sendBatch(
    subscriptions: webpush.PushSubscription[],
    payload: {
      title: string;
      body: string;
      icon?: string;
      badge?: string;
      image?: string;
      url?: string;
      data?: Record<string, any>;
    }
  ): Promise<{ success: number; failed: number; errors: Array<{ token: string; error: string }> }> {
    if (!this.isAvailable()) {
      throw new Error('Web push service is not configured');
    }

    const results = {
      success: 0,
      failed: 0,
      errors: [] as Array<{ token: string; error: string }>,
    };

    const promises = subscriptions.map(async (subscription, index) => {
      try {
        await this.sendNotification(subscription, payload);
        results.success++;
      } catch (error: any) {
        results.failed++;
        results.errors.push({
          token: JSON.stringify(subscription),
          error: error.message || 'Unknown error',
        });
      }
    });

    await Promise.allSettled(promises);
    return results;
  }
}
