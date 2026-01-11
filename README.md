# 多平台推送通知 API

这是一个支持向 Web App 和 Android 设备发送推送通知的 API 服务。

> **注意：** iOS 推送通知功能目前不支持。

## 功能特性

- ✅ **Web 推送通知** - 使用 Web Push API (VAPID)
- ✅ **Android 推送通知** - 使用 Firebase Cloud Messaging (FCM)
- ❌ **iOS 推送通知** - 目前不支持
- ✅ **统一 API 接口** - 一个端点支持所有平台
- ✅ **批量发送** - 支持同时向多个设备发送通知

## 部署

### Vercel 部署（推荐）

快速部署到 Vercel 平台，查看 [VERCEL.md](./VERCEL.md) 获取详细部署指南。

### Zeabur 部署

快速部署到 Zeabur 云平台，查看 [ZEABUR.md](./ZEABUR.md) 获取详细部署指南。

### 本地开发

## 快速开始

### 1. 安装依赖

```bash
npm install
```

### 2. 配置环境变量

复制 `.env.example` 文件为 `.env` 并填写相应的配置：

```bash
cp .env.example .env
```

#### Web Push 配置 (VAPID)

生成 VAPID 密钥：

```bash
npm install -g web-push
web-push generate-vapid-keys
```

将生成的公钥和私钥填入 `.env` 文件。

#### Android (FCM) 配置

1. 前往 [Firebase Console](https://console.firebase.google.com/)
2. 创建项目或选择现有项目
3. 进入项目设置 > 服务账号
4. 生成新的私钥并下载 JSON 文件
5. 从 JSON 文件中提取以下信息填入 `.env`：
   - `project_id` → `FCM_PROJECT_ID`
   - `private_key` → `FCM_PRIVATE_KEY`
   - `client_email` → `FCM_CLIENT_EMAIL`

#### iOS (APNs) 配置

> **注意：iOS 推送通知目前不支持。** 以下配置信息仅供参考，实际功能暂未启用。

### 3. 构建项目

```bash
npm run build
```

### 4. 启动服务器

```bash
# 生产环境
npm start

# 开发环境（自动重启）
npm run dev
```

服务器将在 `http://localhost:3000` 启动。

## API 文档

### 1. 发送推送通知

**端点:** `POST /api/push/send`

**请求体:**

```json
{
  "title": "通知标题",
  "body": "通知内容",
  "icon": "https://example.com/icon.png",
  "image": "https://example.com/image.png",
  "badge": "https://example.com/badge.png",
  "sound": "default",
  "priority": "high",
  "platform": "all",
  "tokens": [
    "device_token_1",
    "device_token_2"
  ],
  "data": {
    "customField": "customValue"
  }
}
```

**参数说明:**

- `title` (必需): 通知标题
- `body` (必需): 通知内容
- `platform` (必需): 平台类型 (`web`, `android`, `all`)
  - **注意：** `ios` 平台目前不支持，请使用 `web`、`android` 或 `all`
- `tokens` (必需): 设备令牌数组
  - Web: Web Push Subscription 对象的 JSON 字符串
  - Android: FCM 设备令牌
- `icon` (可选): 通知图标 URL
- `image` (可选): 通知图片 URL
- `badge` (可选): 徽章图标 URL (Web)
- `sound` (可选): 通知声音
- `priority` (可选): 优先级 (`high`, `normal`)
- `data` (可选): 自定义数据对象

**响应示例:**

```json
{
  "success": true,
  "message": "Notifications sent successfully",
  "results": {
    "web": {
      "success": 2,
      "failed": 0
    },
    "android": {
      "success": 5,
      "failed": 1
    },
  }
}
```

### 2. 获取 Web Push 公钥

**端点:** `GET /api/push/web/public-key`

**响应:**

```json
{
  "success": true,
  "publicKey": "your_vapid_public_key"
}
```

### 3. 获取服务状态

**端点:** `GET /api/push/status`

**响应:**

```json
{
  "success": true,
  "services": {
    "web": true,
    "android": true,
    "ios": false
  }
}
```

### 4. 健康检查

**端点:** `GET /health`

**响应:**

```json
{
  "status": "ok",
  "timestamp": "2024-01-01T00:00:00.000Z"
}
```

## 客户端集成示例

### Web 客户端

```javascript
// 获取公钥
const response = await fetch('http://localhost:3000/api/push/web/public-key');
const { publicKey } = await response.json();

// 订阅推送
const registration = await navigator.serviceWorker.ready;
const subscription = await registration.pushManager.subscribe({
  userVisibleOnly: true,
  applicationServerKey: urlBase64ToUint8Array(publicKey)
});

// 发送通知
await fetch('http://localhost:3000/api/push/send', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    title: 'Hello',
    body: 'This is a web push notification',
    platform: 'web',
    tokens: [JSON.stringify(subscription)]
  })
});
```

### Android 客户端

```javascript
// 获取 FCM 令牌（使用 Firebase SDK）
const token = await messaging.getToken();

// 发送通知
await fetch('http://localhost:3000/api/push/send', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    title: 'Hello',
    body: 'This is an Android push notification',
    platform: 'android',
    tokens: [token]
  })
});
```

### iOS 客户端

> **注意：iOS 推送通知目前不支持。** 以下示例代码仅供参考。

## 项目结构

```
push-notification-api/
├── src/
│   ├── services/
│   │   ├── webPushService.ts      # Web 推送服务
│   │   ├── androidPushService.ts  # Android 推送服务
│   │   ├── iosPushService.ts      # iOS 推送服务（目前未启用）
│   │   └── pushNotificationService.ts  # 统一推送服务
│   ├── routes/
│   │   └── pushRoutes.ts          # API 路由
│   ├── types/
│   │   └── index.ts               # TypeScript 类型定义
│   └── index.ts                   # 应用入口
├── dist/                          # 编译后的 JavaScript 文件
├── .env.example                   # 环境变量示例
├── package.json
├── tsconfig.json
└── README.md
```

## 注意事项

1. **安全性**: 在生产环境中，请确保：
   - 使用 HTTPS
   - 实施身份验证和授权
   - 保护 API 密钥和凭证

2. **令牌管理**: 
   - 定期清理无效的推送令牌
   - 处理令牌过期和失效的情况

3. **错误处理**: 
   - 监控推送失败的情况
   - 实现重试机制
   - 记录错误日志

4. **性能优化**:
   - 对于大量设备，考虑使用队列系统
   - 实现速率限制
   - 使用批量发送 API

## 许可证

MIT
