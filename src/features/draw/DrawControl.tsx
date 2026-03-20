/**
 * DrawControl - ФИНАЛЬНАЯ ВЕРСИЯ с правильной очисткой
 * Источник решения: https://stackoverflow.com/questions/76442944 [citation:3]
 */

import React, { useEffect, useRef } from 'react';
import { useControl } from 'react-map-gl/maplibre';
import MapboxDraw from '@mapbox/mapbox-gl-draw';
import '@mapbox/mapbox-gl-draw/dist/mapbox-gl-draw.css';

export type DrawControlProps = ConstructorParameters<typeof MapboxDraw>[0] & {
  position?: 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right';
  onCreate?: (evt: { features: object[] }) => void;
  onUpdate?: (evt: { features: object[]; action: string }) => void;
  onDelete?: (evt: { features: object[] }) => void;
  onSelectionChange?: (evt: { features: object[] }) => void;
  onModeChange?: (mode: string) => void;
};

export const DrawControl = React.forwardRef<MapboxDraw | undefined, DrawControlProps>(
  (props, ref) => {
    const drawRef = useControl<MapboxDraw>(
      () => {
        // Фикс для MapLibre [citation:10]
        if (typeof window !== 'undefined') {
          MapboxDraw.constants.classes.CONTROL_BASE = "maplibregl-ctrl";
          MapboxDraw.constants.classes.CONTROL_PREFIX = "maplibregl-ctrl-";
          MapboxDraw.constants.classes.CONTROL_GROUP = "maplibregl-ctrl-group";
        }
        return new MapboxDraw(props);
      },
      ({ map }) => {
        // ВАЖНО: используем ОТДЕЛЬНУЮ функцию для обработчика
        // чтобы можно было правильно отписаться [citation:3]
        const handleCreate = (evt: any) => {
          console.log('Draw create event received');
          if (props.onCreate) props.onCreate(evt);
        };

        const handleUpdate = (evt: any) => {
          console.log('Draw update event received');
          if (props.onUpdate) props.onUpdate(evt);
        };

        const handleDelete = (evt: any) => {
          console.log('Draw delete event received');
          if (props.onDelete) props.onDelete(evt);
        };

        const handleSelectionChange = (evt: any) => {
          if (props.onSelectionChange) props.onSelectionChange(evt);
        };

        const handleModeChange = (evt: any) => {
          if (props.onModeChange) props.onModeChange(evt.mode);
        };

        // Сохраняем обработчики в свойстве drawRef для очистки
        if (drawRef.current) {
          (drawRef.current as any).__handlers = {
            create: handleCreate,
            update: handleUpdate,
            delete: handleDelete,
            selection: handleSelectionChange,
            mode: handleModeChange
          };
        }

        // Подписываемся
        map.on('draw.create', handleCreate);
        map.on('draw.update', handleUpdate);
        map.on('draw.delete', handleDelete);
        map.on('draw.selectionchange', handleSelectionChange);
        map.on('draw.modechange', handleModeChange);
      },
      ({ map }) => {
        // ПРАВИЛЬНАЯ ОЧИСТКА: отписываемся от всех событий [citation:3]
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

    React.useImperativeHandle(ref, () => drawRef, [drawRef]);

    return null;
  }
);

DrawControl.displayName = 'DrawControl';

export default DrawControl;
