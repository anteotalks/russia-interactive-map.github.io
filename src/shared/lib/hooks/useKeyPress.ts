import { useEffect, useCallback, useRef } from 'react';

export const useKeyPress = (targetKey: string, callback: () => void) => {
  const callbackRef = useRef(callback);
  
  useEffect(() => {
    callbackRef.current = callback;
  }, [callback]);

  const handleKeyDown = useCallback((event: KeyboardEvent) => {
    if (event.key.toLowerCase() === targetKey.toLowerCase()) {
      event.preventDefault();
      callbackRef.current();
    }
  }, [targetKey]);

  useEffect(() => {
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [handleKeyDown]);
};

export const useAltKeyPress = (callback: () => void) => {
  return useKeyPress('alt', callback);
};
