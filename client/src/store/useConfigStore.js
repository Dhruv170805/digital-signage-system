import { create } from 'zustand';
import api from '../services/api';

const useConfigStore = create((set) => ({
  config: {},
  loading: false,
  error: null,

  fetchConfig: async () => {
    set({ loading: true });
    try {
      const response = await api.get('/settings');
      set({ config: response.data.data, loading: false });
    } catch (error) {
      set({ error: error.message, loading: false });
    }
  },

  updateConfig: async (key, value) => {
    try {
      await api.post('/settings', { key, value });
      set((state) => ({
        config: { ...state.config, [key]: value }
      }));
    } catch (error) {
      set({ error: error.message });
    }
  }
}));

export default useConfigStore;
