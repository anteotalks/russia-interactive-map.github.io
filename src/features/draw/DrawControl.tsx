// src/features/draw/DrawControl.tsx
import React, { forwardRef, useImperativeHandle, useRef } from 'react';
import { useControl } from 'react-map-gl/maplibre';
import { MaplibreTerradrawControl } from '@watergis/maplibre-gl-terradraw';
import '@watergis/maplibre-gl-terradraw/dist/maplibre-gl-terradraw.css';

type DrawControlProps = {
  position?: 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right';
  modes?: string[];
};

export interface DrawControlHandle {
  getFeatures: () => any[];
  deleteAll: () => void;
  getTerraDrawInstance: () => any;
}

export const DrawControl = forwardRef<DrawControlHandle, DrawControlProps>(
  ({ position = 'top-left', modes = ['polygon', 'select', 'delete-selection', 'delete'] }, ref) => {
    const controlRef = useRef<MaplibreTerradrawControl | null>(null);

    const control = useControl<MaplibreTerradrawControl>(
      () =>
        new MaplibreTerradrawControl({
          modes,
          open: true,
        }),
      {
        position,
      }
    );

    controlRef.current = control;

    useImperativeHandle(
      ref,
      () => ({
        getFeatures: () => {
          const td = controlRef.current?.getTerraDrawInstance?.();
          if (!td) return [];
          return td.getSnapshot?.() ?? [];
        },
        deleteAll: () => {
          const td = controlRef.current?.getTerraDrawInstance?.();
          td?.clear?.();
        },
        getTerraDrawInstance: () => controlRef.current?.getTerraDrawInstance?.(),
      }),
      []
    );

    return null;
  }
);

DrawControl.displayName = 'DrawControl';
export default DrawControl;