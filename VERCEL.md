# Vercel 部署指南

本指南将帮助您将推送通知 API 部署到 Vercel 平台。

## 前置准备

1. **Vercel 账户**
   - 访问 [Vercel 官网](https://vercel.com) 注册账户
   - 可以使用 GitHub 账号快速登录

2. **GitHub 仓库**
   - 将代码推送到 GitHub 仓库
   - 确保仓库是公开的，或授权 Vercel 访问私有仓库

3. **环境变量准备**
   - 准备好 VAPID 密钥（Web Push 必需）
   - 准备好 FCM 凭证（Android 可选）

## 部署步骤

### 方法一：通过 Vercel Dashboard（推荐）

1. **导入项目**
   - 登录 [Vercel Dashboard](https://vercel.com/dashboard)
   - 点击「Add New Project」
   - 选择「Import Git Repository」
   - 选择您的 GitHub 仓库

2. **配置项目**
   - Vercel 会自动检测到这是一个 Node.js TypeScript 项目
   - **Framework Preset**: 选择「Other」或留空
   - **Root Directory**: 留空（使用根目录）
   - **Build Command**: `npm run build`
   - **Output Directory**: `dist`（可选，Vercel 会自动处理）
   - **Install Command**: `npm install`

3. **配置环境变量**
   在「Environment Variables」部分添加以下变量：

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
      - `private_key` → `FCM_PRIVATE_KEY`（注意：在 Vercel 中直接粘贴，换行符会自动处理）
      - `client_email` → `FCM_CLIENT_EMAIL`

   #### 服务器配置
   ```
   NODE_ENV=production
   ```

4. **部署**
   - 点击「Deploy」按钮
   - 等待构建和部署完成（通常需要 1-3 分钟）

### 方法二：通过 Vercel CLI

1. **安装 Vercel CLI**
   ```bash
   npm i -g vercel
   ```

2. **登录 Vercel**
   ```bash
   vercel login
   ```

3. **部署项目**
   ```bash
   vercel
   ```

4. **配置环境变量**
   ```bash
   vercel env add VAPID_PUBLIC_KEY
   vercel env add VAPID_PRIVATE_KEY
   vercel env add VAPID_SUBJECT
   # ... 添加其他环境变量
   ```

5. **生产环境部署**
   ```bash
   vercel --prod
   ```

## 验证部署

### 1. 检查健康状态

```bash
curl https://your-app.vercel.app/health
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
curl https://your-app.vercel.app/api/push/status
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
curl -X POST https://your-app.vercel.app/api/push/send \
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
4. 在 Vercel 项目设置中指定 Node.js 版本（推荐 18.x）

### Q: 服务启动失败？

**可能原因：**
- 环境变量未正确配置
- 路由配置问题

**解决方法：**
1. 检查环境变量是否都已设置
2. 确认 `VAPID_PUBLIC_KEY` 和 `VAPID_PRIVATE_KEY` 已配置
3. 查看 Vercel 函数日志排查错误

### Q: 如何更新代码？

Vercel 支持自动部署：

1. **自动部署（推荐）**
   - 推送代码到 GitHub 主分支
   - Vercel 会自动检测并重新部署

2. **手动部署**
   - 在 Vercel Dashboard 中点击「Redeploy」
   - 或使用 CLI: `vercel --prod`

### Q: 如何查看日志？

1. 进入 Vercel Dashboard
2. 选择您的项目
3. 点击「Functions」或「Logs」选项卡
4. 可以查看实时日志和历史日志

### Q: 环境变量中的换行符如何处理？

对于 `FCM_PRIVATE_KEY`，在 Vercel 中直接粘贴完整的私钥字符串即可，Vercel 会自动处理换行符。不需要手动转义 `\n`。

### Q: 函数超时问题？

Vercel 免费版有 10 秒的执行时间限制。如果您的推送操作需要更长时间：

1. 考虑使用异步处理
2. 升级到 Vercel Pro（60 秒限制）
3. 将长时间运行的任务移到后台处理

## 性能优化建议

1. **使用 Edge Functions**
   - 对于简单的请求，考虑使用 Vercel Edge Functions
   - 可以显著降低延迟

2. **缓存策略**
   - 对于频繁访问的端点，考虑添加缓存头
   - 使用 Vercel 的缓存功能

3. **监控和告警**
   - 在 Vercel Dashboard 中设置监控告警
   - 及时发现问题

## 安全建议

1. **保护环境变量**
   - 不要在代码中硬编码密钥
   - 使用 Vercel 的环境变量功能
   - 区分开发、预览和生产环境变量

2. **HTTPS**
   - Vercel 自动提供 HTTPS
   - 确保使用 HTTPS 端点

3. **API 认证**
   - 在生产环境中添加 API 密钥认证
   - 实施速率限制

## 项目结构说明

```
.
├── api/
│   └── index.ts          # Vercel serverless 函数入口
├── src/
│   ├── index.ts          # Express 应用主文件
│   ├── routes/           # API 路由
│   └── services/         # 推送服务
├── vercel.json           # Vercel 配置文件
├── package.json
└── tsconfig.json
```

## 相关链接

- [Vercel 文档](https://vercel.com/docs)
- [Vercel Dashboard](https://vercel.com/dashboard)
- [Vercel CLI 文档](https://vercel.com/docs/cli)
