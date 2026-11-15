import { useState, useCallback } from 'react';

export type SelectionMode = 'none' | 'rectangle' | 'lasso';

interface UseSelectionModeReturn {
  mode: SelectionMode;
  setMode: (mode: SelectionMode) => void;
  reset: () => void;
}

/**
 * Хук для управления режимом выделения на карте.
 */
export function useSelectionMode(): UseSelectionModeReturn {
  const [mode, setMode] = useState<SelectionMode>('none');

  const reset = useCallback(() => setMode('none'), []);

  return { mode, setMode, reset };
}
