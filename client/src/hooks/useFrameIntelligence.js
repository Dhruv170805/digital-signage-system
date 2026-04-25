import { useState, useEffect, useRef } from 'react';

/**
 * 🧠 HEATMAP INTELLIGENCE ENGINE
 * Analyzes canvas content (pixels) to find low-attention "safe zones" for UI overlays.
 */

// 1. Generate an Edge-Density Heatmap from a Canvas
function generateEdgeHeatmap(canvas, gridX = 20, gridY = 20) {
  if (!canvas) return null;
  const ctx = canvas.getContext('2d', { willReadFrequently: true });
  if (!ctx) return null;

  const { width, height } = canvas;
  let imgData;
  try {
    imgData = ctx.getImageData(0, 0, width, height).data;
  } catch (e) {
    console.warn('[Heatmap] Canvas tainted by CORS, cannot read pixels.');
    return null; // CORS issue with external images/videos
  }

  const cellW = Math.floor(width / gridX);
  const cellH = Math.floor(height / gridY);
  const grid = Array.from({ length: gridY }, () => Array(gridX).fill(0));

  for (let y = 0; y < gridY; y++) {
    for (let x = 0; x < gridX; x++) {
      let score = 0;
      // Sample pixels in the cell
      for (let j = 0; j < cellH; j += 4) { // Step by 4 for performance
        for (let i = 0; i < cellW; i += 4) {
          const pxX = x * cellW + i;
          const pxY = y * cellH + j;
          if (pxX >= width || pxY >= height) continue;

          const px = (pxY * width + pxX) * 4;
          const r = imgData[px], g = imgData[px + 1], b = imgData[px + 2];
          
          // Compare with neighbor to find edges (high contrast)
          const nx = (pxY * width + Math.min(pxX + 4, width - 1)) * 4;
          const nr = imgData[nx], ng = imgData[nx + 1], nb = imgData[nx + 2];
          
          score += Math.abs(r - nr) + Math.abs(g - ng) + Math.abs(b - nb);
        }
      }
      grid[y][x] = score;
    }
  }
  return grid;
}

// 2. Apply OCR/Text Bounding Boxes to boost importance
function applyTextRegions(grid, regions, canvasWidth, canvasHeight) {
  if (!grid || !regions || regions.length === 0) return grid;
  const gy = grid.length;
  const gx = grid[0].length;

  regions.forEach(r => {
    // r is in percentage (0-100)
    const x0 = Math.floor((r.x / 100) * gx);
    const y0 = Math.floor((r.y / 100) * gy);
    const x1 = Math.ceil(((r.x + r.w) / 100) * gx);
    const y1 = Math.ceil(((r.y + r.h) / 100) * gy);

    for (let y = Math.max(0, y0); y < Math.min(gy, y1); y++) {
      for (let x = Math.max(0, x0); x < Math.min(gx, x1); x++) {
        if (grid[y] && grid[y][x] !== undefined) {
          grid[y][x] += 10000; // Massive boost for text regions
        }
      }
    }
  });
  return grid;
}

// 3. Normalize the grid (0 to 1)
function normalizeHeatmap(grid) {
  if (!grid) return null;
  let max = 0;
  for (let y = 0; y < grid.length; y++) {
    for (let x = 0; x < grid[y].length; x++) {
      if (grid[y][x] > max) max = grid[y][x];
    }
  }
  max = max || 1;
  return grid.map(row => row.map(v => v / max));
}

