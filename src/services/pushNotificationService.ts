import { WebPushService } from './webPushService';
import { AndroidPushService } from './androidPushService';
import { IOSPushService } from './iosPushService';
import {
  PushNotificationRequest,
  PushNotificationResponse,
  WebPushSubscription,
} from '../types';

export class PushNotificationService {
  private webPushService: WebPushService;
  private androidPushService: AndroidPushService;
  private iosPushService: IOSPushService;

  constructor() {
    this.webPushService = new WebPushService();
    this.androidPushService = new AndroidPushService();
    this.iosPushService = new IOSPushService();
  }

  async sendNotification(
    request: PushNotificationRequest
  ): Promise<PushNotificationResponse> {
    const results: PushNotificationResponse['results'] = {};
    const errors: string[] = [];

    const payload = {
      title: request.title,
      body: request.body,
      icon: request.icon,
      badge: request.badge,
      image: request.image,
      data: request.data,
      sound: request.sound,
      priority: request.priority || 'normal',
    };

    try {
      // Send to Web
      if (
        (request.platform === 'web' || request.platform === 'all') &&
        request.tokens.length > 0
      ) {
        try {
          if (!this.webPushService.isInitialized()) {
            errors.push('Web Push service not initialized');
          } else {
            // Parse web push subscriptions from tokens
            const subscriptions: WebPushSubscription[] = request.tokens
              .map((token) => {
                try {
                  return JSON.parse(token) as WebPushSubscription;
                } catch {
                  return null;
                }
              })
              .filter((sub): sub is WebPushSubscription => sub !== null);

            if (subscriptions.length > 0) {
              const webResult = await this.webPushService.sendBatchNotifications(
                subscriptions,
                payload
              );
              results.web = webResult;
            }
          }
        } catch (error: any) {
          errors.push(`Web push error: ${error.message}`);
        }
      }

      // Send to Android
      if (
        (request.platform === 'android' || request.platform === 'all') &&
        request.tokens.length > 0
      ) {
        try {
          if (!this.androidPushService.isInitialized()) {
            errors.push('Android Push service not initialized');
          } else {
            const androidResult =
              await this.androidPushService.sendBatchNotifications(
                request.tokens,
                payload
              );
            results.android = androidResult;
          }
        } catch (error: any) {
          errors.push(`Android push error: ${error.message}`);
        }
      }

      // Send to iOS
      if (
        (request.platform === 'ios' || request.platform === 'all') &&
        request.tokens.length > 0
      ) {
        try {
          if (!this.iosPushService.isInitialized()) {
            errors.push('iOS Push service not initialized');
          } else {
            const iosResult = await this.iosPushService.sendBatchNotifications(
              request.tokens,
              payload
            );
            results.ios = iosResult;
          }
        } catch (error: any) {
          errors.push(`iOS push error: ${error.message}`);
        }
      }

      const hasResults = Object.keys(results).length > 0;
      const hasSuccess = Object.values(results).some(
        (r) => r && r.success > 0
      );

      return {
        success: hasResults && hasSuccess,
        message: hasSuccess
          ? 'Notifications sent successfully'
          : 'Failed to send notifications',
        results,
        errors: errors.length > 0 ? errors : undefined,
      };
    } catch (error: any) {
      return {
        success: false,
        message: `Failed to send notifications: ${error.message}`,
        errors: [error.message],
      };
    }
  }

  getWebPushPublicKey(): string | null {
    return this.webPushService.getPublicKey();
  }

  getServiceStatus() {
    return {
      web: this.webPushService.isInitialized(),
      android: this.androidPushService.isInitialized(),
      ios: this.iosPushService.isInitialized(),
    };
  }
}
