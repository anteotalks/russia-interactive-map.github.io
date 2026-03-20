/**
 * Хук для интеграции react-map-gl-draw с состоянием приложения
 * Основан на официальных примерах [citation:1][citation:6]
 */

import { useCallback, useEffect, useRef } from 'react';
import { Feature, Polygon } from 'geojson';
import { LassoMode } from '../lib/types';
import useLasso from './useLasso';

interface UseLassoDrawReturn {
  mode: any; // Тип из react-map-gl-draw
  features: Feature<Polygon>[];
  selectedFeatureId: string | null;
  onUpdate: (data: { data: Feature<Polygon>[]; editType: string }) => void;
  onSelect: (data: { selectedFeatureId: string | null }) => void;
  startDrawing: () => void;
  stopDrawing: () => void;
  clearDrawing: () => void;
}

/**
 * Хук для интеграции react-map-gl-draw
 * Использует паттерн из документации [citation:1][citation:9]
 */
export const useLassoDraw = (
  onSelectionComplete?: (locations: Feature<Polygon>) => void
): UseLassoDrawReturn => {
  const {
    state,
    setMode,
    addFeature,
    clearAll,
    selectFeature,
    findPointsInPolygon,
  } = useLasso();

  // Lazy import для react-map-gl-draw
  const DrawModeRef = useRef<any>(null);
  const EditingModeRef = useRef<any>(null);

  useEffect(() => {
    // Динамический импорт для уменьшения размера бандла
    import('react-map-gl-draw').then((module) => {
      DrawModeRef.current = new module.DrawPolygonMode();
      EditingModeRef.current = new module.EditingMode();
    });
  }, []);

  /**
   * Обработчик обновления фигур [citation:1]
   * Вызывается при завершении рисования
   */
  const onUpdate = useCallback(({ data, editType }: { data: Feature<Polygon>[]; editType: string }) => {
    // Проверяем, что полигон завершён (не в процессе рисования) [citation:1]
    const completedPolygon = data.find(f => 
      f.geometry.type === 'Polygon' && 
      f.properties?.renderType !== 'Polygon' && // Не незавершённый полигон
      editType === 'addFeature'
    );

    if (completedPolygon) {
      addFeature(completedPolygon);
      
      // Вызываем колбэк с завершённым полигоном
      if (onSelectionComplete) {
        onSelectionComplete(completedPolygon);
      }
    }
  }, [addFeature, onSelectionComplete]);

  /**
   * Обработчик выбора фигуры [citation:1]
   */
  const onSelect = useCallback(({ selectedFeatureId }: { selectedFeatureId: string | null }) => {
    selectFeature(selectedFeatureId);
  }, [selectFeature]);

  /**
   * Начать рисование
   */
  const startDrawing = useCallback(() => {
    setMode(LassoMode.DRAWING);
  }, [setMode]);

  /**
   * Остановить рисование
   */
  const stopDrawing = useCallback(() => {
    setMode(LassoMode.INACTIVE);
  }, [setMode]);

  /**
   * Очистить все рисунки
   */
  const clearDrawing = useCallback(() => {
    clearAll();
  }, [clearAll]);

  // Определяем текущий режим для react-map-gl-draw
  const currentMode = (() => {
    if (state.mode === LassoMode.DRAWING && DrawModeRef.current) {
      return DrawModeRef.current;
    }
    if (state.mode === LassoMode.EDITING && EditingModeRef.current) {
      return EditingModeRef.current;
    }
    return null;
  })();

  return {
    mode: currentMode,
    features: state.features,
    selectedFeatureId: state.selectedFeatureId,
    onUpdate,
    onSelect,
    startDrawing,
    stopDrawing,
    clearDrawing,
  };
};

export default useLassoDraw;
