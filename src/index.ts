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

// Start server
app.listen(PORT, () => {
  console.log(`🚀 Push Notification API server running on port ${PORT}`);
  console.log(`📱 Supported platforms: Web, Android`);
  console.log(`\nAvailable endpoints:`);
  console.log(`  GET  /health`);
  console.log(`  GET  /api/push/status`);
  console.log(`  GET  /api/push/web/public-key`);
  console.log(`  POST /api/push/send`);
});
