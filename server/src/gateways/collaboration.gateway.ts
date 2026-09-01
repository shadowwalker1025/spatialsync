import { Server, Socket } from 'socket.io';
import { v4 as uuidv4 } from 'uuid';
import { sceneService } from '../services/scene.service';
import { redisService } from '../services/redis.service';

interface UserSession {
  id: string;
  socketId: string;
  sceneId: string;
  name: string;
  color: string;
  avatar?: string;
  cursor3D: [number, number, number] | null;
  cursorNormal?: [number, number, number] | null;
  selectedObjectId: string | null;
  activeGizmoMode: 'translate' | 'rotate' | 'scale' | null;
  lastActive: number;
}

export class CollaborationGateway {
  private io: Server;
  // In-memory mapping of active rooms -> user ID -> UserSession
  private roomUsers = new Map<string, Map<string, UserSession>>();
  private socketToUser = new Map<string, { userId: string; sceneId: string }>();
  private roomChatHistory = new Map<string, any[]>();

  constructor(io: Server) {
    this.io = io;
    this.setupSocketEvents();
    this.setupRedisSubscriptions();
  }

  private setupRedisSubscriptions() {
    redisService.subscribe('spatial:scene:update', (message) => {
      try {
        const { sceneId, event, payload } = JSON.parse(message);
        this.io.to(`room:${sceneId}`).emit(event, payload);
      } catch (err) {
        console.error('Error processing Redis pub/sub message:', err);
      }
    });
  }

