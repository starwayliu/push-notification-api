export type Platform = 'web' | 'android' | 'fcm-web';

export interface PushNotificationRequest {
  title: string;
  body: string;
  platform: Platform;
  tokens: string[];
  data?: Record<string, any>;
  icon?: string;
  badge?: string;
  image?: string;
  url?: string;
}

export interface PushNotificationResponse {
  success: boolean;
  message: string;
  results?: {
    success: number;
    failed: number;
    errors?: Array<{
      token: string;
      error: string;
    }>;
  };
}

export interface ServiceStatus {
  web: boolean;
  android: boolean;
}

export interface DeviceToken {
  id: string;
  userId?: string;
  platform: Platform;
  token: string;
  createdAt: string;
  updatedAt: string;
}

export interface RegisterTokenRequest {
  userId?: string;
  platform: Platform;
  token: string;
}

export interface RegisterTokenResponse {
  success: boolean;
  message: string;
  data?: {
    id: string;
    token: DeviceToken;
  };
}
