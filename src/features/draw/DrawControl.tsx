/**
 * DrawControl - компонент для рисования на карте
 * Использует mapbox-gl-draw и react-map-gl/maplibre
 */

import React from 'react';
import { useControl } from 'react-map-gl/maplibre'; // ВАЖНО: правильный импорт!
import MapboxDraw from '@mapbox/mapbox-gl-draw';
import '@mapbox/mapbox-gl-draw/dist/mapbox-gl-draw.css';

export type DrawControlProps = ConstructorParameters<typeof MapboxDraw>[0] & {
  position?: 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right';
  onCreate?: (evt: { features: object[] }) => void;
  onUpdate?: (evt: { features: object[]; action: string }) => void;
  onDelete?: (evt: { features: object[] }) => void;
  onSelectionChange?: (evt: { features: object[] }) => void;
};

export const DrawControl = React.forwardRef<MapboxDraw | undefined, DrawControlProps>(
  (props, ref) => {
    const drawRef = useControl<MapboxDraw>(
      () => new MapboxDraw(props),
      ({ map }) => {
        map.on('draw.create', props.onCreate);
        map.on('draw.update', props.onUpdate);
        map.on('draw.delete', props.onDelete);
        map.on('draw.selectionchange', props.onSelectionChange);
      },
      ({ map }) => {
        map.off('draw.create', props.onCreate);
        map.off('draw.update', props.onUpdate);
        map.off('draw.delete', props.onDelete);
        map.off('draw.selectionchange', props.onSelectionChange);
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
