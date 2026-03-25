/**
 * DrawControl - ИСПРАВЛЕННАЯ ВЕРСИЯ для MapLibre
 * 
 * Проблемы:
 * 1. "Layer already exists" - из-за дублирования слоёв
 * 2. "The source image could not be decoded" - из-за конфликта классов
 * 3. Оранжевое выделение полигона
 * 
 * Решение основано на официальном репозитории maplibre-gl-js [citation:5]
 */

import React, { useImperativeHandle, forwardRef, useEffect, useRef } from 'react';
import { useControl, useMap } from 'react-map-gl/maplibre';
import MapboxDraw from '@mapbox/mapbox-gl-draw';
import '@mapbox/mapbox-gl-draw/dist/mapbox-gl-draw.css';

type DrawControlProps = ConstructorParameters<typeof MapboxDraw>[0] & {
  position?: 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right';
  onCreate?: (evt: { features: object[] }) => void;
  onUpdate?: (evt: { features: object[]; action: string }) => void;
  onDelete?: (evt: { features: object[] }) => void;
  onSelectionChange?: (evt: { features: object[] }) => void;
  onModeChange?: (mode: string) => void;
};

export interface DrawControlHandle {
  deleteAll: () => void;
  changeMode: (mode: string) => void;
  getAll: () => any;
  delete: (featureId: string) => void;
}

// ============================================================
// КАСТОМНЫЕ СТИЛИ С ТЁМНО-СЕРЫМ ВЫДЕЛЕНИЕМ
// ============================================================
// Цвет выделения теперь #555555 (тёмно-серый) вместо оранжевого [citation:2][citation:6]
const customDrawStyles = [
  // ===== ВЫДЕЛЕННЫЙ ПОЛИГОН (ACTIVE) - МЕНЯЕМ ЦВЕТ ЗДЕСЬ =====
  {
    id: 'gl-draw-polygon-fill-active',
    type: 'fill',
    filter: ['all', ['==', 'active', 'true'], ['==', '$type', 'Polygon']],
    paint: {
      'fill-color': '#555555',        // ← ТЁМНО-СЕРЫЙ (было оранжевое)
      'fill-outline-color': '#555555',
      'fill-opacity': 0.4
    }
  },
  {
    id: 'gl-draw-polygon-stroke-active',
    type: 'line',
    filter: ['all', ['==', 'active', 'true'], ['==', '$type', 'Polygon']],
    layout: {
      'line-cap': 'round',
      'line-join': 'round'
    },
    paint: {
      'line-color': '#555555',        // ← ТЁМНО-СЕРЫЙ (было оранжевое)
      'line-dasharray': [0.2, 2],
      'line-width': 2
    }
  },
  
  // ===== ОСТАЛЬНЫЕ СТИЛИ (оставляем как в оригинале) =====
  {
    id: 'gl-draw-line',
    type: 'line',
    filter: ['all', ['==', '$type', 'LineString'], ['!=', 'mode', 'static']],
    layout: {
      'line-cap': 'round',
      'line-join': 'round'
    },
    paint: {
      'line-color': '#D20C0C',
      'line-dasharray': [0.2, 2],
      'line-width': 2
    }
  },
  {
    id: 'gl-draw-polygon-fill',
    type: 'fill',
    filter: ['all', ['==', '$type', 'Polygon'], ['!=', 'mode', 'static']],
    paint: {
      'fill-color': '#D20C0C',
      'fill-outline-color': '#D20C0C',
      'fill-opacity': 0.1
    }
  },
  {
    id: 'gl-draw-polygon-stroke-inactive',
    type: 'line',
    filter: ['all', ['==', 'active', 'false'], ['==', '$type', 'Polygon'], ['!=', 'mode', 'static']],
    layout: {
      'line-cap': 'round',
      'line-join': 'round'
    },
    paint: {
      'line-color': '#D20C0C',
      'line-width': 2
    }
  },
  {
    id: 'gl-draw-polygon-and-line-vertex-halo-active',
    type: 'circle',
    filter: ['all', ['==', 'meta', 'vertex'], ['==', '$type', 'Point'], ['!=', 'mode', 'static']],
    paint: {
      'circle-radius': 12,
      'circle-color': '#FFF'
    }
  },
  {
    id: 'gl-draw-polygon-and-line-vertex-active',
    type: 'circle',
    filter: ['all', ['==', 'meta', 'vertex'], ['==', '$type', 'Point'], ['!=', 'mode', 'static']],
    paint: {
      'circle-radius': 8,
      'circle-color': '#D20C0C'
    }
  },
  {
    id: 'gl-draw-polygon-fill-static',
    type: 'fill',
    filter: ['all', ['==', '$type', 'Polygon'], ['==', 'mode', 'static']],
    paint: {
      'fill-color': '#000',
      'fill-outline-color': '#000',
      'fill-opacity': 0.1
    }
  },
  {
    id: 'gl-draw-polygon-stroke-static',
    type: 'line',
    filter: ['all', ['==', '$type', 'Polygon'], ['==', 'mode', 'static']],
    layout: {
      'line-cap': 'round',
      'line-join': 'round'
    },
    paint: {
      'line-color': '#000',
      'line-width': 2
    }
  }
];

