import { create } from 'zustand';

const useLayoutStore = create((set) => ({
  blockedZones: [], // Array of { x, y, w, h } in percentage
  topBarPosition: 'top', // 'top' or 'hidden' or 'bottom' (if top is blocked)
  tickerPosition: 'bottom', // 'bottom' or 'hidden' or 'top' (if bottom is blocked)

  setBlockedZones: (zones) => {
    // 🧠 DECISION ENGINE: Reposition overlays based on text density
    const topZone = { x: 0, y: 0, w: 100, h: 15 };
    const bottomZone = { x: 0, y: 85, w: 100, h: 15 };

    const isOverlap = (o, z) => !(o.x + o.w < z.x || o.x > z.x + z.w || o.y + o.h < z.y || o.y > z.y + z.h);

    const topBlocked = zones.some(z => isOverlap(topZone, z));
    const bottomBlocked = zones.some(z => isOverlap(bottomZone, z));

    set({ 
      blockedZones: zones,
      topBarPosition: topBlocked ? (bottomBlocked ? 'hidden' : 'top-dim') : 'top',
      tickerPosition: bottomBlocked ? (topBlocked ? 'hidden' : 'bottom-dim') : 'bottom'
    });
  },

  resetLayout: () => set({ blockedZones: [], topBarPosition: 'top', tickerPosition: 'bottom' })
}));

export default useLayoutStore;
