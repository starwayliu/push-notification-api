# Vercel 部署修复指南

## 已修复的问题

1. ✅ **Express 应用导出** - 修改 `src/index.ts` 导出 Express app 而不是直接启动服务器
2. ✅ **Serverless 函数入口** - 创建 `api/index.ts` 作为 Vercel serverless 函数入口点
3. ✅ **Vercel 配置** - 创建 `vercel.json` 配置文件
4. ✅ **TypeScript 配置** - 更新 `tsconfig.json` 包含 api 目录

## 部署步骤

### 1. 确保所有文件已提交

```bash
git add .
git commit -m "Fix Vercel deployment"
git push
```

### 2. 在 Vercel Dashboard 中配置

1. 进入项目设置
2. 确认以下配置：
   - **Framework Preset**: Other
   - **Build Command**: `npm run build`
   - **Output Directory**: (留空)
   - **Install Command**: `npm install`

### 3. 配置环境变量

在 Vercel Dashboard > Settings > Environment Variables 中添加：

#### Web Push (必需)
```
VAPID_PUBLIC_KEY=你的VAPID公钥
VAPID_PRIVATE_KEY=你的VAPID私钥
VAPID_SUBJECT=mailto:your-email@example.com
```

#### Android FCM (可选)
```
FCM_PROJECT_ID=你的Firebase项目ID
FCM_PRIVATE_KEY=你的Firebase私钥
FCM_CLIENT_EMAIL=你的Firebase客户端邮箱
```

### 4. 重新部署

在 Vercel Dashboard 中点击 "Redeploy" 或推送新代码到 GitHub。

## 项目结构

```
.
├── api/
│   └── index.ts          # Vercel serverless 函数入口
├── src/
│   ├── index.ts          # Express 应用（导出 app）
│   ├── routes/           # API 路由
│   ├── services/         # 推送服务
│   └── types/            # TypeScript 类型
├── vercel.json           # Vercel 配置
└── package.json
```

## 常见问题

### 问题：函数调用失败 (FUNCTION_INVOCATION_FAILED)

**可能原因：**
1. 环境变量未配置
2. 依赖安装失败
3. TypeScript 编译错误

**解决方法：**
1. 检查 Vercel 构建日志
2. 确保所有环境变量都已设置
3. 本地运行 `npm run build` 检查是否有编译错误

### 问题：模块找不到

**解决方法：**
- 确保 `package.json` 中所有依赖都已正确安装
- 检查 `tsconfig.json` 配置是否正确

### 问题：Firebase Admin SDK 初始化失败

**解决方法：**
- 确保 FCM 环境变量格式正确
- 检查 `FCM_PRIVATE_KEY` 中的换行符是否正确（在 Vercel 中直接粘贴即可）

## 验证部署

部署成功后，访问以下端点验证：

```bash
# 健康检查
curl https://your-app.vercel.app/health

# 服务状态
curl https://your-app.vercel.app/api/push/status

# Web Push 公钥
curl https://your-app.vercel.app/api/push/web/public-key
```

## 调试技巧

1. **查看日志**：Vercel Dashboard > Functions > Logs
2. **本地测试**：使用 `vercel dev` 命令本地测试
3. **检查环境变量**：确保所有必需的环境变量都已设置
