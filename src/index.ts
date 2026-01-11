import express from 'express';
import cors from 'cors';
import bodyParser from 'body-parser';
import dotenv from 'dotenv';
import pushRoutes from './routes/pushRoutes';

// Load environment variables
dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
  });
});

// API routes
app.use('/api/push', pushRoutes);

// Root endpoint
app.get('/', (req, res) => {
  res.json({
    message: 'Push Notification API',
    version: '1.0.0',
    platforms: ['web', 'android'],
    endpoints: {
      health: 'GET /health',
      status: 'GET /api/push/status',
      webPublicKey: 'GET /api/push/web/public-key',
      send: 'POST /api/push/send',
      registerToken: 'POST /api/push/tokens',
      getTokens: 'GET /api/push/tokens',
      getUserTokens: 'GET /api/push/tokens/user/:userId',
      getTokenStats: 'GET /api/push/tokens/stats',
      deleteToken: 'DELETE /api/push/tokens/:tokenId',
      deleteUserTokens: 'DELETE /api/push/tokens/user/:userId',
    },
  });
});

// Error handling middleware
app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
  console.error('Error:', err);
  res.status(500).json({
    success: false,
    message: 'Internal server error',
    error: process.env.NODE_ENV === 'development' ? err.message : undefined,
  });
});

// Export app for Vercel serverless functions
export default app;

// Start server only if not in Vercel environment
if (process.env.VERCEL !== '1' && !process.env.VERCEL_ENV) {
  app.listen(PORT, () => {
    console.log(`🚀 Push Notification API server running on port ${PORT}`);
    console.log(`📱 Supported platforms: Web, Android`);
    console.log(`\nAvailable endpoints:`);
    console.log(`  GET  /health`);
    console.log(`  GET  /api/push/status`);
    console.log(`  GET  /api/push/web/public-key`);
    console.log(`  POST /api/push/send`);
    console.log(`  POST /api/push/tokens`);
    console.log(`  GET  /api/push/tokens`);
    console.log(`  GET  /api/push/tokens/user/:userId`);
    console.log(`  GET  /api/push/tokens/stats`);
    console.log(`  DELETE /api/push/tokens/:tokenId`);
  });
}
