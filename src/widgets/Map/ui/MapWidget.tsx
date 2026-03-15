/**
 * MapWidget - компонент карты с полной адаптивностью и правильной интеграцией DeckGL
 * 
 * ОСОБЕННОСТИ:
 * - Автоматически подстраивается под размер контейнера (ResizeObserver)
 * - Корректно работает при изменении размеров окна и повороте устройства
 * - Не создаёт жёлтых обводок и лишних подсветок
 */

import React, { forwardRef, useEffect, useRef, useCallback } from 'react';
import Map, { MapRef, useControl } from 'react-map-gl/maplibre';
import { MapboxOverlay } from '@deck.gl/mapbox';
import type { MapboxOverlayProps } from '@deck.gl/mapbox';
import 'maplibre-gl/dist/maplibre-gl.css';
import type { Layer } from '@deck.gl/core';
import type { LayerConfig } from '../../../shared/types/map';
import { NavigationControl } from 'react-map-gl/maplibre';
import { buildMapStyle } from '../../../shared/lib/map/buildMapStyle';
import { TerrainDem } from '../lib/TerrainDem';
import { HillshadeDem } from '../lib/HillshadeDem';

export type TerrainMode = 'none' | 'hillshade' | '3d';

interface MapWidgetProps {
  layers: Layer[];
  getTooltip?: (info: any) => any;
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

// Простая функция throttle для оптимизации resize
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
  viewState,
  initialViewState,
  baseLayer,
  terrainMode,
  onViewStateChange,
}, ref) => {
  const mapStyle = React.useMemo(() => buildMapStyle(baseLayer), [baseLayer]);
  const terrainProps = terrainMode === '3d' ? { source: 'terrain-dem', exaggeration: 1.5 } : undefined;
  
  // Реф для контейнера карты (нужен для ResizeObserver)
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRefLocal = useRef<MapRef | null>(null);

  // Функция для принудительного обновления размеров карты
  const handleResize = useCallback(() => {
    if (mapRefLocal.current) {
      mapRefLocal.current.resize();
    }
  }, []);

  // Throttled версия для производительности
  const throttledResize = useCallback(throttle(handleResize, 100), [handleResize]);

  // 1. Слушаем resize окна (стандартный подход)
  useEffect(() => {
    window.addEventListener('resize', throttledResize);
    return () => window.removeEventListener('resize', throttledResize);
  }, [throttledResize]);

  // 2. Используем ResizeObserver для отслеживания изменений контейнера
  useEffect(() => {
    if (!containerRef.current) return;

    const observer = new ResizeObserver((entries) => {
      // При любом изменении размера контейнера вызываем resize карты
      throttledResize();
    });

    observer.observe(containerRef.current);

    return () => {
      observer.disconnect();
    };
  }, [throttledResize]);

  // 3. При первом рендере тоже вызываем resize (для надёжности)
  useEffect(() => {
    // Небольшая задержка, чтобы DOM успел отрисоваться
    const timeoutId = setTimeout(() => {
      handleResize();
    }, 100);
    
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
          // Принудительно обновляем размер после загрузки
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
          interleaved
        />
      </Map>
    </div>
  );
});

MapWidget.displayName = 'MapWidget';
export default MapWidget;
