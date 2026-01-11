import admin from 'firebase-admin';
import dotenv from 'dotenv';

dotenv.config();

export class AndroidPushService {
  private app: admin.app.App | null = null;

  constructor() {
    const projectId = process.env.FCM_PROJECT_ID;
    const privateKey = process.env.FCM_PRIVATE_KEY?.replace(/\\n/g, '\n');
    const clientEmail = process.env.FCM_CLIENT_EMAIL;

    if (!projectId || !privateKey || !clientEmail) {
      console.warn('⚠️  FCM credentials not configured. Android push notifications will not work.');
      return;
    }

    try {
      // 检查是否已经初始化
      if (admin.apps.length === 0) {
        this.app = admin.initializeApp({
          credential: admin.credential.cert({
            projectId,
            privateKey,
            clientEmail,
          }),
        });
        console.log('✅ FCM initialized successfully');
      } else {
        this.app = admin.app();
      }
    } catch (error) {
      console.error('❌ Failed to initialize FCM:', error);
    }
  }

  /**
   * 检查服务是否可用
   */
  isAvailable(): boolean {
    return this.app !== null;
  }

  /**
   * 发送推送通知到单个设备
   */
  async sendNotification(
    token: string,
    payload: {
      title: string;
      body: string;
      data?: Record<string, any>;
      imageUrl?: string;
    }
  ): Promise<void> {
    if (!this.isAvailable()) {
      throw new Error('Android push service is not configured');
    }

    const message: admin.messaging.Message = {
      token,
      notification: {
        title: payload.title,
        body: payload.body,
        imageUrl: payload.imageUrl,
      },
      data: payload.data
        ? Object.entries(payload.data).reduce((acc, [key, value]) => {
            acc[key] = String(value);
            return acc;
          }, {} as Record<string, string>)
        : undefined,
      android: {
        priority: 'high' as const,
      },
    };

    await admin.messaging().send(message);
  }

  /**
   * 批量发送推送通知
   */
  async sendBatch(
    tokens: string[],
    payload: {
      title: string;
      body: string;
      data?: Record<string, any>;
      imageUrl?: string;
    }
  ): Promise<{ success: number; failed: number; errors: Array<{ token: string; error: string }> }> {
    if (!this.isAvailable()) {
      throw new Error('Android push service is not configured');
    }

    const results = {
      success: 0,
      failed: 0,
      errors: [] as Array<{ token: string; error: string }>,
    };

    // FCM 支持批量发送，但为了更好的错误处理，我们逐个发送
    const promises = tokens.map(async (token) => {
      try {
        await this.sendNotification(token, payload);
        results.success++;
      } catch (error: any) {
        results.failed++;
        results.errors.push({
          token,
          error: error.message || 'Unknown error',
        });
      }
    });

    await Promise.allSettled(promises);
    return results;
  }
}
