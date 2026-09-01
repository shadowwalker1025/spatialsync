import http from 'http';
import { Server as SocketIOServer } from 'socket.io';
import { app } from './app';
import { ENV } from './config/env';
import { connectPrisma } from './models/prisma';
import { CollaborationGateway } from './gateways/collaboration.gateway';

async function bootstrap() {
  // Connect database
  await connectPrisma();

  const server = http.createServer(app);

  const io = new SocketIOServer(server, {
    cors: {
      origin: '*',
      methods: ['GET', 'POST'],
    },
    transports: ['websocket', 'polling'],
    pingInterval: 10000,
    pingTimeout: 5000,
  });

  // Initialize Real-time Spatial Collaboration Gateway
  new CollaborationGateway(io);

  server.listen(ENV.PORT, () => {
    console.log('====================================================');
    console.log(`🚀 SpatialSync Backend Server listening on port ${ENV.PORT}`);
    console.log(`📡 WebSocket Gateway ready for multi-user 3D sync`);
    console.log(`📂 Static Assets directory: ${ENV.UPLOAD_DIR}`);
    console.log(`🌐 Health check: http://localhost:${ENV.PORT}/api/health`);
    console.log('====================================================');
  });
}

bootstrap().catch((err) => {
  console.error('Fatal bootstrapping error:', err);
  process.exit(1);
});
