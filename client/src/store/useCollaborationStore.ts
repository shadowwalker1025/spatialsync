import { create } from 'zustand';
import { UserPresence, ChatMessage, TransformData } from '../types';
import { getRandomColor, getRandomName } from '../utils/colors';
import { v4 as uuidv4 } from 'uuid';

interface RemoteTransform {
  objectId: string;
  transform: TransformData;
  userId: string;
  userName?: string;
  userColor?: string;
  isContinuous: boolean;
}

interface RemoteLock {
  objectId: string;
  userId: string;
  userName?: string;
  userColor?: string;
}

interface CollaborationStore {
  currentUser: {
    id: string;
    name: string;
    color: string;
    avatar?: string;
  };
  isConnected: boolean;
  activeRoomId: string;
  users: UserPresence[];
  remoteTransforms: Record<string, RemoteTransform>;
  remoteLocks: Record<string, RemoteLock>;
  chatMessages: ChatMessage[];
  unreadChatCount: number;

  // Actions
  setCurrentUser: (user: Partial<{ id: string; name: string; color: string; avatar?: string }>) => void;
  setIsConnected: (connected: boolean) => void;
  setActiveRoomId: (roomId: string) => void;
  setUsers: (users: UserPresence[]) => void;
  addUser: (user: UserPresence) => void;
  removeUser: (userId: string) => void;
  updateUserCursor: (userId: string, position: [number, number, number] | null, normal?: [number, number, number] | null) => void;
  
  // Real-time remote sync
  setRemoteTransform: (payload: RemoteTransform) => void;
  clearRemoteTransform: (objectId: string) => void;
  setRemoteLock: (payload: RemoteLock) => void;
  clearRemoteLock: (objectId: string) => void;
  
  // Chat
  setChatMessages: (messages: ChatMessage[]) => void;
  addChatMessage: (message: ChatMessage) => void;
  resetUnreadChat: () => void;
}

// Initial identity persisted in localStorage if available
const savedId = localStorage.getItem('spatialsync_user_id') || uuidv4();
const savedName = localStorage.getItem('spatialsync_user_name') || getRandomName();
const savedColor = localStorage.getItem('spatialsync_user_color') || getRandomColor();

localStorage.setItem('spatialsync_user_id', savedId);
localStorage.setItem('spatialsync_user_name', savedName);
localStorage.setItem('spatialsync_user_color', savedColor);

export const useCollaborationStore = create<CollaborationStore>((set) => ({
  currentUser: {
    id: savedId,
    name: savedName,
    color: savedColor,
  },
  isConnected: false,
  activeRoomId: 'main-studio',
  users: [],
  remoteTransforms: {},
  remoteLocks: {},
  chatMessages: [],
  unreadChatCount: 0,

  setCurrentUser: (user) => {
    set((state) => {
      const updated = { ...state.currentUser, ...user };
      if (user.name) localStorage.setItem('spatialsync_user_name', user.name);
      if (user.color) localStorage.setItem('spatialsync_user_color', user.color);
      return { currentUser: updated };
    });
  },

  setIsConnected: (isConnected) => set({ isConnected }),
  
  setActiveRoomId: (activeRoomId) => set({ activeRoomId }),

  setUsers: (users) => set({ users }),

  addUser: (user) => {
    set((state) => ({
      users: [...state.users.filter((u) => u.id !== user.id), user],
    }));
  },

  removeUser: (userId) => {
    set((state) => {
      const newLocks = { ...state.remoteLocks };
      Object.keys(newLocks).forEach((objId) => {
        if (newLocks[objId].userId === userId) {
          delete newLocks[objId];
        }
      });

      return {
        users: state.users.filter((u) => u.id !== userId),
        remoteLocks: newLocks,
      };
    });
  },

  updateUserCursor: (userId, position, normal) => {
    set((state) => ({
      users: state.users.map((u) =>
        u.id === userId
          ? { ...u, cursor3D: position, cursorNormal: normal ?? null, lastActive: Date.now() }
          : u
      ),
    }));
  },

  setRemoteTransform: (payload) => {
    set((state) => ({
      remoteTransforms: {
        ...state.remoteTransforms,
        [payload.objectId]: payload,
      },
    }));
  },

  clearRemoteTransform: (objectId) => {
    set((state) => {
      const newTransforms = { ...state.remoteTransforms };
      delete newTransforms[objectId];
      return { remoteTransforms: newTransforms };
    });
  },

  setRemoteLock: (payload) => {
    set((state) => ({
      remoteLocks: {
        ...state.remoteLocks,
        [payload.objectId]: payload,
      },
    }));
  },

  clearRemoteLock: (objectId) => {
    set((state) => {
      const newLocks = { ...state.remoteLocks };
      delete newLocks[objectId];
      return { remoteLocks: newLocks };
    });
  },

  setChatMessages: (messages) => set({ chatMessages: messages }),

  addChatMessage: (message) => {
    set((state) => ({
      chatMessages: [...state.chatMessages, message],
      unreadChatCount: state.unreadChatCount + 1,
    }));
  },

  resetUnreadChat: () => set({ unreadChatCount: 0 }),
}));
