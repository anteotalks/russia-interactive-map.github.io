/**
 * Хук для управления состоянием рисования лассо
 * Реализует паттерн смены режимов из документации react-map-gl-draw [citation:1][citation:9]
 */

import { useState, useCallback, useMemo, useRef } from 'react';
import { Feature, Polygon } from 'geojson';
import * as turf from '@turf/turf';
import { Location } from '../../../entities/location/lib/types';
import { LassoMode, LassoState, PointInPolygonResult } from '../lib/types';

interface UseLassoReturn {
  state: LassoState;
  setMode: (mode: LassoMode) => void;
  addFeature: (feature: Feature<Polygon>) => void;
  removeFeature: (featureId: string) => void;
  clearAll: () => void;
  selectFeature: (featureId: string | null) => void;
  findPointsInPolygon: (feature: Feature<Polygon>, locations: Location[]) => PointInPolygonResult;
  isPointInPolygon: (location: Location, feature: Feature<Polygon>) => boolean;
}

/**
 * Хук для управления состоянием рисования
 * Максимально производительный с useCallback и useMemo
 */
export const useLasso = (): UseLassoReturn => {
  const [state, setState] = useState<LassoState>({
    mode: LassoMode.INACTIVE,
    features: [],
    selectedFeatureId: null,
    isDrawing: false,
  });

  // Используем ref для отслеживания уникальных ID
  const featureIdCounter = useRef(0);

  /**
   * Установка режима рисования
   */
  const setMode = useCallback((mode: LassoMode) => {
    setState(prev => ({
      ...prev,
      mode,
      isDrawing: mode === LassoMode.DRAWING,
    }));
  }, []);

  /**
   * Добавление нового полигона
   * Генерирует уникальный ID согласно документации [citation:1]
   */
  const addFeature = useCallback((feature: Feature<Polygon>) => {
    featureIdCounter.current += 1;
    const featureWithId: Feature<Polygon> = {
      ...feature,
      id: `lasso-${featureIdCounter.current}`,
      properties: {
        ...feature.properties,
        renderType: 'Polygon', // Для стилизации [citation:1]
        created: Date.now(),
      },
    };

    setState(prev => ({
      ...prev,
      features: [...prev.features, featureWithId],
      selectedFeatureId: featureWithId.id as string,
      mode: LassoMode.EDITING,
      isDrawing: false,
    }));
  }, []);

  /**
   * Удаление полигона
   */
  const removeFeature = useCallback((featureId: string) => {
    setState(prev => ({
      ...prev,
      features: prev.features.filter(f => f.id !== featureId),
      selectedFeatureId: prev.selectedFeatureId === featureId ? null : prev.selectedFeatureId,
    }));
  }, []);

  /**
   * Очистка всех полигонов
   */
  const clearAll = useCallback(() => {
    setState({
      mode: LassoMode.INACTIVE,
      features: [],
      selectedFeatureId: null,
      isDrawing: false,
    });
    featureIdCounter.current = 0;
  }, []);

  /**
   * Выбор полигона
   */
  const selectFeature = useCallback((featureId: string | null) => {
    setState(prev => ({
      ...prev,
      selectedFeatureId: featureId,
    }));
  }, []);

  /**
   * Проверка попадания точки в полигон с использованием Turf.js [citation:3][citation:7]
   */
  const isPointInPolygon = useCallback((location: Location, feature: Feature<Polygon>): boolean => {
    try {
      const point = turf.point([location.longitude, location.latitude]);
      // ignoreBoundary: false - учитываем точки на границе [citation:3]
      return turf.booleanPointInPolygon(point, feature, { ignoreBoundary: false });
    } catch (error) {
      console.error('Ошибка при проверке точки в полигоне:', error);
      return false;
    }
  }, []);

  /**
   * Поиск всех точек внутри полигона
   * Оптимизировано для производительности [citation:7]
   */
  const findPointsInPolygon = useCallback((
    feature: Feature<Polygon>,
    locations: Location[]
  ): PointInPolygonResult => {
    if (!locations || locations.length === 0) {
      return { locations: [], count: 0, polygon: feature };
    }

    // Фильтруем точки с помощью booleanPointInPolygon [citation:3]
    const matchingLocations = locations.filter(loc => isPointInPolygon(loc, feature));

    return {
      locations: matchingLocations,
      count: matchingLocations.length,
      polygon: feature,
    };
  }, [isPointInPolygon]);

  return {
    state,
    setMode,
    addFeature,
    removeFeature,
    clearAll,
    selectFeature,
    findPointsInPolygon,
    isPointInPolygon,
  };
};

export default useLasso;
