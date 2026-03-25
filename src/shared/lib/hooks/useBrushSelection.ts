import { useState, useCallback } from 'react';

export interface BrushSelectionState {
  isSelecting: boolean;
  start: { x: number; y: number } | null;
  end: { x: number; y: number } | null;
  bounds: { minX: number; maxX: number; minY: number; maxY: number } | null;
}

export interface UseBrushSelectionReturn {
  state: BrushSelectionState;
  startBrush: (x: number, y: number) => void;
  updateBrush: (x: number, y: number) => void;
  endBrush: () => BrushSelectionState['bounds'];
  resetBrush: () => void;
}

export function useBrushSelection(): UseBrushSelectionReturn {
  const [state, setState] = useState<BrushSelectionState>({
    isSelecting: false,
    start: null,
    end: null,
    bounds: null,
  });

  const startBrush = useCallback((x: number, y: number) => {
    setState({
      isSelecting: true,
      start: { x, y },
      end: { x, y },
      bounds: null,
    });
  }, []);

  const updateBrush = useCallback((x: number, y: number) => {
    setState(prev => {
      if (!prev.isSelecting || !prev.start) return prev;
      const start = prev.start;
      const minX = Math.min(start.x, x);
      const maxX = Math.max(start.x, x);
      const minY = Math.min(start.y, y);
      const maxY = Math.max(start.y, y);
      return {
        ...prev,
        end: { x, y },
        bounds: { minX, maxX, minY, maxY },
      };
    });
  }, []);

  const endBrush = useCallback((): BrushSelectionState['bounds'] => {
    let finalBounds: BrushSelectionState['bounds'] = null;
    setState(prev => {
      if (!prev.isSelecting || !prev.start || !prev.end) {
        finalBounds = null;
        return { isSelecting: false, start: null, end: null, bounds: null };
      }
      const minX = Math.min(prev.start.x, prev.end.x);
      const maxX = Math.max(prev.start.x, prev.end.x);
      const minY = Math.min(prev.start.y, prev.end.y);
      const maxY = Math.max(prev.start.y, prev.end.y);
      finalBounds = { minX, maxX, minY, maxY };
      return { isSelecting: false, start: null, end: null, bounds: null };
    });
    return finalBounds;
  }, []);

  const resetBrush = useCallback(() => {
    setState({ isSelecting: false, start: null, end: null, bounds: null });
  }, []);

  return { state, startBrush, updateBrush, endBrush, resetBrush };
}
