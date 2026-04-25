import { create } from 'zustand';

const useInterruptStore = create((set) => ({
  activeInterrupt: null, // The high-priority payload
  
  // Hard override: immediately show content
  triggerInterrupt: (payload) => set({ activeInterrupt: payload }),
  
  // Clear and return to regular programming
  clearInterrupt: () => set({ activeInterrupt: null })
}));

export default useInterruptStore;
