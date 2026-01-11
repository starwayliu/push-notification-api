import { Router, Request, Response } from 'express';
import { PushNotificationService } from '../services/pushNotificationService';
import { PushNotificationRequest } from '../types';

const router = Router();
const pushService = new PushNotificationService();

// Send push notification
router.post('/send', async (req: Request, res: Response) => {
  try {
    const request: PushNotificationRequest = req.body;

    // Validation
    if (!request.title || !request.body) {
      return res.status(400).json({
        success: false,
        message: 'Title and body are required',
      });
    }

    if (!request.platform) {
      return res.status(400).json({
        success: false,
        message: 'Platform is required (web, android, ios, or all)',
      });
    }

    if (!request.tokens || !Array.isArray(request.tokens) || request.tokens.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'At least one token is required',
      });
    }

    const result = await pushService.sendNotification(request);
    const statusCode = result.success ? 200 : 500;

    res.status(statusCode).json(result);
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: `Internal server error: ${error.message}`,
    });
  }
});

// Get Web Push public key (for client-side subscription)
router.get('/web/public-key', (req: Request, res: Response) => {
  const publicKey = pushService.getWebPushPublicKey();
  
  if (!publicKey) {
    return res.status(503).json({
      success: false,
      message: 'Web Push service not configured',
    });
  }

  res.json({
    success: true,
    publicKey,
  });
});

// Get service status
router.get('/status', (req: Request, res: Response) => {
  const status = pushService.getServiceStatus();
  res.json({
    success: true,
    services: status,
  });
});

export default router;
