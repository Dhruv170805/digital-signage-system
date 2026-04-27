import { create } from 'zustand';
import { io } from 'socket.io-client';
import useAuthStore from './useAuthStore';
import useInterruptStore from './useInterruptStore';

const SOCKET_URL = import.meta.env.VITE_SOCKET_URL || import.meta.env.VITE_API_URL;

if (!SOCKET_URL) {
  console.error('📡 SYSTEM CRITICAL: VITE_SOCKET_URL or VITE_API_URL is missing. Real-time synchronization is disabled.');
}

let instance = null; // Module-level singleton instance

const useSocketStore = create((set, get) => ({
  socket: null,
  connected: false,

  connect: (deviceToken = null) => {
    // 1. Singleton Check: If we already have a live or connecting instance, stop.
    // This is the "God-Level" fix for React DEV mode double-invocation.
    const currentReadyState = instance?.io?.engine?.readyState || instance?.io?.readyState;
    if (instance && (instance.connected || currentReadyState === 'opening' || currentReadyState === 'open')) {
      if (!get().socket) set({ socket: instance });
      return;
    }

    const token = useAuthStore.getState().token;
    const effectiveDeviceToken = deviceToken || localStorage.getItem('deviceToken');

    // 2. Clean up ONLY if we are starting a fresh connection and the old one is truly dead
    if (instance) {
      instance.removeAllListeners();
      instance.disconnect();
      instance = null;
    }

    console.log('🔗 Connecting to Signal Server:', SOCKET_URL);

    instance = io(SOCKET_URL, {
      auth: {
        token,
        deviceToken: effectiveDeviceToken
      },
      transports: ['polling', 'websocket'],
      reconnection: true,
      reconnectionDelay: 1000,
      reconnectionAttempts: 10,
      timeout: 20000
    });

    instance.on('connect', () => {
      console.log('🌐 Connected to Signal Server! Socket ID:', instance.id);
      set({ connected: true, socket: instance });
    });

    instance.on('connect_error', (err) => {
      if (err.message !== 'xhr poll error' && err.message !== 'websocket error') {
        console.error('❌ Signal Server connection error:', err.message);
      }
      set({ connected: false });
    });

    instance.on('manifestUpdate', (data) => {
        console.log('Manifest update received:', data);
    });

    instance.on('emergency_override', (data) => {
      const { triggerInterrupt } = useInterruptStore.getState();
      triggerInterrupt(data);
    });

    set({ socket: instance });
  },

  disconnect: () => {
    if (instance) {
      instance.removeAllListeners();
      if (instance.connected) {
        instance.disconnect();
      }
      instance = null;
      set({ socket: null, connected: false });
    }
  }
}));

export default useSocketStore;