// 4. Find the best (coolest) zone for a given required size
function findSafeZone(normGrid, reqW, reqH, bias = 'none') {
  if (!normGrid) return { x: 0, y: 0, score: 0 };
  const gy = normGrid.length;
  const gx = normGrid[0].length;
  let best = { score: Infinity, x: 0, y: 0 };

  for (let y = 0; y <= gy - reqH; y++) {
    // Apply bias (e.g., prefer bottom)
    let biasPenalty = 0;
    if (bias === 'bottom') biasPenalty = ((gy - y) / gy) * 0.2; // slight penalty for being higher up
    if (bias === 'top') biasPenalty = (y / gy) * 0.2;

    for (let x = 0; x <= gx - reqW; x++) {
      let sum = 0;
      for (let j = 0; j < reqH; j++) {
        for (let i = 0; i < reqW; i++) {
          sum += normGrid[y + j][x + i];
        }
      }
      const avg = (sum / (reqW * reqH)) + biasPenalty;
      if (avg < best.score) {
        best = { score: avg, x, y };
      }
    }
  }
  return best;
}

/**
 * React Hook for Per-Frame Intelligence
 * @param {HTMLElement} elementRef - Ref to the image/video/canvas
 * @param {Object} options - { type: 'pdf'|'video'|'image', textRegions: [], overlayType: 'ticker'|'badge' }
 */
export function useFrameIntelligence(elementRef, options = {}) {
  const [safeStyle, setSafeStyle] = useState(null);
  const cacheRef = useRef(new Map());

  useEffect(() => {
    if (!elementRef.current) return;

    const analyze = async () => {
      let canvas = elementRef.current;
      
      // If it's an image or video, we need to draw it to a temporary canvas to read pixels
      if (canvas.tagName !== 'CANVAS') {
        const tempCanvas = document.createElement('canvas');
        tempCanvas.width = canvas.videoWidth || canvas.naturalWidth || canvas.clientWidth || 1920;
        tempCanvas.height = canvas.videoHeight || canvas.naturalHeight || canvas.clientHeight || 1080;
        const ctx = tempCanvas.getContext('2d');
        if (ctx && tempCanvas.width > 0 && tempCanvas.height > 0) {
           try {
               ctx.drawImage(canvas, 0, 0, tempCanvas.width, tempCanvas.height);
               canvas = tempCanvas;
           } catch(e) {
               // CORS or empty
               return;
           }
        } else {
            return;
        }
      }

      // Cache key based on source to avoid re-running on identical frames
      const cacheKey = options.id || 'unknown';
      if (cacheRef.current.has(cacheKey)) {
        setSafeStyle(cacheRef.current.get(cacheKey));
        return;
      }

      // 1. Generate Heat
      let heat = generateEdgeHeatmap(canvas, 20, 20);
      
      // 2. Apply Text Blocks (PDFs)
      if (options.textRegions && options.textRegions.length > 0) {
        heat = applyTextRegions(heat, options.textRegions, canvas.width, canvas.height);
      }

      // 3. Normalize
      const norm = normalizeHeatmap(heat);
      if (!norm) return;

      // 4. Find Zone
      const gridX = 20;
      const gridY = 20;
      
      // Overlay requirements in grid cells (20x20 grid means each cell is 5%x5%)
      const isTicker = options.overlayType === 'ticker';
      const reqW = isTicker ? 16 : 6; // Ticker needs 80% width, badge needs 30%
      const reqH = isTicker ? 2 : 2;  // Needs 10% height
      const bias = isTicker ? 'bottom' : (options.type === 'pdf' ? 'top' : 'none');

      const cell = findSafeZone(norm, reqW, reqH, bias);

      // Convert to percentages
      const style = {
        left: `${(cell.x / gridX) * 100}%`,
        top: `${(cell.y / gridY) * 100}%`,
        width: `${(reqW / gridX) * 100}%`,
        height: `${(reqH / gridY) * 100}%`,
      };

      // Keep inside safe zones
      style.left = `max(2%, min(${style.left}, ${100 - (reqW/gridX)*100 - 2}%))`;
      style.top = `max(2%, min(${style.top}, ${100 - (reqH/gridY)*100 - 2}%))`;

      cacheRef.current.set(cacheKey, style);
      setSafeStyle(style);
    };

    // Give the media a moment to render before capturing
    const timer = setTimeout(analyze, 500);
    return () => clearTimeout(timer);
  }, [elementRef, options.id, options.textRegions]);

  return safeStyle;
}
