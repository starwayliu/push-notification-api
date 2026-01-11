import express from 'express';
import { WebPushService } from '../services/webPushService';
import { AndroidPushService } from '../services/androidPushService';
import { PushNotificationRequest, PushNotificationResponse, ServiceStatus } from '../types';

const router = express.Router();
const webPushService = new WebPushService();
const androidPushService = new AndroidPushService();

/**
 * 获取服务状态
 * GET /api/push/status
 */
router.get('/status', (req, res) => {
  const status: ServiceStatus = {
    web: webPushService.isAvailable(),
    android: androidPushService.isAvailable(),
  };

  res.json({
    success: true,
    services: status,
  });
});

/**
 * 获取 Web Push 公钥
 * GET /api/push/web/public-key
 */
router.get('/web/public-key', (req, res) => {
  if (!webPushService.isAvailable()) {
    return res.status(503).json({
      success: false,
      message: 'Web push service is not configured',
    });
  }

  res.json({
    success: true,
    publicKey: webPushService.getPublicKey(),
  });
});

/**
 * 发送推送通知
 * POST /api/push/send
 */
router.post('/send', async (req, res) => {
  try {
    const request: PushNotificationRequest = req.body;

    // 验证请求数据
    if (!request.title || !request.body || !request.platform || !request.tokens) {
      return res.status(400).json({
        success: false,
        message: 'Missing required fields: title, body, platform, tokens',
      });
    }

    if (!Array.isArray(request.tokens) || request.tokens.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'tokens must be a non-empty array',
      });
    }

    if (request.platform !== 'web' && request.platform !== 'android') {
      return res.status(400).json({
        success: false,
        message: 'platform must be "web" or "android"',
      });
    }

    let response: PushNotificationResponse;

    if (request.platform === 'web') {
      // Web Push 通知
      if (!webPushService.isAvailable()) {
        return res.status(503).json({
          success: false,
          message: 'Web push service is not configured',
        });
      }

      // 将 tokens 转换为 PushSubscription 对象
      const subscriptions = request.tokens.map((token) => {
        try {
          return JSON.parse(token) as any;
        } catch {
          throw new Error(`Invalid subscription format: ${token}`);
        }
      });

      const results = await webPushService.sendBatch(subscriptions, {
        title: request.title,
        body: request.body,
        icon: request.icon,
        badge: request.badge,
        image: request.image,
        url: request.url,
        data: request.data,
      });

      response = {
        success: results.failed === 0,
        message: `Sent ${results.success} notifications, ${results.failed} failed`,
        results: {
          success: results.success,
          failed: results.failed,
          errors: results.errors.length > 0 ? results.errors : undefined,
        },
      };
    } else {
      // Android FCM 通知
      if (!androidPushService.isAvailable()) {
        return res.status(503).json({
          success: false,
          message: 'Android push service is not configured',
        });
      }

      const results = await androidPushService.sendBatch(request.tokens, {
        title: request.title,
        body: request.body,
        data: request.data,
        imageUrl: request.image,
      });

      response = {
        success: results.failed === 0,
        message: `Sent ${results.success} notifications, ${results.failed} failed`,
        results: {
          success: results.success,
          failed: results.failed,
          errors: results.errors.length > 0 ? results.errors : undefined,
        },
      };
    }

    res.json(response);
  } catch (error: any) {
    console.error('Error sending push notification:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Internal server error',
    });
  }
});

export default router;
