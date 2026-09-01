import { useEffect, useRef } from 'react';
import { getSocket } from '../services/socket';
import { useSceneStore } from '../store/useSceneStore';
import { useCollaborationStore } from '../store/useCollaborationStore';
import { SceneObject, Annotation, ChatMessage } from '../types';

export function useSocket(sceneId: string) {
  const isJoinedRef = useRef(false);
  const setSceneSnapshot = useSceneStore((s) => s.setSceneSnapshot);
  const addObject = useSceneStore((s) => s.addObject);
  const updateObject = useSceneStore((s) => s.updateObject);
  const updateObjectTransform = useSceneStore((s) => s.updateObjectTransform);
  const removeObject = useSceneStore((s) => s.removeObject);
  const addAnnotation = useSceneStore((s) => s.addAnnotation);
  const updateAnnotation = useSceneStore((s) => s.updateAnnotation);
  const removeAnnotation = useSceneStore((s) => s.removeAnnotation);

  const currentUser = useCollaborationStore((s) => s.currentUser);
  const setIsConnected = useCollaborationStore((s) => s.setIsConnected);
  const setUsers = useCollaborationStore((s) => s.setUsers);
  const addUser = useCollaborationStore((s) => s.addUser);
  const removeUser = useCollaborationStore((s) => s.removeUser);
  const updateUserCursor = useCollaborationStore((s) => s.updateUserCursor);
  const setRemoteTransform = useCollaborationStore((s) => s.setRemoteTransform);
  const clearRemoteTransform = useCollaborationStore((s) => s.clearRemoteTransform);
  const setRemoteLock = useCollaborationStore((s) => s.setRemoteLock);
  const clearRemoteLock = useCollaborationStore((s) => s.clearRemoteLock);
  const setChatMessages = useCollaborationStore((s) => s.setChatMessages);
  const addChatMessage = useCollaborationStore((s) => s.addChatMessage);

  useEffect(() => {
    const socket = getSocket();

    function onConnect() {
      setIsConnected(true);
      console.log('⚡ Connected to SpatialSync WebSocket Server');

      // Join room
      socket.emit('room:join', {
        sceneId,
        user: currentUser,
      });
      isJoinedRef.current = true;
    }

    function onDisconnect() {
      setIsConnected(false);
      isJoinedRef.current = false;
      console.log('🔌 Disconnected from WebSocket server');
    }

    function onRoomInit(payload: {
      scene: any;
      users: any[];
      chatHistory: ChatMessage[];
      yourUser: any;
    }) {
      setSceneSnapshot(payload.scene);
      setUsers(payload.users);
      setChatMessages(payload.chatHistory);
    }

    function onUserJoined(user: any) {
      addUser(user);
    }

    function onUserLeft(payload: { userId: string }) {
      removeUser(payload.userId);
    }

    function onCursorUpdate(payload: {
      userId: string;
      position: [number, number, number] | null;
      normal?: [number, number, number] | null;
    }) {
      updateUserCursor(payload.userId, payload.position, payload.normal);
    }

    function onObjectTransformed(payload: {
      objectId: string;
      transform: any;
      userId: string;
      userName?: string;
      userColor?: string;
      isContinuous: boolean;
    }) {
      if (payload.isContinuous) {
        setRemoteTransform(payload);
      } else {
        clearRemoteTransform(payload.objectId);
        updateObjectTransform(payload.objectId, payload.transform, false);
      }
    }

    function onObjectSelected(payload: {
      objectId: string | null;
      userId: string;
      userName?: string;
      userColor?: string;
    }) {
      if (payload.objectId) {
        setRemoteLock({
          objectId: payload.objectId,
          userId: payload.userId,
          userName: payload.userName,
          userColor: payload.userColor,
        });
      }
    }

    function onObjectDeselected(payload: { objectId: string; userId: string }) {
      clearRemoteLock(payload.objectId);
    }

    function onObjectCreated(payload: { object: SceneObject; userId: string }) {
      addObject(payload.object, true);
    }

    function onObjectUpdated(payload: {
      objectId: string;
      changes: Partial<SceneObject>;
      userId: string;
    }) {
      updateObject(payload.objectId, payload.changes, false);
    }

    function onObjectDeleted(payload: { objectId: string; userId: string }) {
      removeObject(payload.objectId);
      clearRemoteLock(payload.objectId);
      clearRemoteTransform(payload.objectId);
    }

    function onAnnotationCreated(payload: { annotation: Annotation; userId: string }) {
      addAnnotation(payload.annotation);
    }

    function onAnnotationUpdated(payload: {
      annotationId: string;
      changes: Partial<Annotation>;
      userId: string;
    }) {
      updateAnnotation(payload.annotationId, payload.changes);
    }

    function onAnnotationDeleted(payload: { annotationId: string; userId: string }) {
      removeAnnotation(payload.annotationId);
    }

    function onChatReceived(message: ChatMessage) {
      addChatMessage(message);
    }

    // Register listeners
    socket.on('connect', onConnect);
    socket.on('disconnect', onDisconnect);
    socket.on('room:init', onRoomInit);
    socket.on('user:joined', onUserJoined);
    socket.on('user:left', onUserLeft);
    socket.on('cursor:update', onCursorUpdate);
    socket.on('object:transformed', onObjectTransformed);
    socket.on('object:selected', onObjectSelected);
    socket.on('object:deselected', onObjectDeselected);
    socket.on('object:created', onObjectCreated);
    socket.on('object:updated', onObjectUpdated);
    socket.on('object:deleted', onObjectDeleted);
    socket.on('annotation:created', onAnnotationCreated);
    socket.on('annotation:updated', onAnnotationUpdated);
    socket.on('annotation:deleted', onAnnotationDeleted);
    socket.on('chat:received', onChatReceived);

    if (!socket.connected) {
      socket.connect();
    } else if (!isJoinedRef.current) {
      socket.emit('room:join', { sceneId, user: currentUser });
      isJoinedRef.current = true;
    }

    return () => {
      socket.off('connect', onConnect);
      socket.off('disconnect', onDisconnect);
      socket.off('room:init', onRoomInit);
      socket.off('user:joined', onUserJoined);
      socket.off('user:left', onUserLeft);
      socket.off('cursor:update', onCursorUpdate);
      socket.off('object:transformed', onObjectTransformed);
      socket.off('object:selected', onObjectSelected);
      socket.off('object:deselected', onObjectDeselected);
      socket.off('object:created', onObjectCreated);
      socket.off('object:updated', onObjectUpdated);
      socket.off('object:deleted', onObjectDeleted);
      socket.off('annotation:created', onAnnotationCreated);
      socket.off('annotation:updated', onAnnotationUpdated);
      socket.off('annotation:deleted', onAnnotationDeleted);
      socket.off('chat:received', onChatReceived);
    };
  }, [sceneId, currentUser.id]);
}