  private setupSocketEvents() {
    this.io.on('connection', (socket: Socket) => {
      console.log(`🔌 Client connected: ${socket.id}`);

      // 1. Join Room
      socket.on('room:join', async (payload: { sceneId: string; user: { id: string; name: string; color: string; avatar?: string } }) => {
        try {
          const { sceneId, user } = payload;
          socket.join(`room:${sceneId}`);

          if (!this.roomUsers.has(sceneId)) {
            this.roomUsers.set(sceneId, new Map());
          }
          if (!this.roomChatHistory.has(sceneId)) {
            this.roomChatHistory.set(sceneId, []);
          }

          const userSession: UserSession = {
            id: user.id,
            socketId: socket.id,
            sceneId,
            name: user.name || `Architect #${user.id.substring(0, 4)}`,
            color: user.color || '#3b82f6',
            avatar: user.avatar,
            cursor3D: null,
            selectedObjectId: null,
            activeGizmoMode: null,
            lastActive: Date.now(),
          };

          this.roomUsers.get(sceneId)!.set(user.id, userSession);
          this.socketToUser.set(socket.id, { userId: user.id, sceneId });

          // Fetch fresh scene snapshot
          const snapshot = await sceneService.getSceneSnapshot(sceneId);

          const activeUsers = Array.from(this.roomUsers.get(sceneId)!.values());
          const chatHistory = this.roomChatHistory.get(sceneId) || [];

          // Emit initial state to joining user
          socket.emit('room:init', {
            scene: snapshot,
            users: activeUsers,
            chatHistory,
            yourUser: userSession,
          });

          // Notify other participants
          socket.to(`room:${sceneId}`).emit('user:joined', userSession);

          // Broadcast system message
          const sysMsg = {
            id: uuidv4(),
            sceneId,
            senderId: 'system',
            senderName: 'System',
            senderColor: '#64748b',
            text: `${userSession.name} joined the collaboration session.`,
            timestamp: new Date().toISOString(),
            type: 'system',
          };
          this.addChatMessage(sceneId, sysMsg);
          this.io.to(`room:${sceneId}`).emit('chat:received', sysMsg);

          console.log(`👤 User "${userSession.name}" (${user.id}) joined room: ${sceneId}`);
        } catch (error: any) {
          console.error('Error handling room:join:', error);
          socket.emit('error', { message: 'Failed to join scene room', details: error.message });
        }
      });

      // 2. High-Frequency 3D Cursor Movement
      socket.on('cursor:move', (payload: { sceneId: string; position: [number, number, number] | null; normal?: [number, number, number] | null }) => {
        const userMeta = this.socketToUser.get(socket.id);
        if (!userMeta) return;

        const { sceneId, userId } = userMeta;
        const room = this.roomUsers.get(sceneId);
        if (room && room.has(userId)) {
          const user = room.get(userId)!;
          user.cursor3D = payload.position;
          user.cursorNormal = payload.normal;
          user.lastActive = Date.now();
        }

        // Volatile broadcast to prevent lag buffer buildup
        socket.volatile.to(`room:${sceneId}`).emit('cursor:update', {
          userId,
          position: payload.position,
          normal: payload.normal,
        });
      });

      // 3. Continuous 3D Object Transformation (Dragging Gizmo)
      socket.on('object:transform', (payload: { sceneId: string; objectId: string; transform: any; isContinuous: boolean }) => {
        const userMeta = this.socketToUser.get(socket.id);
        if (!userMeta) return;

        const { sceneId, userId } = userMeta;
        const room = this.roomUsers.get(sceneId);
        const user = room?.get(userId);

        // Broadcast transform delta to peers immediately
        socket.to(`room:${sceneId}`).emit('object:transformed', {
          objectId: payload.objectId,
          transform: payload.transform,
          userId,
          userName: user?.name,
          userColor: user?.color,
          isContinuous: payload.isContinuous,
        });
      });

      // 4. Object Transform Finished (Persist to database)
      socket.on('object:transform-end', async (payload: { sceneId: string; objectId: string; transform: any }) => {
        const userMeta = this.socketToUser.get(socket.id);
        if (!userMeta) return;

        const { sceneId, userId } = userMeta;
        try {
          await sceneService.upsertObject(sceneId, {
            id: payload.objectId,
            transform: payload.transform,
            lastModifiedBy: userId,
          });

          // Confirm final state across room
          this.io.to(`room:${sceneId}`).emit('object:transformed', {
            objectId: payload.objectId,
            transform: payload.transform,
            userId,
            isContinuous: false,
          });
        } catch (err) {
          console.error('Error persisting object transform:', err);
        }
      });

      // 5. Object Selection & Lock Acquisition
      socket.on('object:select', (payload: { sceneId: string; objectId: string | null; gizmoMode?: any }) => {
        const userMeta = this.socketToUser.get(socket.id);
        if (!userMeta) return;

        const { sceneId, userId } = userMeta;
        const room = this.roomUsers.get(sceneId);
        const user = room?.get(userId);
        if (user) {
          user.selectedObjectId = payload.objectId;
          user.activeGizmoMode = payload.gizmoMode || 'translate';
        }

        socket.to(`room:${sceneId}`).emit('object:selected', {
          objectId: payload.objectId,
          userId,
          userName: user?.name,
          userColor: user?.color,
        });
      });

      // 6. Object Deselection / Unlock
      socket.on('object:deselect', (payload: { sceneId: string; objectId: string }) => {
        const userMeta = this.socketToUser.get(socket.id);
        if (!userMeta) return;

        const { sceneId, userId } = userMeta;
        const room = this.roomUsers.get(sceneId);
        const user = room?.get(userId);
        if (user && user.selectedObjectId === payload.objectId) {
          user.selectedObjectId = null;
        }

        socket.to(`room:${sceneId}`).emit('object:deselected', {
          objectId: payload.objectId,
          userId,
        });
      });

      // 7. Object Creation
      socket.on('object:create', async (payload: { sceneId: string; object: any }) => {
        const userMeta = this.socketToUser.get(socket.id);
        if (!userMeta) return;

        const { sceneId, userId } = userMeta;
        try {
          const created = await sceneService.upsertObject(sceneId, {
            ...payload.object,
            lastModifiedBy: userId,
          });

          const parsed = {
            ...created,
            transform: JSON.parse(created.transform),
            materialProps: JSON.parse(created.materialProps),
            geometryData: JSON.parse(created.geometryData || '{}'),
            createdAt: created.createdAt.toISOString(),
            updatedAt: created.updatedAt.toISOString(),
          };

          this.io.to(`room:${sceneId}`).emit('object:created', {
            object: parsed,
            userId,
          });
        } catch (error) {
          console.error('Error creating object:', error);
        }
      });

      // 8. Object Property Updates (Material, Color, Visibility, Name)
      socket.on('object:update', async (payload: { sceneId: string; objectId: string; changes: any }) => {
        const userMeta = this.socketToUser.get(socket.id);
        if (!userMeta) return;

        const { sceneId, userId } = userMeta;
        try {
          await sceneService.upsertObject(sceneId, {
            id: payload.objectId,
            ...payload.changes,
            lastModifiedBy: userId,
          });

          this.io.to(`room:${sceneId}`).emit('object:updated', {
            objectId: payload.objectId,
            changes: payload.changes,
            userId,
          });
        } catch (error) {
          console.error('Error updating object:', error);
        }
      });

      // 9. Object Deletion
      socket.on('object:delete', async (payload: { sceneId: string; objectId: string }) => {
        const userMeta = this.socketToUser.get(socket.id);
        if (!userMeta) return;

        const { sceneId, userId } = userMeta;
        try {
          await sceneService.deleteObject(payload.objectId);

          this.io.to(`room:${sceneId}`).emit('object:deleted', {
            objectId: payload.objectId,
            userId,
          });
        } catch (error) {
          console.error('Error deleting object:', error);
        }
      });

      // 10. 3D Anchored Annotations
      socket.on('annotation:create', async (payload: { sceneId: string; annotation: any }) => {
        const userMeta = this.socketToUser.get(socket.id);
        if (!userMeta) return;

        const { sceneId, userId } = userMeta;
        try {
          const ann = await sceneService.upsertAnnotation(sceneId, payload.annotation);
          const parsed = {
            ...ann,
            position: JSON.parse(ann.position),
            normal: ann.normal ? JSON.parse(ann.normal) : undefined,
            createdAt: ann.createdAt.toISOString(),
            updatedAt: ann.updatedAt.toISOString(),
          };

          this.io.to(`room:${sceneId}`).emit('annotation:created', {
            annotation: parsed,
            userId,
          });
        } catch (error) {
          console.error('Error creating annotation:', error);
        }
      });

      socket.on('annotation:update', async (payload: { sceneId: string; annotationId: string; changes: any }) => {
        const userMeta = this.socketToUser.get(socket.id);
        if (!userMeta) return;

        const { sceneId, userId } = userMeta;
        try {
          await sceneService.upsertAnnotation(sceneId, {
            id: payload.annotationId,
            ...payload.changes,
          });

          this.io.to(`room:${sceneId}`).emit('annotation:updated', {
            annotationId: payload.annotationId,
            changes: payload.changes,
            userId,
          });
        } catch (error) {
          console.error('Error updating annotation:', error);
        }
      });

      socket.on('annotation:delete', async (payload: { sceneId: string; annotationId: string }) => {
        const userMeta = this.socketToUser.get(socket.id);
        if (!userMeta) return;

        const { sceneId, userId } = userMeta;
        try {
          await sceneService.deleteAnnotation(payload.annotationId);

          this.io.to(`room:${sceneId}`).emit('annotation:deleted', {
            annotationId: payload.annotationId,
            userId,
          });
        } catch (error) {
          console.error('Error deleting annotation:', error);
        }
      });

      // 11. Chat Messaging
      socket.on('chat:send', (payload: { sceneId: string; text: string }) => {
        const userMeta = this.socketToUser.get(socket.id);
        if (!userMeta) return;

        const { sceneId, userId } = userMeta;
        const room = this.roomUsers.get(sceneId);
        const user = room?.get(userId);

        const chatMessage = {
          id: uuidv4(),
          sceneId,
          senderId: userId,
          senderName: user?.name || 'Anonymous',
          senderColor: user?.color || '#3b82f6',
          text: payload.text,
          timestamp: new Date().toISOString(),
          type: 'chat' as const,
        };

        this.addChatMessage(sceneId, chatMessage);
        this.io.to(`room:${sceneId}`).emit('chat:received', chatMessage);
      });

      // 12. Disconnect & Cleanup
      socket.on('disconnect', () => {
        this.handleDisconnect(socket);
      });
    });
  }

