import * as admin from 'firebase-admin';
import { Message } from 'firebase-admin/messaging';

export class AndroidPushService {
  private initialized: boolean = false;

  constructor() {
    try {
      const projectId = process.env.FCM_PROJECT_ID;
      const privateKey = process.env.FCM_PRIVATE_KEY?.replace(/\\n/g, '\n');
      const clientEmail = process.env.FCM_CLIENT_EMAIL;

      if (projectId && privateKey && clientEmail) {
        if (!admin.apps.length) {
          admin.initializeApp({
            credential: admin.credential.cert({
              projectId,
              privateKey,
              clientEmail,
            }),
          });
        }
        this.initialized = true;
      } else {
        console.warn('FCM credentials not configured. Android push notifications will be disabled.');
      }
    } catch (error) {
      console.error('Failed to initialize FCM:', error);
    }
  }

  async sendNotification(
    token: string,
    payload: {
      title: string;
      body: string;
      icon?: string;
      image?: string;
      data?: any;
      sound?: string;
      priority?: 'high' | 'normal';
    }
  ): Promise<boolean> {
    if (!this.initialized) {
      throw new Error('Android Push service not initialized. Please configure FCM credentials.');
    }

    try {
      const message: Message = {
        token,
        notification: {
          title: payload.title,
          body: payload.body,
          imageUrl: payload.image,
        },
        data: payload.data || {},
        android: {
          priority: payload.priority === 'high' ? 'high' : 'normal',
          notification: {
            sound: payload.sound || 'default',
            icon: payload.icon,
            channelId: 'default',
          },
        },
      };

      await admin.messaging().send(message);
      return true;
    } catch (error: any) {
      console.error('Android push notification error:', error);
      if (error.code === 'messaging/invalid-registration-token' || 
          error.code === 'messaging/registration-token-not-registered') {
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
      icon?: string;
      image?: string;
      data?: any;
      sound?: string;
      priority?: 'high' | 'normal';
    }
  ): Promise<{ success: number; failed: number }> {
    if (!this.initialized) {
      throw new Error('Android Push service not initialized. Please configure FCM credentials.');
    }

    try {
      const message: Message = {
        notification: {
          title: payload.title,
          body: payload.body,
          imageUrl: payload.image,
        },
        data: payload.data || {},
        android: {
          priority: payload.priority === 'high' ? 'high' : 'normal',
          notification: {
            sound: payload.sound || 'default',
            icon: payload.icon,
            channelId: 'default',
          },
        },
      };

      const response = await admin.messaging().sendEachForMulticast({
        tokens,
        ...message,
      });

      return {
        success: response.successCount,
        failed: response.failureCount,
      };
    } catch (error) {
      console.error('Android batch push notification error:', error);
      throw error;
    }
  }

  isInitialized(): boolean {
    return this.initialized;
  }
}
