# Zeabur 部署指南

本指南将帮助您将推送通知 API 部署到 Zeabur 平台。

## 前置准备

1. **Zeabur 账户**
   - 访问 [Zeabur 官网](https://zeabur.com/zh-CN) 注册账户
   - 可以使用 GitHub 账号快速登录

2. **GitHub 仓库**
   - 将代码推送到 GitHub 仓库
   - 确保仓库是公开的，或授权 Zeabur 访问私有仓库

3. **环境变量准备**
   - 准备好 VAPID 密钥（Web Push 必需）
   - 准备好 FCM 凭证（Android 可选）

## 部署步骤

### 1. 创建项目

1. 登录 Zeabur 控制台
2. 点击右上角「创建项目」
3. 选择区域（推荐：AWS Taipei）
4. 输入项目名称

### 2. 添加服务

1. 在项目中点击「添加服务」
2. 选择「从 GitHub 部署」
3. 授权 Zeabur 访问您的 GitHub 账户（如需要）
4. 选择您的仓库

### 3. 配置构建设置

Zeabur 会自动检测到这是一个 Node.js TypeScript 项目，并设置：

- **构建命令**: `npm run build`
- **启动命令**: `npm start`
- **Node 版本**: 自动检测（建议 Node.js 18+）

如果自动检测不正确，您可以手动设置：

```
构建命令: npm run build
启动命令: npm start
```

### 4. 配置环境变量

在服务设置中找到「环境变量」部分，添加以下变量：

#### Web Push (必需)

```
VAPID_PUBLIC_KEY=你的VAPID公钥
VAPID_PRIVATE_KEY=你的VAPID私钥
VAPID_SUBJECT=mailto:your-email@example.com
```

**生成 VAPID 密钥：**

```bash
npm install -g web-push
web-push generate-vapid-keys
```

#### Android (FCM) - 可选

```
FCM_PROJECT_ID=你的Firebase项目ID
FCM_PRIVATE_KEY=你的Firebase私钥（注意：保留换行符）
FCM_CLIENT_EMAIL=你的Firebase客户端邮箱
```

**获取 FCM 凭证：**

1. 前往 [Firebase Console](https://console.firebase.google.com/)
2. 进入项目设置 > 服务账号
3. 生成新的私钥并下载 JSON 文件
4. 从 JSON 中提取：
   - `project_id` → `FCM_PROJECT_ID`
   - `private_key` → `FCM_PRIVATE_KEY`（注意：在 Zeabur 中直接粘贴，换行符会自动处理）
   - `client_email` → `FCM_CLIENT_EMAIL`

#### 服务器配置

```
NODE_ENV=production
```

**注意：** `PORT` 环境变量由 Zeabur 自动设置，无需手动配置。

### 5. 部署

1. 确认所有配置无误
2. 点击「部署」按钮
3. 等待构建和部署完成（通常需要 2-5 分钟）

### 6. 绑定域名

部署完成后：

1. 进入服务的「网络」选项卡
2. Zeabur 会自动分配一个 `*.zeabur.app` 域名
3. 也可以绑定自定义域名：
   - 点击「添加域名」
   - 输入您的域名
   - 按照提示配置 DNS 记录

## 验证部署

### 1. 检查健康状态

```bash
curl https://your-app.zeabur.app/health
```

应该返回：

```json
{
  "status": "ok",
  "timestamp": "2024-01-01T00:00:00.000Z"
}
```

### 2. 检查服务状态

```bash
curl https://your-app.zeabur.app/api/push/status
```

应该返回：

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

### 3. 测试 API

```bash
curl -X POST https://your-app.zeabur.app/api/push/send \
  -H "Content-Type: application/json" \
  -d '{
    "title": "测试通知",
    "body": "这是一条测试推送通知",
    "platform": "web",
    "tokens": ["your_device_token_here"]
  }'
```

## 常见问题

### Q: 构建失败怎么办？

**可能原因：**
- TypeScript 编译错误
- 依赖安装失败
- Node 版本不兼容

**解决方法：**
1. 检查构建日志中的错误信息
2. 确保本地可以成功运行 `npm run build`
3. 检查 `package.json` 中的依赖版本

### Q: 服务启动失败？

**可能原因：**
- 环境变量未正确配置
- 端口配置问题

**解决方法：**
1. 检查环境变量是否都已设置
2. 确认 `VAPID_PUBLIC_KEY` 和 `VAPID_PRIVATE_KEY` 已配置
3. 查看服务日志排查错误

### Q: 如何更新代码？

Zeabur 支持自动部署：

1. **自动部署（推荐）**
   - 推送代码到 GitHub 主分支
   - Zeabur 会自动检测并重新部署

2. **手动部署**
   - 在服务设置中点击「重新部署」

### Q: 如何查看日志？

1. 进入服务页面
2. 点击「日志」选项卡
3. 可以查看实时日志和历史日志

### Q: 环境变量中的换行符如何处理？

对于 `FCM_PRIVATE_KEY`，在 Zeabur 中直接粘贴完整的私钥字符串即可，Zeabur 会自动处理换行符。不需要手动转义 `\n`。

## 性能优化建议

1. **启用自动扩展**
   - 在服务设置中配置自动扩展规则
   - 根据 CPU 或内存使用率自动扩展实例

2. **使用缓存**
   - 对于频繁访问的端点，考虑添加缓存层

3. **监控和告警**
   - 设置监控告警，及时发现问题

## 安全建议

1. **保护环境变量**
   - 不要在代码中硬编码密钥
   - 使用 Zeabur 的环境变量功能

2. **HTTPS**
   - Zeabur 自动提供 HTTPS
   - 确保使用 HTTPS 端点

3. **API 认证**
   - 在生产环境中添加 API 密钥认证
   - 实施速率限制

## 下一步

- 查看完整的 [README.md](./README.md) 了解 API 使用
- 查看 [QUICKSTART.md](./QUICKSTART.md) 了解本地开发
- 集成到您的应用程序中

## 相关链接

- [Zeabur 文档](https://zeabur.com/docs/zh-CN)
- [Zeabur 控制台](https://dash.zeabur.com/)
