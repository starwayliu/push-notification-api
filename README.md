# 推送通知 API

支持向 Web App 和 Android 设备发送推送通知的 API 服务。

## 功能特性

- ✅ **Web 推送通知** - 使用 Web Push API (VAPID)
- ✅ **Android 推送通知** - 使用 Firebase Cloud Messaging (FCM)
- ✅ **统一 API 接口** - 一个端点支持所有平台
- ✅ **批量发送** - 支持同时向多个设备发送通知

## 快速开始

### 1. 安装依赖

```bash
npm install
```

### 2. 配置环境变量

复制 `.env.example` 文件为 `.env`：

```bash
cp .env.example .env
```

#### Web Push 配置（必需）

生成 VAPID 密钥：

```bash
npm install -g web-push
web-push generate-vapid-keys
```

将生成的公钥和私钥填入 `.env` 文件。

#### Android FCM 配置（必需）

1. 前往 [Firebase Console](https://console.firebase.google.com/)
2. 创建项目或选择现有项目
3. 进入项目设置 > 服务账号
4. 生成新的私钥并下载 JSON 文件
5. 从 JSON 文件中提取以下信息填入 `.env`：
   - `project_id` → `FCM_PROJECT_ID`
   - `private_key` → `FCM_PRIVATE_KEY`（注意：需要将 `\n` 替换为实际换行）
   - `client_email` → `FCM_CLIENT_EMAIL`

### 3. 构建项目

```bash
npm run build
```

### 4. 启动服务器

```bash
# 开发模式（自动重启）
npm run dev

# 生产模式
npm start
```

服务器将在 `http://localhost:3000` 启动。

## API 文档

### 1. 检查服务状态

**端点:** `GET /api/push/status`

**响应:**
```json
{
  "success": true,
  "services": {
    "web": true,
    "android": true
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

### 3. 发送推送通知

**端点:** `POST /api/push/send`

**请求体:**
```json
{
  "title": "通知标题",
  "body": "通知内容",
  "platform": "web",
  "tokens": ["device_token_1", "device_token_2"],
  "icon": "https://example.com/icon.png",
  "badge": "https://example.com/badge.png",
  "image": "https://example.com/image.png",
  "url": "https://example.com",
  "data": {
    "customKey": "customValue"
  }
}
```

**字段说明:**
- `title` (必需) - 通知标题
- `body` (必需) - 通知内容
- `platform` (必需) - 平台类型：`"web"` 或 `"android"`
- `tokens` (必需) - 设备令牌数组
  - Web: 需要传入完整的 PushSubscription JSON 字符串
  - Android: 传入 FCM 设备令牌
- `icon` (可选) - 通知图标 URL
- `badge` (可选) - 通知徽章 URL（仅 Web）
- `image` (可选) - 通知图片 URL
- `url` (可选) - 点击通知后跳转的 URL（仅 Web）
- `data` (可选) - 自定义数据对象

**响应:**
```json
{
  "success": true,
  "message": "Sent 2 notifications, 0 failed",
  "results": {
    "success": 2,
    "failed": 0
  }
}
```

**错误响应:**
```json
{
  "success": false,
  "message": "Sent 1 notifications, 1 failed",
  "results": {
    "success": 1,
    "failed": 1,
    "errors": [
      {
        "token": "device_token",
        "error": "Error message"
      }
    ]
  }
}
```

## 使用示例

### Web 推送通知

```bash
curl -X POST http://localhost:3000/api/push/send \
  -H "Content-Type: application/json" \
  -d '{
    "title": "新消息",
    "body": "您有一条新消息",
    "platform": "web",
    "tokens": ["{\"endpoint\":\"https://...\",\"keys\":{\"p256dh\":\"...\",\"auth\":\"...\"}}"],
    "url": "https://example.com/notifications"
  }'
```

### Android 推送通知

```bash
curl -X POST http://localhost:3000/api/push/send \
  -H "Content-Type: application/json" \
  -d '{
    "title": "新消息",
    "body": "您有一条新消息",
    "platform": "android",
    "tokens": ["fcm_device_token_here"],
    "data": {
      "type": "message",
      "id": "123"
    }
  }'
```

## 项目结构

```
.
├── src/
│   ├── index.ts              # Express 服务器主文件
│   ├── routes/
│   │   └── pushRoutes.ts     # API 路由
│   ├── services/
│   │   ├── webPushService.ts # Web Push 服务
│   │   └── androidPushService.ts # Android FCM 服务
│   └── types/
│       └── index.ts          # TypeScript 类型定义
├── package.json
├── tsconfig.json
└── README.md
```

## 开发

### 开发模式

```bash
npm run dev
```

### 构建

```bash
npm run build
```

### 监听模式

```bash
npm run watch
```

## 许可证

MIT
