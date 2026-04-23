import { create } from 'zustand';
import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

const useConfigStore = create((set) => ({
  config: {},
  loading: false,
  error: null,

  fetchConfig: async () => {
    set({ loading: true });
    try {
      const response = await axios.get(`${API_URL}/config`);
      set({ config: response.data.data, loading: false });
    } catch (error) {
      set({ error: error.message, loading: false });
    }
  },

  updateConfig: async (key, value) => {
    try {
      await axios.post(`${API_URL}/config`, { key, value });
      set((state) => ({
        config: { ...state.config, [key]: value }
      }));
    } catch (error) {
      set({ error: error.message });
    }
  }
}));

export default useConfigStore;
