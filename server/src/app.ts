import express, { Request, Response, NextFunction } from 'express';
import cors from 'cors';
import path from 'path';
import { ENV } from './config/env';
import { sceneController } from './controllers/scene.controller';
import { assetController } from './controllers/asset.controller';

const app = express();

// Middlewares
app.use(cors({
  origin: '*',
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
}));

app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// Static uploads serving for 3D glTF/GLB models and textures
app.use('/uploads', express.static(ENV.UPLOAD_DIR));

// Health check
app.get('/api/health', (_req: Request, res: Response) => {
  res.json({
    status: 'healthy',
    service: 'SpatialSync Backend',
    timestamp: new Date().toISOString(),
  });
});

// REST routes
app.use('/api/scenes', sceneController);
app.use('/api/assets', assetController);

// Global error handler
app.use((err: any, _req: Request, res: Response, _next: NextFunction) => {
  console.error('Server error:', err);
  res.status(err.status || 500).json({
    success: false,
    error: err.message || 'Internal Server Error',
  });
});

export { app };
