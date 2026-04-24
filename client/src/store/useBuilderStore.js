import { create } from 'zustand';

const useBuilderStore = create((set) => ({
  templateName: '',
  frames: [], // [{ i, x, y, w, h, type, zIndex }]
  selectedFrameId: null,

  setTemplateName: (name) => set({ templateName: name }),
  
  setFrames: (frames) => set({ frames }),

  addFrame: () => set((state) => {
    const id = `Frame-${Date.now()}`;
    return {
      frames: [
        ...state.frames,
        {
          i: id,
          x: 10,
          y: 10,
          w: 30,
          h: 20,
          zIndex: state.frames.length + 1,
          type: 'media'
        }
      ],
      selectedFrameId: id
    };
  }),

  updateFrame: (id, updates) => set((state) => ({
    frames: state.frames.map(f => f.i === id ? { ...f, ...updates } : f)
  })),

  removeFrame: (id) => set((state) => ({
    frames: state.frames.filter(f => f.i !== id),
    selectedFrameId: state.selectedFrameId === id ? null : state.selectedFrameId
  })),

  selectFrame: (id) => set({ selectedFrameId: id }),

  resetBuilder: () => set({ frames: [], templateName: '', selectedFrameId: null })
}));

export default useBuilderStore;
