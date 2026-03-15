#!/bin/bash
set -e

echo "🚀 Исправляем настройки границ, убираем обводки и делаем карту адаптивной..."

# 1. Исправленный хук useRegionLayer.ts (убираем жёлтую подсветку, добавляем updateTriggers)
cat > src/shared/lib/hooks/useRegionLayer.ts << 'EOF'
/**
 * Хук для создания слоя границ регионов с правильной реактивностью
 * и отключённой подсветкой при наведении
 */

import { useMemo } from 'react';
import { GeoJsonLayer } from '@deck.gl/layers';
import type { FeatureCollection } from 'geojson';
import { hexToRgb } from '../color/utils';
import type { RegionLayerConfig } from '../../../entities/region/lib/types';

export const useRegionLayer = (
  regionsData: FeatureCollection | null,
  config: RegionLayerConfig
): GeoJsonLayer | null => {
  return useMemo(() => {
    if (!regionsData) return null;

    // Преобразуем HEX в RGB для deck.gl
    const lineColorRgb = hexToRgb(config.color);

    return new GeoJsonLayer({
      id: 'regions-layer',
      data: regionsData,

      // Основные параметры отрисовки
      stroked: true,              // Рисуем только линии
      filled: false,              // Без заливки
      getLineColor: lineColorRgb, // Цвет линий из конфига
      getLineWidth: config.width, // Толщина линий
      lineWidthUnits: 'pixels',   // Толщина в пикселях (не зависит от зума)
      opacity: config.opacity,    // Прозрачность слоя

      // ОТКЛЮЧАЕМ ВСЮ ПОДСВЕТКУ
      pickable: false,            // Не реагируем на hover/click
      autoHighlight: false,       // Отключаем автоматическую подсветку
      highlightColor: [0, 0, 0, 0], // Прозрачный цвет на всякий случай

      // ПРАВИЛЬНАЯ РЕАКТИВНОСТЬ: слой перерисовывается при изменении этих параметров
      updateTriggers: {
        getLineColor: [config.color],
        getLineWidth: [config.width],
        opacity: [config.opacity],
      },

      // Дополнительные ограничения для чётких линий
      lineWidthMinPixels: 0.5,
      lineWidthMaxPixels: 10,
    });
  }, [regionsData, config.color, config.width, config.opacity]);
};
EOF
echo "   ✅ src/shared/lib/hooks/useRegionLayer.ts (подсветка отключена)"

# 2. Исправленный хук useMapLayers.ts (убираем жёлтую подсветку с точек)
cat > src/shared/lib/hooks/useMapLayers.ts << 'EOF'
/**
 * Хук для слоя точек с отключённой подсветкой
 */

import { useMemo, useCallback } from 'react';
import { ScatterplotLayer } from '@deck.gl/layers';
import { DataFilterExtension } from '@deck.gl/extensions';
import type { Color } from '@deck.gl/core';
import { Location } from '../../../entities/location/lib/types';
import {
  getColorByDynamics,
  getColorByAbsoluteChange,
  getAbsoluteChange,
  getNeutralColor,
  hexToRgb
} from '../color/utils';

interface LayerSettings {
  selectedYear: '2002' | '2010' | '2021';
  powerCoefficient: number;
  radiusScale: number;
  minRadius: number;
  mode: 'dynamics' | 'absolute';
  dynamicsPeriod: '2002-2010' | '2010-2021' | '2002-2021';
  absolutePeriod: '2002-2010' | '2010-2021' | '2002-2021';
  strokeWidth: number;
  strokeColor: string;
  fillOpacity: number;
  populationMin: number;
  populationMax: number;
  dynamicsMin: number;
  dynamicsMax: number;
  showZeroPopulation: boolean;
}

