export type Platform = 'web' | 'android';

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