export const DrawControl = forwardRef<DrawControlHandle, DrawControlProps>((props, ref) => {
  const { current: map } = useMap();
  const drawInstanceRef = useRef<MapboxDraw | null>(null);
  const isInitializedRef = useRef(false);

  // ============================================================
  // КРИТИЧЕСКИ ВАЖНО: исправляем классы для совместимости с MapLibre
  // Это решает ошибки "Layer already exists" [citation:5]
  // ============================================================
  useEffect(() => {
    if (!map || isInitializedRef.current) return;

    // 1. Добавляем классы Mapbox на canvas (нужно для работы клавиатурных привязок)
    if (map.getCanvas()) {
      map.getCanvas().className = 'mapboxgl-canvas maplibregl-canvas';
    }
    
    // 2. Добавляем класс mapboxgl-map к контейнеру
    if (map.getContainer()) {
      map.getContainer().classList.add('mapboxgl-map');
    }
    
    // 3. Добавляем классы к canvas-container
    const canvasContainer = map.getCanvasContainer();
    if (canvasContainer) {
      canvasContainer.classList.add('mapboxgl-canvas-container');
      if (canvasContainer.classList.contains('maplibregl-interactive')) {
        canvasContainer.classList.add('mapboxgl-interactive');
      }
    }

    // 4. КРИТИЧЕСКИ ВАЖНО: меняем константы MapboxDraw на MapLibre-версии
    // Это решает проблему с неправильными CSS-классами [citation:5]
    MapboxDraw.constants.classes.CONTROL_BASE = "maplibregl-ctrl";
    MapboxDraw.constants.classes.CONTROL_PREFIX = "maplibregl-ctrl-";
    MapboxDraw.constants.classes.CONTROL_GROUP = "maplibregl-ctrl-group";

    isInitializedRef.current = true;
  }, [map]);

  // Создаём и добавляем DrawControl
  useControl<MapboxDraw>(
    () => {
      // Создаём экземпляр DrawControl с кастомными стилями
      const draw = new MapboxDraw({
        displayControlsDefault: false,
        controls: {
          polygon: true,
          trash: true,
        },
        styles: customDrawStyles,  // ← применяем тёмно-серые стили
        ...props
      });
      
      drawInstanceRef.current = draw;
      return draw;
    },
    ({ map: mapInstance }) => {
      // Навешиваем обработчики событий
      const onCreate = (e: any) => props.onCreate?.(e);
      const onUpdate = (e: any) => props.onUpdate?.(e);
      const onDelete = (e: any) => props.onDelete?.(e);
      const onSelectionChange = (e: any) => props.onSelectionChange?.(e);
      const onModeChange = (e: any) => props.onModeChange?.(e.mode);

      mapInstance.on('draw.create', onCreate);
      mapInstance.on('draw.update', onUpdate);
      mapInstance.on('draw.delete', onDelete);
      mapInstance.on('draw.selectionchange', onSelectionChange);
      mapInstance.on('draw.modechange', onModeChange);

      // Сохраняем обработчики для очистки
      if (drawInstanceRef.current) {
        (drawInstanceRef.current as any).__handlers = {
          create: onCreate,
          update: onUpdate,
          delete: onDelete,
          selection: onSelectionChange,
          mode: onModeChange
        };
      }
    },
    ({ map: mapInstance }) => {
      // Очищаем обработчики при размонтировании
      const handlers = (drawInstanceRef.current as any)?.__handlers;
      if (handlers) {
        mapInstance.off('draw.create', handlers.create);
        mapInstance.off('draw.update', handlers.update);
        mapInstance.off('draw.delete', handlers.delete);
        mapInstance.off('draw.selectionchange', handlers.selection);
        mapInstance.off('draw.modechange', handlers.mode);
      }
    },
    {
      position: props.position,
    }
  );

  // Предоставляем методы наружу через ref
  useImperativeHandle(ref, () => ({
    deleteAll: () => drawInstanceRef.current?.deleteAll(),
    changeMode: (mode: string) => drawInstanceRef.current?.changeMode(mode),
    getAll: () => drawInstanceRef.current?.getAll() || { type: 'FeatureCollection', features: [] },
    delete: (featureId: string) => drawInstanceRef.current?.delete(featureId),
  }), []);

  return null;
});

DrawControl.displayName = 'DrawControl';

export default DrawControl;