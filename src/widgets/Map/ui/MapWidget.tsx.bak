/**
 * MapWidget - компонент карты с поддержкой onClick
 */

import React, { forwardRef, useEffect, useRef, useCallback } from 'react';
import Map, { MapRef, useControl } from 'react-map-gl/maplibre';
import { MapboxOverlay } from '@deck.gl/mapbox';
import type { MapboxOverlayProps } from '@deck.gl/mapbox';
import 'maplibre-gl/dist/maplibre-gl.css';
import type { Layer, PickingInfo } from '@deck.gl/core';
import type { LayerConfig } from '../../../shared/types/map';
import { NavigationControl } from 'react-map-gl/maplibre';
import { buildMapStyle } from '../../../shared/lib/map/buildMapStyle';
import { TerrainDem } from '../lib/TerrainDem';
import { HillshadeDem } from '../lib/HillshadeDem';

export type TerrainMode = 'none' | 'hillshade' | '3d';

interface MapWidgetProps {
  layers: Layer[];
  getTooltip?: (info: PickingInfo) => any;
  onClick?: (info: PickingInfo) => void;
  viewState?: {
    longitude: number;
    latitude: number;
    zoom: number;
    pitch?: number;
    bearing?: number;
  };
  initialViewState?: {
    longitude: number;
    latitude: number;
    zoom: number;
    pitch?: number;
    bearing?: number;
  };
  baseLayer: LayerConfig;
  terrainMode: TerrainMode;
  onViewStateChange?: (viewState: any) => void;
}

function DeckGLOverlay(props: MapboxOverlayProps & { interleaved?: boolean }) {
  const overlay = useControl<MapboxOverlay>(
    () => new MapboxOverlay({ ...props, interleaved: true }),
  );
  overlay.setProps(props);
  return null;
}

function throttle<T extends (...args: any[]) => any>(func: T, limit: number): T {
  let inThrottle: boolean;
  return ((...args: any[]) => {
    if (!inThrottle) {
      func(...args);
      inThrottle = true;
      setTimeout(() => inThrottle = false, limit);
    }
  }) as T;
}

export const MapWidget = forwardRef<MapRef, MapWidgetProps>(({
  layers,
  getTooltip,
  onClick,
  viewState,
  initialViewState,
  baseLayer,
  terrainMode,
  onViewStateChange,
}, ref) => {
  const mapStyle = React.useMemo(() => buildMapStyle(baseLayer), [baseLayer]);
  const terrainProps = terrainMode === '3d' ? { source: 'terrain-dem', exaggeration: 1.5 } : undefined;
  
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRefLocal = useRef<MapRef | null>(null);

  const handleResize = useCallback(() => {
    if (mapRefLocal.current) {
      mapRefLocal.current.resize();
    }
  }, []);

  const throttledResize = useCallback(throttle(handleResize, 100), [handleResize]);

  useEffect(() => {
    window.addEventListener('resize', throttledResize);
    return () => window.removeEventListener('resize', throttledResize);
  }, [throttledResize]);

  useEffect(() => {
    if (!containerRef.current) return;
    const observer = new ResizeObserver(() => throttledResize());
    observer.observe(containerRef.current);
    return () => observer.disconnect();
  }, [throttledResize]);

  useEffect(() => {
    const timeoutId = setTimeout(handleResize, 100);
    return () => clearTimeout(timeoutId);
  }, [handleResize]);

  useEffect(() => {
    console.info(`🌍 Режим рельефа: ${terrainMode}`);
  }, [terrainMode]);

  return (
    <div
      ref={containerRef}
      style={{
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        width: '100%',
        height: '100%',
        overflow: 'hidden'
      }}
    >
      <Map
        ref={(node) => {
          mapRefLocal.current = node;
          if (typeof ref === 'function') ref(node);
          else if (ref) ref.current = node;
        }}
        mapStyle={mapStyle}
        {...(viewState ? viewState : {})}
        initialViewState={!viewState ? initialViewState : undefined}
        onMove={onViewStateChange ? (evt) => onViewStateChange(evt.viewState) : undefined}
        maxPitch={85}
        attributionControl={false}
        maxTileCacheSize={200}
        maxTileCacheZoomLevels={8}
        validateStyle={process.env.NODE_ENV === "production" ? false : undefined}
        onLoad={() => {
          console.log('✅ MapLibre карта загружена');
          handleResize();
        }}
        onError={(e) => console.error('❌ Ошибка MapLibre:', e)}
        style={{ width: '100%', height: '100%' }}
        terrain={terrainProps}
      >
        <TerrainDem />
        {terrainMode === 'hillshade' && <HillshadeDem />}
        <NavigationControl position="top-right" />
        <DeckGLOverlay
          layers={layers}
          getTooltip={getTooltip}
          onClick={onClick}
          interleaved
        />
      </Map>
    </div>
  );
});

MapWidget.displayName = 'MapWidget';
export default MapWidget;
