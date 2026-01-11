import apn from 'apn';
import * as fs from 'fs';
import * as path from 'path';

export class IOSPushService {
  private provider: apn.Provider | null = null;
  private initialized: boolean = false;

  constructor() {
    try {
      const keyId = process.env.APNS_KEY_ID;
      const teamId = process.env.APNS_TEAM_ID;
      const bundleId = process.env.APNS_BUNDLE_ID;
      const keyPath = process.env.APNS_KEY_PATH;
      const production = process.env.APNS_PRODUCTION === 'true';

      if (keyId && teamId && bundleId && keyPath) {
        const keyPathResolved = path.resolve(keyPath);
        
        if (fs.existsSync(keyPathResolved)) {
          const options: apn.ProviderOptions = {
            token: {
              key: keyPathResolved,
              keyId: keyId,
              teamId: teamId,
            },
            production: production,
          };

          this.provider = new apn.Provider(options);
          this.initialized = true;
        } else {
          console.warn(`APNs key file not found at ${keyPathResolved}. iOS push notifications will be disabled.`);
        }
      } else {
        console.warn('APNs credentials not configured. iOS push notifications will be disabled.');
      }
    } catch (error) {
      console.error('Failed to initialize APNs:', error);
    }
  }

  async sendNotification(
    token: string,
    payload: {
      title: string;
      body: string;
      badge?: number;
      sound?: string;
      data?: any;
      priority?: 'high' | 'normal';
    }
  ): Promise<boolean> {
    if (!this.initialized || !this.provider) {
      throw new Error('iOS Push service not initialized. Please configure APNs credentials.');
    }

    try {
      const notification = new apn.Notification();

      notification.alert = {
        title: payload.title,
        body: payload.body,
      };

      notification.badge = payload.badge;
      notification.sound = payload.sound || 'default';
      notification.topic = process.env.APNS_BUNDLE_ID!;
      notification.payload = payload.data || {};
      notification.priority = payload.priority === 'high' ? 10 : 5;
      notification.expiry = Math.floor(Date.now() / 1000) + 3600; // 1 hour

      const result = await this.provider.send(notification, token);

      if (result.failed && result.failed.length > 0) {
        const error = result.failed[0].response?.reason || 'Unknown error';
        throw new Error(error);
      }

      return true;
    } catch (error: any) {
      console.error('iOS push notification error:', error);
      if (error.reason === 'BadDeviceToken' || error.reason === 'Unregistered') {
        throw new Error('Invalid or unregistered token');
      }
      throw error;
    }
  }

  async sendBatchNotifications(
    tokens: string[],
    payload: {
      title: string;
      body: string;
      badge?: number;
      sound?: string;
      data?: any;
      priority?: 'high' | 'normal';
    }
  ): Promise<{ success: number; failed: number }> {
    if (!this.initialized || !this.provider) {
      throw new Error('iOS Push service not initialized. Please configure APNs credentials.');
    }

    try {
      const notification = new apn.Notification();

      notification.alert = {
        title: payload.title,
        body: payload.body,
      };

      notification.badge = payload.badge;
      notification.sound = payload.sound || 'default';
      notification.topic = process.env.APNS_BUNDLE_ID!;
      notification.payload = payload.data || {};
      notification.priority = payload.priority === 'high' ? 10 : 5;
      notification.expiry = Math.floor(Date.now() / 1000) + 3600;

      const result = await this.provider.send(notification, tokens);

      const success = result.sent?.length || 0;
      const failed = result.failed?.length || 0;

      return { success, failed };
    } catch (error) {
      console.error('iOS batch push notification error:', error);
      throw error;
    }
  }

  isInitialized(): boolean {
    return this.initialized;
  }
}
