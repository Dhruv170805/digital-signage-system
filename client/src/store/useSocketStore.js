import { create } from 'zustand';
import { io } from 'socket.io-client';

const SOCKET_URL = import.meta.env.VITE_SOCKET_URL || 'http://localhost:5000';

const useSocketStore = create((set, get) => ({
  socket: null,
  connected: false,

  connect: (macAddress, screenId) => {
    if (get().socket) return;

    const socket = io(SOCKET_URL);

    socket.on('connect', () => {
      set({ connected: true });
      socket.emit('heartbeat', { macAddress, screenId });
    });

    socket.on('disconnect', () => {
      set({ connected: false });
    });

    socket.on('sync_config', (data) => {
      // Handle config sync (can trigger useConfigStore.fetchConfig())
      console.log('Config sync event received:', data);
    });

    socket.on('emergency_override', (data) => {
      console.log('Emergency override received:', data);
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
