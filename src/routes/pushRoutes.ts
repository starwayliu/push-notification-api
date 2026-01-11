import express from 'express';
import { WebPushService } from '../services/webPushService';
import { AndroidPushService } from '../services/androidPushService';
import { tokenStorage } from '../services/tokenStorageService';
import {
  PushNotificationRequest,
  PushNotificationResponse,
  ServiceStatus,
  RegisterTokenRequest,
  RegisterTokenResponse,
  Platform,
} from '../types';

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
 * 获取 Web Push 公钥 (VAPID)
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
 * 获取 FCM Web 配置信息
 * GET /api/push/fcm/web/config
 */
router.get('/fcm/web/config', (req, res) => {
  if (!androidPushService.isAvailable()) {
    return res.status(503).json({
      success: false,
      message: 'FCM service is not configured',
    });
  }

  const projectId = androidPushService.getProjectId();
  if (!projectId) {
    return res.status(503).json({
      success: false,
      message: 'FCM project ID is not configured',
    });
  }

  res.json({
    success: true,
    config: {
      projectId,
      // 注意：messagingSenderId 通常等于 projectId，但可能需要单独配置
      messagingSenderId: process.env.FCM_MESSAGING_SENDER_ID || projectId,
    },
    instructions: {
      message: '在浏览器中使用 Firebase SDK 初始化 FCM 并获取 token',
      steps: [
        '1. 在 Firebase Console 中创建 Web App',
        '2. 获取 Firebase 配置对象（包含 apiKey, authDomain, projectId 等）',
        '3. 在浏览器中使用 Firebase SDK 初始化并获取 messaging token',
        '4. 将获取到的 token 通过 POST /api/push/tokens 注册',
      ],
    },
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

    if (request.platform !== 'web' && request.platform !== 'android' && request.platform !== 'fcm-web') {
      return res.status(400).json({
        success: false,
        message: 'platform must be "web", "android", or "fcm-web"',
      });
    }

    let response: PushNotificationResponse;

    if (request.platform === 'web') {
      // VAPID Web Push 通知
      // Web Push 通知
      if (!webPushService.isAvailable()) {
        return res.status(503).json({
          success: false,
          message: 'Web push service is not configured',
        });
      }

      // 将 tokens 转换为 PushSubscription 对象
      const subscriptions: any[] = [];
      const invalidTokens: string[] = [];
      
      request.tokens.forEach((token) => {
        try {
          subscriptions.push(JSON.parse(token) as any);
        } catch {
          invalidTokens.push(token);
        }
      });

      if (invalidTokens.length > 0) {
        return res.status(400).json({
          success: false,
          message: `Invalid subscription format for ${invalidTokens.length} token(s)`,
          errors: invalidTokens.map(token => ({
            token,
            error: 'Invalid JSON format'
          }))
        });
      }

      if (subscriptions.length === 0) {
        return res.status(400).json({
          success: false,
          message: 'No valid subscriptions provided',
        });
      }

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
    } else if (request.platform === 'fcm-web') {
      // FCM Web 通知
      if (!androidPushService.isAvailable()) {
        return res.status(503).json({
          success: false,
          message: 'FCM service is not configured',
        });
      }

      const results = await androidPushService.sendBatch(request.tokens, {
        title: request.title,
        body: request.body,
        data: request.data,
        imageUrl: request.image,
        platform: 'web',
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
          message: 'FCM service is not configured',
        });
      }

      const results = await androidPushService.sendBatch(request.tokens, {
        title: request.title,
        body: request.body,
        data: request.data,
        imageUrl: request.image,
        platform: 'android',
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

/**
 * 注册/保存 device token
 * POST /api/push/tokens
 */
router.post('/tokens', (req, res) => {
  try {
    const request: RegisterTokenRequest = req.body;

    // 验证请求数据
    if (!request.platform || !request.token) {
      return res.status(400).json({
        success: false,
        message: 'Missing required fields: platform, token',
      });
    }

    if (request.platform !== 'web' && request.platform !== 'android' && request.platform !== 'fcm-web') {
      return res.status(400).json({
        success: false,
        message: 'platform must be "web", "android", or "fcm-web"',
      });
    }

    // 验证 token 格式
    if (request.platform === 'web') {
      try {
        JSON.parse(request.token);
      } catch {
        return res.status(400).json({
          success: false,
          message: 'Web platform token must be a valid JSON string',
        });
      }
    }
    // FCM Web token 是字符串格式，不需要验证 JSON

    // 注册 token
    const deviceToken = tokenStorage.registerToken(
      request.userId,
      request.platform,
      request.token
    );

    const response: RegisterTokenResponse = {
      success: true,
      message: 'Token registered successfully',
      data: {
        id: deviceToken.id,
        token: deviceToken,
      },
    };

    res.status(201).json(response);
  } catch (error: any) {
    console.error('Error registering token:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Internal server error',
    });
  }
});

/**
 * 获取 device tokens
 * GET /api/push/tokens?userId=xxx&platform=web
 * GET /api/push/tokens/:tokenId
 */
router.get('/tokens/:tokenId?', (req, res) => {
  try {
    const { tokenId } = req.params;
    const { userId, platform } = req.query;

    // 如果提供了 tokenId，获取单个 token
    if (tokenId) {
      const token = tokenStorage.getTokenById(tokenId);
      if (!token) {
        return res.status(404).json({
          success: false,
          message: 'Token not found',
        });
      }

      return res.json({
        success: true,
        data: token,
      });
    }

    // 获取多个 tokens
    const tokens = tokenStorage.getAllTokens(
      userId as string | undefined,
      platform as Platform | undefined
    );

    res.json({
      success: true,
      count: tokens.length,
      data: tokens,
    });
  } catch (error: any) {
    console.error('Error getting tokens:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Internal server error',
    });
  }
});

/**
 * 根据用户 ID 获取 tokens
 * GET /api/push/tokens/user/:userId?platform=web
 */
router.get('/tokens/user/:userId', (req, res) => {
  try {
    const { userId } = req.params;
    const { platform } = req.query;

    let tokens = tokenStorage.getTokensByUserId(userId);

    // 如果指定了平台，进行过滤
    if (platform && (platform === 'web' || platform === 'android')) {
      tokens = tokens.filter((token) => token.platform === platform);
    }

    res.json({
      success: true,
      userId,
      count: tokens.length,
      data: tokens,
    });
  } catch (error: any) {
    console.error('Error getting user tokens:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Internal server error',
    });
  }
});

/**
 * 获取统计信息
 * GET /api/push/tokens/stats
 */
router.get('/tokens/stats', (req, res) => {
  try {
    const stats = tokenStorage.getStats();

    res.json({
      success: true,
      data: stats,
    });
  } catch (error: any) {
    console.error('Error getting stats:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Internal server error',
    });
  }
});

/**
 * 删除 device token
 * DELETE /api/push/tokens/:tokenId
 */
router.delete('/tokens/:tokenId', (req, res) => {
  try {
    const { tokenId } = req.params;

    const deleted = tokenStorage.deleteToken(tokenId);

    if (!deleted) {
      return res.status(404).json({
        success: false,
        message: 'Token not found',
      });
    }

    res.json({
      success: true,
      message: 'Token deleted successfully',
    });
  } catch (error: any) {
    console.error('Error deleting token:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Internal server error',
    });
  }
});

/**
 * 删除用户的所有 tokens
 * DELETE /api/push/tokens/user/:userId
 */
router.delete('/tokens/user/:userId', (req, res) => {
  try {
    const { userId } = req.params;

    const count = tokenStorage.deleteTokensByUserId(userId);

    res.json({
      success: true,
      message: `Deleted ${count} token(s) for user ${userId}`,
      count,
    });
  } catch (error: any) {
    console.error('Error deleting user tokens:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Internal server error',
    });
  }
});

export default router;
