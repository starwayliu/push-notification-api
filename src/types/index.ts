export interface PushNotificationRequest {
  title: string;
  body: string;
  icon?: string;
  badge?: string;
  image?: string;
  data?: any;
  platform: 'web' | 'android' | 'ios' | 'all';
  tokens: string[];
  sound?: string;
  priority?: 'high' | 'normal';
  ttl?: number;
}

export interface WebPushSubscription {
  endpoint: string;
  keys: {
    p256dh: string;
    auth: string;
  };
}

export interface PushNotificationResponse {
  success: boolean;
  message: string;
  results?: {
    web?: { success: number; failed: number };
    android?: { success: number; failed: number };
    ios?: { success: number; failed: number };
  };
  errors?: string[];
}
