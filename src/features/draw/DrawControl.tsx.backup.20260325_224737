/**
 * DrawControl - УПРОЩЕННАЯ ВЕРСИЯ
 * Использует дефолтные стили mapbox-gl-draw
 */

import React, { useImperativeHandle, forwardRef } from 'react';
import { useControl } from 'react-map-gl/maplibre';
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
}

export const DrawControl = forwardRef<DrawControlHandle, DrawControlProps>((props, ref) => {
  const drawRef = useControl<MapboxDraw>(
    () => {
      // Фикс для MapLibre
      MapboxDraw.constants.classes.CONTROL_BASE = "maplibregl-ctrl";
      MapboxDraw.constants.classes.CONTROL_PREFIX = "maplibregl-ctrl-";
      MapboxDraw.constants.classes.CONTROL_GROUP = "maplibregl-ctrl-group";
      
      // ВАЖНО: НЕ передаем кастомные стили
      return new MapboxDraw({
        displayControlsDefault: false,
        controls: {
          polygon: true,
          trash: true,
        },
        ...props
      });
    },
    ({ map }) => {
      const onCreate = (e: any) => props.onCreate?.(e);
      const onUpdate = (e: any) => props.onUpdate?.(e);
      const onDelete = (e: any) => props.onDelete?.(e);
      const onSelectionChange = (e: any) => props.onSelectionChange?.(e);
      const onModeChange = (e: any) => props.onModeChange?.(e.mode);

      map.on('draw.create', onCreate);
      map.on('draw.update', onUpdate);
      map.on('draw.delete', onDelete);
      map.on('draw.selectionchange', onSelectionChange);
      map.on('draw.modechange', onModeChange);

      if (drawRef.current) {
        (drawRef.current as any).__handlers = {
          create: onCreate,
          update: onUpdate,
          delete: onDelete,
          selection: onSelectionChange,
          mode: onModeChange
        };
      }
    },
    ({ map }) => {
      const handlers = (drawRef.current as any)?.__handlers;
      if (handlers) {
        map.off('draw.create', handlers.create);
        map.off('draw.update', handlers.update);
        map.off('draw.delete', handlers.delete);
        map.off('draw.selectionchange', handlers.selection);
        map.off('draw.modechange', handlers.mode);
      }
    },
    {
      position: props.position,
    }
  );

  useImperativeHandle(ref, () => ({
    deleteAll: () => drawRef.current?.deleteAll(),
    changeMode: (mode: string) => drawRef.current?.changeMode(mode),
    getAll: () => drawRef.current?.getAll() || { type: 'FeatureCollection', features: [] }
  }), [drawRef]);

  return null;
});

DrawControl.displayName = 'DrawControl';

export default DrawControl;
