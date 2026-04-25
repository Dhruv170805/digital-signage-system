import { create } from 'zustand';
import { io } from 'socket.io-client';
import useAuthStore from './useAuthStore';

const SOCKET_URL = import.meta.env.VITE_SOCKET_URL || 'http://localhost:5000';

const useSocketStore = create((set, get) => ({
  socket: null,
  connected: false,

  connect: (deviceToken = null) => {
    if (get().socket) return;

    const token = useAuthStore.getState().token;
    // deviceToken can be passed or retrieved from localStorage if it's a screen
    const effectiveDeviceToken = deviceToken || localStorage.getItem('deviceToken');

    const socket = io(SOCKET_URL, {
      auth: {
        token,
        deviceToken: effectiveDeviceToken
      }
    });

    socket.on('connect', () => {
      set({ connected: true });
      if (effectiveDeviceToken) {
        socket.emit('heartbeat', { 
          telemetry: {
            uptime: window.performance ? window.performance.now() : 0,
            memory: navigator.deviceMemory || 0,
            connection: navigator.connection ? navigator.connection.effectiveType : 'unknown'
          }
        });
      }
    });

    socket.on('disconnect', () => {
      set({ connected: false });
    });

    socket.on('sync_config', (data) => {
      console.log('Config sync event received:', data);
    });

    socket.on('manifestUpdate', (data) => {
        console.log('Manifest update received:', data);
    });

    socket.on('emergency_override', (data) => {
      console.log('Emergency override received:', data);
      const { triggerInterrupt } = useInterruptStore.getState();
      triggerInterrupt(data);
    });

    set({ socket });
  },

  disconnect: () => {
    const { socket } = get();
    if (socket) {
      socket.disconnect();
      set({ socket: null, connected: false });
    }
  }
}));

export default useSocketStore;
