import { create } from 'zustand';

const useBuilderStore = create((set) => ({
  templateName: 'New Template',
  frames: [],
  selectedFrameId: null,

  setTemplateName: (name) => set({ templateName: name }),

  addFrame: () => set((state) => ({
    frames: [
      ...state.frames,
      {
        id: Date.now(),
        name: `Frame ${state.frames.length + 1}`,
        coordinateX: 10,
        coordinateY: 10,
        width: 30,
        height: 20,
        zIndex: 1,
        allowedTypes: 'image,video'
      }
    ]
  })),

  updateFrame: (id, updates) => set((state) => ({
    frames: state.frames.map(f => f.id === id ? { ...f, ...updates } : f)
  })),

  removeFrame: (id) => set((state) => ({
    frames: state.frames.filter(f => f.id !== id),
    selectedFrameId: state.selectedFrameId === id ? null : state.selectedFrameId
  })),

  selectFrame: (id) => set({ selectedFrameId: id }),

  resetBuilder: () => set({ frames: [], templateName: 'New Template', selectedFrameId: null })
}));

export default useBuilderStore;
