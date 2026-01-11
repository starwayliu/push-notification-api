# 快速启动指南

## 1. 安装依赖

```bash
npm install
```

## 2. 配置环境变量

### 生成 VAPID 密钥（Web Push）

```bash
npm run generate-vapid
```

将输出的公钥和私钥复制到 `.env` 文件中。

### 创建 .env 文件

```bash
cp .env.example .env
```

然后编辑 `.env` 文件，填入以下配置：

#### Web Push (必需)
- `VAPID_PUBLIC_KEY` - 从上面的命令获取
- `VAPID_PRIVATE_KEY` - 从上面的命令获取
- `VAPID_SUBJECT` - 你的邮箱，格式: `mailto:your-email@example.com`

#### Android (FCM) - 可选
1. 前往 [Firebase Console](https://console.firebase.google.com/)
2. 创建项目并下载服务账号 JSON
3. 从 JSON 中提取：
   - `project_id` → `FCM_PROJECT_ID`
   - `private_key` → `FCM_PRIVATE_KEY` (注意：需要将 `\n` 替换为实际换行)
   - `client_email` → `FCM_CLIENT_EMAIL`

#### iOS (APNs) - 目前不支持

> **注意：iOS 推送通知功能目前不支持。** 相关配置已暂时移除。

## 3. 构建项目

```bash
npm run build
```

## 4. 启动服务器

```bash
# 开发模式（自动重启）
npm run dev

# 生产模式
npm start
```

## 5. 测试 API

### 检查服务状态

```bash
curl http://localhost:3000/api/push/status
```

### 发送测试通知

```bash
curl -X POST http://localhost:3000/api/push/send \
  -H "Content-Type: application/json" \
  -d '{
    "title": "测试通知",
    "body": "这是一条测试推送通知",
    "platform": "web",
    "tokens": ["your_device_token_here"]
  }'
```

## 常见问题

### Q: 如何获取设备令牌？

**Web:**
- 使用 Service Worker 和 Push API
- 参考 `examples/web-client-example.html`

**Android:**
- 使用 Firebase SDK 获取 FCM 令牌
```kotlin
FirebaseMessaging.getInstance().token.addOnCompleteListener { task ->
    if (task.isSuccessful) {
        val token = task.result
        // 发送 token 到你的服务器
    }
}
```

**iOS:**
> **注意：iOS 推送通知目前不支持。**

### Q: 为什么某些平台显示未初始化？

确保在 `.env` 文件中正确配置了相应平台的凭证。如果某个平台不需要，可以忽略该警告。

### Q: 如何测试推送通知？

1. 确保服务器正在运行
2. 获取真实的设备令牌
3. 使用 API 发送测试通知
4. 检查设备是否收到通知

## 下一步

- 查看完整的 [README.md](./README.md) 了解详细文档
- 查看 [examples](./examples/) 目录中的示例代码
- 在生产环境中添加身份验证和授权