export const useMapLayers = (
  data: Location[] | null,
  settings: LayerSettings,
  palette: string[]
) => {
  const strokeRgb = useMemo(() => {
    try {
      return hexToRgb(settings.strokeColor);
    } catch {
      return [0, 0, 0] as [number, number, number];
    }
  }, [settings.strokeColor]);

  const getFillColor = useCallback((d: Location): Color => {
    const pop2002 = d.population_2002;
    const pop2010 = d.population_2010;
    const pop2021 = d.population_2021;

    if (settings.mode === 'absolute') {
      const change = getAbsoluteChange(d, settings.absolutePeriod);
      return getColorByAbsoluteChange(change, palette, settings.fillOpacity) as Color;
    }

    if (settings.selectedYear === '2002') {
      return getNeutralColor(palette, settings.fillOpacity) as Color;
    }

    if (settings.selectedYear === '2010') {
      if (pop2002 === 0 || isNaN(pop2002) || !isFinite(pop2002)) {
        return getNeutralColor(palette, settings.fillOpacity) as Color;
      }
      const changePercent = ((pop2010 - pop2002) / pop2002) * 100;
      return getColorByDynamics(changePercent, palette, settings.fillOpacity) as Color;
    }

    if (settings.selectedYear === '2021') {
      if (settings.dynamicsPeriod === '2010-2021') {
        if (pop2010 === 0 || isNaN(pop2010) || !isFinite(pop2010)) {
          return getNeutralColor(palette, settings.fillOpacity) as Color;
        }
        const changePercent = ((pop2021 - pop2010) / pop2010) * 100;
        return getColorByDynamics(changePercent, palette, settings.fillOpacity) as Color;
      } else {
        if (pop2002 === 0 || isNaN(pop2002) || !isFinite(pop2002)) {
          return getNeutralColor(palette, settings.fillOpacity) as Color;
        }
        const changePercent = ((pop2021 - pop2002) / pop2002) * 100;
        return getColorByDynamics(changePercent, palette, settings.fillOpacity) as Color;
      }
    }

    return getNeutralColor(palette, settings.fillOpacity) as Color;
  }, [settings.selectedYear, settings.dynamicsPeriod, settings.mode, settings.absolutePeriod, palette, settings.fillOpacity]);

  const getRadius = useCallback((d: Location): number => {
    if (settings.mode === 'absolute') {
      const change = Math.abs(getAbsoluteChange(d, settings.absolutePeriod));
      if (change === 0 || isNaN(change) || !isFinite(change)) {
        return settings.minRadius;
      }
      return Math.pow(change, settings.powerCoefficient);
    }

    const pop = d[`population_${settings.selectedYear}`];
    if (pop === 0 || isNaN(pop) || !isFinite(pop)) {
      return settings.minRadius;
    }
    return Math.pow(pop, settings.powerCoefficient);
  }, [settings.selectedYear, settings.powerCoefficient, settings.mode, settings.absolutePeriod, settings.minRadius]);

  const getLineWidth = useCallback((_d: Location): number => {
    return settings.strokeWidth;
  }, [settings.strokeWidth]);

  const getFilterValue = useCallback((d: Location): [number, number] => {
    const pop = d[`population_${settings.selectedYear}`] || 0;

    let dynamicsPercent = 0;
    const pop2002 = d.population_2002;
    const pop2010 = d.population_2010;
    const pop2021 = d.population_2021;

    if (settings.mode === 'absolute') {
      if (settings.absolutePeriod === '2002-2010') {
        if (pop2002 > 0) dynamicsPercent = ((pop2010 - pop2002) / pop2002) * 100;
      } else if (settings.absolutePeriod === '2010-2021') {
        if (pop2010 > 0) dynamicsPercent = ((pop2021 - pop2010) / pop2010) * 100;
      } else {
        if (pop2002 > 0) dynamicsPercent = ((pop2021 - pop2002) / pop2002) * 100;
      }
    } else {
      if (settings.selectedYear === '2010') {
        if (pop2002 > 0) dynamicsPercent = ((pop2010 - pop2002) / pop2002) * 100;
      } else if (settings.selectedYear === '2021') {
        if (settings.dynamicsPeriod === '2010-2021') {
          if (pop2010 > 0) dynamicsPercent = ((pop2021 - pop2010) / pop2010) * 100;
        } else {
          if (pop2002 > 0) dynamicsPercent = ((pop2021 - pop2002) / pop2002) * 100;
        }
      }
    }

    return [pop, dynamicsPercent];
  }, [settings.selectedYear, settings.mode, settings.absolutePeriod, settings.dynamicsPeriod]);

  const filterRange: [number, number][] = useMemo(() => {
    const popMin = settings.populationMin > 0 ? settings.populationMin : -Infinity;
    const popMax = settings.populationMax > 0 ? settings.populationMax : Infinity;
    const effectivePopMin = settings.showZeroPopulation ? popMin : Math.max(popMin, 0.1);

    return [
      [effectivePopMin, popMax],
      [settings.dynamicsMin, settings.dynamicsMax]
    ];
  }, [settings.populationMin, settings.populationMax, settings.dynamicsMin, settings.dynamicsMax, settings.showZeroPopulation]);

  const filterExtension = useMemo(() => new DataFilterExtension({ filterSize: 2 }), []);

  const layer = useMemo(() => {
    if (!data || data.length === 0) return null;

    return new ScatterplotLayer<Location>({
      id: 'locations-layer',
      data,
      getPosition: (d: Location) => [d.longitude, d.latitude],
      getFillColor,
      getRadius,
      stroked: settings.strokeWidth > 0,
      getLineColor: [...strokeRgb, 255] as Color,
      getLineWidth,
      radiusScale: settings.radiusScale,
      lineWidthUnits: 'pixels',
      lineWidthScale: 1,
      lineWidthMinPixels: settings.strokeWidth > 0 ? 0.5 : 0,
      lineWidthMaxPixels: 10,
      radiusMinPixels: settings.minRadius,
      extensions: [filterExtension],
      getFilterValue,
      filterRange,
      
      // ОТКЛЮЧАЕМ ПОДСВЕТКУ
      pickable: true,             // Оставляем для тултипов
      autoHighlight: false,       // Убираем жёлтое свечение
      highlightColor: [0, 0, 0, 0], // Прозрачный цвет
      
      // Правильная реактивность
      updateTriggers: {
        getFillColor: [settings.selectedYear, settings.dynamicsPeriod, settings.mode, settings.absolutePeriod, palette, settings.fillOpacity],
        getRadius: [settings.selectedYear, settings.powerCoefficient, settings.mode, settings.absolutePeriod, settings.minRadius],
        stroked: [settings.strokeWidth],
        getLineColor: [settings.strokeColor],
        getLineWidth: [settings.strokeWidth],
        getFilterValue: [settings.selectedYear, settings.mode, settings.absolutePeriod, settings.dynamicsPeriod],
        filterRange: [settings.populationMin, settings.populationMax, settings.dynamicsMin, settings.dynamicsMax, settings.showZeroPopulation],
      },
      parameters: {
        depthWriteEnabled: false,
        depthCompare: 'always'
      } as const,
    });
  }, [data, getFillColor, getRadius, getLineWidth, settings.radiusScale, settings.minRadius, settings.strokeWidth, settings.strokeColor, strokeRgb, filterExtension, getFilterValue, filterRange]);

  return useMemo(() => (layer ? [layer] : []), [layer]);
};
EOF
echo "   ✅ src/shared/lib/hooks/useMapLayers.ts (подсветка точек отключена)"

# 3. Исправленный MapWidget.tsx (с адаптивностью через ResizeObserver)
cat > src/widgets/Map/ui/MapWidget.tsx << 'EOF'
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
EOF
echo "   ✅ src/widgets/Map/ui/MapWidget.tsx (полная адаптивность)"

echo ""
echo "✅ Все исправления успешно применены!"
echo ""
echo "📌 ЧТО БЫЛО ИСПРАВЛЕНО:"
echo "   1. Жёлтые обводки при наведении - отключены через autoHighlight: false"
echo "   2. Настройки границ теперь работают - добавлены updateTriggers"
echo "   3. Карта полностью адаптивна - ResizeObserver + window resize + throttle"
echo "   4. Толщина границ в пикселях - не зависит от зума (lineWidthUnits: 'pixels')"
echo ""
echo "🚀 Запустите проект: pnpm dev"