  private addChatMessage(sceneId: string, message: any) {
    if (!this.roomChatHistory.has(sceneId)) {
      this.roomChatHistory.set(sceneId, []);
    }
    const history = this.roomChatHistory.get(sceneId)!;
    history.push(message);
    if (history.length > 100) {
      history.shift();
    }
  }

  private handleDisconnect(socket: Socket) {
    const userMeta = this.socketToUser.get(socket.id);
    if (!userMeta) return;

    const { sceneId, userId } = userMeta;
    this.socketToUser.delete(socket.id);

    const room = this.roomUsers.get(sceneId);
    if (room && room.has(userId)) {
      const user = room.get(userId)!;
      room.delete(userId);

      // Release any locks held by this user
      if (user.selectedObjectId) {
        this.io.to(`room:${sceneId}`).emit('object:deselected', {
          objectId: user.selectedObjectId,
          userId,
        });
      }

      // Notify other room users
      socket.to(`room:${sceneId}`).emit('user:left', { userId });

      // System notification
      const sysMsg = {
        id: uuidv4(),
        sceneId,
        senderId: 'system',
        senderName: 'System',
        senderColor: '#64748b',
        text: `${user.name} left the room.`,
        timestamp: new Date().toISOString(),
        type: 'system' as const,
      };
      this.addChatMessage(sceneId, sysMsg);
      this.io.to(`room:${sceneId}`).emit('chat:received', sysMsg);

      console.log(`👋 User "${user.name}" disconnected from room: ${sceneId}`);
    }
  }
}
