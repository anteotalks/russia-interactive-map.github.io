import { useState, useCallback, useRef } from 'react';
import type { Feature, Polygon } from 'geojson';
import booleanPointInPolygon from '@turf/boolean-point-in-polygon';
import { Location } from '../../../entities/location/lib/types';

interface LassoState {
  active: boolean;
  points: [number, number][]; // массив [lng, lat]
}

export interface UseLassoSelectionReturn {
  state: LassoState;
  startLasso: () => void;
  addPoint: (lng: number, lat: number) => void;
  finishLasso: () => Polygon | null;
  cancelLasso: () => void;
  getSelectedLocations: (locations: Location[]) => Location[];
}

/**
 * Хук для управления lasso-выделением.
 * Собирает точки полигона и возвращает выделенные локации.
 */
export function useLassoSelection(): UseLassoSelectionReturn {
  const [state, setState] = useState<LassoState>({
    active: false,
    points: [],
  });

  const startLasso = useCallback(() => {
    setState({ active: true, points: [] });
  }, []);

  const addPoint = useCallback((lng: number, lat: number) => {
    setState(prev => {
      if (!prev.active) return prev;
      return { ...prev, points: [...prev.points, [lng, lat]] };
    });
  }, []);

  const finishLasso = useCallback((): Polygon | null => {
    let polygon: Polygon | null = null;
    setState(prev => {
      if (!prev.active || prev.points.length < 3) {
        return { active: false, points: [] };
      }
      // Замыкаем полигон, добавляя первую точку в конец
      const closedPoints = [...prev.points, prev.points[0]];
      polygon = {
        type: 'Polygon',
        coordinates: [closedPoints],
      };
      return { active: false, points: [] };
    });
    return polygon;
  }, []);

  const cancelLasso = useCallback(() => {
    setState({ active: false, points: [] });
  }, []);

  const getSelectedLocations = useCallback(
    (locations: Location[], polygon: Polygon | null): Location[] => {
      if (!polygon || polygon.coordinates.length === 0) return [];
      return locations.filter(loc =>
        booleanPointInPolygon([loc.longitude, loc.latitude], polygon as Feature)
      );
    },
    []
  );

  return {
    state,
    startLasso,
    addPoint,
    finishLasso,
    cancelLasso,
    getSelectedLocations,
  };
}
