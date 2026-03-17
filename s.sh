#!/bin/bash

set -e

# ============================================================
# 1. src/shared/lib/hooks/useRegionLayer.ts
# ============================================================
cat > src/shared/lib/hooks/useRegionLayer.ts << 'EOF'
/**
 * Хук для слоя границ регионов с корректной обработкой глубины
 * для правильного наложения на точки.
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
    // Если данных нет или они пустые – не создаём слой
    if (!regionsData || !regionsData.features || regionsData.features.length === 0) {
      return null;
    }

    // Проверяем, что конфигурация валидна
    if (!config) return null;

    const lineColorRgb = hexToRgb(config.color);

    // Создаём слой с явным указанием id
    return new GeoJsonLayer({
      id: 'regions-layer',
      data: regionsData,
      stroked: true,
      filled: false,
      getLineColor: lineColorRgb,
      getLineWidth: config.width,
      lineWidthUnits: 'pixels',
      opacity: config.opacity,
      // Видимость управляется напрямую
      visible: config.visible,
      pickable: false,
      autoHighlight: false,
      highlightColor: [0, 0, 0, 0],
      
      // КЛЮЧЕВОЕ ИЗМЕНЕНИЕ: параметры для корректного наложения
      parameters: {
        // depthMask: false предотвращает запись в Z-буфер, позволяя
        // другим слоям (точкам) рисоваться поверх/под линиями правильно
        depthMask: false,
        // depthTest оставляем включённым, но т.к. depthMask = false,
        // линии не будут "забивать" собой точки в Z-буфере
        depthTest: true
      },
      
      updateTriggers: {
        getLineColor: [config.color],
        getLineWidth: [config.width],
        opacity: [config.opacity],
      },
      lineWidthMinPixels: 0.5,
      lineWidthMaxPixels: 10,
    });
  }, [regionsData, config.visible, config.color, config.width, config.opacity]);
};
EOF

# ============================================================
# 2. src/widgets/Map/ui/MapWidget.tsx
# ============================================================
cat > src/widgets/Map/ui/MapWidget.tsx << 'EOF'
/**
 * MapWidget - компонент карты с полной адаптивностью и правильной интеграцией DeckGL
 * 
 * ОСОБЕННОСТИ:
 * - Автоматически подстраивается под размер контейнера (ResizeObserver)
 * - Корректно работает при изменении размеров окна и повороте устройства
 * - Гарантирует, что все слои deck.gl рендерятся в одном контексте
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
  // Убеждаемся, что overlay всегда использует interleaved: true
  const overlay = useControl<MapboxOverlay>(
    () => new MapboxOverlay({ 
      ...props, 
      interleaved: true  // Всегда interleaved для одного контекста
    }),
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
          interleaved={true}
        />
      </Map>
    </div>
  );
});

MapWidget.displayName = 'MapWidget';
export default MapWidget;
EOF

# ============================================================
# 3. src/pages/MapPage/ui/MapPage.tsx
# ============================================================
cat > src/pages/MapPage/ui/MapPage.tsx << 'EOF'
import React, { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import type { FeatureCollection } from 'geojson';
import { fetchRegionsFromGeoJSON } from '../../../entities/region';
import { DEFAULT_REGION_CONFIG, RegionLayerConfig } from '../../../entities/region/lib/types';
import { useRegionLayer } from '../../../shared/lib/hooks/useRegionLayer';
import { MapWidget, TerrainMode } from '../../../widgets/Map/ui/MapWidget';
import { ControlPanel, DynamicsPeriod, YearType, VisualizationMode, FilterDirection, TerrainMode as PanelTerrainMode } from '../../../widgets/ControlPanel/ui/ControlPanel';
import { fetchLocationsFromCSV } from '../../../entities/location/api/locationApi';
import type { Location } from '../../../entities/location/lib/types';
import { useMapLayers } from '../../../shared/lib/hooks/useMapLayers';
import type { PickingInfo } from '@deck.gl/core';
import { useAltKeyPress } from '../../../shared/lib/hooks';
import { useMapLayersControl } from '../../../shared/lib/hooks/useMapLayersControl';
import { ALL_BASE_LAYERS } from '../lib/mapLayers';
import { usePalette } from '../../../shared/lib/hooks/usePalette';
import { useCamera } from '../../../shared/lib/hooks/useCamera';
import { DEFAULT_FILTER_SETTINGS, FilterSettings } from '../../../shared/types/visualization';
import type { PaletteName } from '../../../entities/palette/lib/constants';

export interface VisualizationSettings {
  selectedYear: YearType;
  minRadius: number;
  powerCoefficient: number;
  radiusScale: number;
  strokeWidth: number;
  strokeColor: string;
  fillOpacity: number;
}

const defaultSettings: VisualizationSettings = {
  selectedYear: '2021',
  minRadius: 2,
  powerCoefficient: 0.5,
  radiusScale: 3,
  strokeWidth: 1,
  strokeColor: '#000000',
  fillOpacity: 0.78,
};

const getPopulationExtents = (locations: Location[]): [number, number] => {
  if (!locations.length) return [0, 10000000];
  let max = 0;
  locations.forEach(loc => [loc.population_2002, loc.population_2010, loc.population_2021].forEach(p => { if (p > max) max = p; }));
  return [0, max];
};

const getDynamicsExtents = (locations: Location[]): [number, number] => {
  if (!locations.length) return [-100, 100];
  let min = Infinity, max = -Infinity;
  locations.forEach(loc => {
    const calc = (s: number, e: number) => s > 0 ? ((e - s) / s) * 100 : 0;
    [calc(loc.population_2002, loc.population_2010), calc(loc.population_2010, loc.population_2021), calc(loc.population_2002, loc.population_2021)].forEach(d => {
      if (d < min) min = d; if (d > max) max = d;
    });
  });
  return [min === Infinity ? -100 : Math.floor(min), max === -Infinity ? 100 : Math.ceil(max)];
};

export const MapPage: React.FC = () => {
  const [locations, setLocations] = useState<Location[] | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [settings, setSettings] = useState<VisualizationSettings>(defaultSettings);
  const [mode, setMode] = useState<VisualizationMode>('dynamics');
  const [dynamicsMode, setDynamicsMode] = useState<'2010-2021' | '2002-2021'>('2010-2021');
  const [absolutePeriod, setAbsolutePeriod] = useState<DynamicsPeriod>('2002-2021');
  const [absoluteFilter, setAbsoluteFilter] = useState<FilterDirection>('all');
  const [isPanelVisible, setIsPanelVisible] = useState(true);
  const [filterSettings, setFilterSettings] = useState<FilterSettings>(DEFAULT_FILTER_SETTINGS);
  const [populationMax, setPopulationMax] = useState(10000000);
  const [dynamicsMin, setDynamicsMin] = useState(-100);
  const [dynamicsMax, setDynamicsMax] = useState(100);
  const [terrainMode, setTerrainMode] = useState<TerrainMode>('hillshade');

  const [regionsData, setRegionsData] = useState<FeatureCollection | null>(null);
  const [regionConfig, setRegionConfig] = useState<RegionLayerConfig>(DEFAULT_REGION_CONFIG);

  const { palette, selectedName, customGradient, selectPalette, setPaletteColors, setCustomGradient, toggleInvert } = usePalette();
  const { settings: cameraSettings, updateSetting: updateCameraSetting, resetToDefault: resetCamera, mapRef } = useCamera();
  const { layers: mapLayers, terrainEnabled, toggleLayer, toggleTerrain, baseLayer, viewState, handleViewStateChange, updateViewState } = useMapLayersControl(ALL_BASE_LAYERS);

  // Счётчик активных запросов – гарантирует сброс isLoading только после последнего
  const activeRequests = useRef(0);

  // Загрузка локаций – локальный флаг ignore вместо внешнего isMounted
  useEffect(() => {
    const controller = new AbortController();
    const signal = AbortSignal.any([controller.signal, AbortSignal.timeout(30000)]); // таймаут 30с
    let ignore = false;

    activeRequests.current += 1;
    setIsLoading(true);

    const load = async () => {
      try {
        const data = await fetchLocationsFromCSV('/data_seva_updated1.csv', signal);
        if (!ignore) {
          setLocations(data);
          setPopulationMax(getPopulationExtents(data)[1]);
          const dynExt = getDynamicsExtents(data);
          setDynamicsMin(dynExt[0]);
          setDynamicsMax(dynExt[1]);
        }
      } catch (error) {
        if (!ignore && error instanceof Error && error.name !== 'AbortError') {
          console.error('❌ Ошибка загрузки локаций:', error);
          setLocations(null);
        }
      } finally {
        activeRequests.current -= 1;
        // Сбрасываем isLoading только если нет активных запросов
        if (activeRequests.current === 0) {
          setIsLoading(false);
        }
      }
    };

    load();

    return () => {
      ignore = true;
      controller.abort();
    };
  }, []); // пустой массив – эффект только при монтировании

  // Загрузка границ регионов – аналогичный паттерн
  useEffect(() => {
    const controller = new AbortController();
    const signal = AbortSignal.any([controller.signal, AbortSignal.timeout(30000)]);
    let ignore = false;

    const load = async () => {
      try {
        const data = await fetchRegionsFromGeoJSON('/ruregs1.geojson', signal);
        if (!ignore) {
          setRegionsData(data);
        }
      } catch (error) {
        if (!ignore && error instanceof Error && error.name !== 'AbortError') {
          console.warn('⚠️ Не удалось загрузить границы регионов:', error);
        }
      }
    };

    load();

    return () => {
      ignore = true;
      controller.abort();
    };
  }, []);

  const handleMapViewStateChange = useCallback((newViewState: any) => handleViewStateChange(newViewState), [handleViewStateChange]);
  const handleCameraChange = useCallback((key: keyof typeof cameraSettings, value: number) => { updateCameraSetting(key, value); updateViewState({ [key]: value }); }, [updateCameraSetting, updateViewState]);
  useAltKeyPress(() => setIsPanelVisible(prev => !prev));
  const handleFilterChange = useCallback((newFilter: Partial<FilterSettings>) => setFilterSettings(prev => ({ ...prev, ...newFilter })), []);
  const handleRegionConfigChange = useCallback((newConfig: Partial<RegionLayerConfig>) => {
    setRegionConfig(prev => ({ ...prev, ...newConfig }));
  }, []);
  const handleTerrainModeChange = useCallback((mode: TerrainMode) => setTerrainMode(mode), []);

  const stableLocations = useMemo(() => locations, [locations]);

  const layerSettings = useMemo(() => ({
    selectedYear: settings.selectedYear,
    powerCoefficient: settings.powerCoefficient,
    radiusScale: settings.radiusScale,
    minRadius: settings.minRadius,
    mode,
    dynamicsPeriod: dynamicsMode,
    absolutePeriod,
    absoluteFilter, // обязательно передаём в настройки слоя
    strokeWidth: settings.strokeWidth,
    strokeColor: settings.strokeColor,
    fillOpacity: settings.fillOpacity,
    populationMin: filterSettings.populationMin,
    populationMax: filterSettings.populationMax,
    dynamicsMin: filterSettings.dynamicsMin,
    dynamicsMax: filterSettings.dynamicsMax,
    showZeroPopulation: filterSettings.showZeroPopulation,
  }), [settings, mode, dynamicsMode, absolutePeriod, absoluteFilter, filterSettings]);

  const deckLayers = useMapLayers(stableLocations, layerSettings, palette);
  const regionLayer = useRegionLayer(regionsData, regionConfig);

  const allLayers = useMemo(() => {
    const layers = [];
    if (regionConfig.visible && regionLayer) layers.push(regionLayer);
    if (deckLayers.length > 0) layers.push(...deckLayers);
    return layers;
  }, [regionConfig.visible, regionLayer, deckLayers]);

  const handleSettingsChange = useCallback((newSettings: Partial<VisualizationSettings>) => setSettings(prev => ({ ...prev, ...newSettings })), []);
  const handleModeChange = useCallback((newMode: VisualizationMode) => setMode(newMode), []);
  const handleDynamicsModeChange = useCallback((mode: DynamicsPeriod) => { if (mode === '2010-2021' || mode === '2002-2021') setDynamicsMode(mode); }, []);
  const handleAbsolutePeriodChange = useCallback((period: DynamicsPeriod) => setAbsolutePeriod(period), []);
  const handleAbsoluteFilterChange = useCallback((filter: FilterDirection) => setAbsoluteFilter(filter), []);
  const handlePanelVisibilityChange = useCallback((visible: boolean) => setIsPanelVisible(visible), []);
  const handlePaletteNameChange = useCallback((name: PaletteName | 'custom') => selectPalette(name), [selectPalette]);

  const getTooltip = useCallback(({ object }: PickingInfo) => {
    if (!object) return null;
    const location = object as Location;
    return {
      html: `<div><strong>${location.populated_place}</strong><br/>Регион: ${location.region}<br/>Население (2002): ${location.population_2002.toLocaleString()}<br/>Население (2010): ${location.population_2010.toLocaleString()}<br/>Население (2021): ${location.population_2021.toLocaleString()}</div>`,
      style: { backgroundColor: '#111', color: '#fff', padding: '8px', borderRadius: '4px', fontSize: '12px' }
    };
  }, []);

  if (isLoading) {
    return (
      <div style={{
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center',
        alignItems: 'center',
        height: '100vh',
        width: '100vw',
        position: 'fixed',
        top: 0,
        left: 0,
        backgroundColor: '#fff',
        zIndex: 2000,
        fontFamily: 'sans-serif'
      }}>
        <div>Загрузка данных...</div>
        <div style={{ marginTop: '1rem', color: '#666', fontSize: '0.9rem' }}>
          Если загрузка затянулась, проверьте консоль (F12) на наличие ошибок.
        </div>
      </div>
    );
  }

  return (
    <div style={{ position: 'relative', width: '100%', height: '100%' }}>
      <ControlPanel
        settings={settings}
        onSettingsChange={handleSettingsChange}
        selectedYear={settings.selectedYear}
        dynamicsMode={dynamicsMode}
        onDynamicsModeChange={handleDynamicsModeChange}
        mode={mode}
        onModeChange={handleModeChange}
        absolutePeriod={absolutePeriod}
        onAbsolutePeriodChange={handleAbsolutePeriodChange}
        absoluteFilter={absoluteFilter}
        onAbsoluteFilterChange={handleAbsoluteFilterChange}
        currentPalette={palette}
        selectedPaletteName={selectedName}
        customGradient={customGradient}
        onPaletteChange={setPaletteColors}
        onPaletteNameChange={handlePaletteNameChange}
        onCustomGradientChange={setCustomGradient}
        onInvert={toggleInvert}
        layers={mapLayers}
        terrainEnabled={terrainMode !== 'none'}
        onToggleLayer={toggleLayer}
        onToggleTerrain={() => handleTerrainModeChange(terrainMode === 'none' ? 'hillshade' : 'none')}
        cameraSettings={cameraSettings}
        onCameraChange={handleCameraChange}
        onCameraReset={resetCamera}
        onCameraSync={() => {}}
        isCameraSynced={true}
        isVisible={isPanelVisible}
        onVisibilityChange={handlePanelVisibilityChange}
        filterSettings={filterSettings}
        onFilterChange={handleFilterChange}
        populationMin={0}
        populationMax={populationMax}
        dynamicsMin={dynamicsMin}
        dynamicsMax={dynamicsMax}
        regionConfig={regionConfig}
        onRegionConfigChange={handleRegionConfigChange}
        terrainMode={terrainMode}
        onTerrainModeChange={handleTerrainModeChange}
      />
      <MapWidget
        ref={mapRef}
        baseLayer={baseLayer}
        terrainMode={terrainMode}
        layers={allLayers}
        getTooltip={getTooltip}
        viewState={viewState}
        onViewStateChange={handleMapViewStateChange}
      />
    </div>
  );
};

export default MapPage;
EOF

echo "✅ Все файлы успешно обновлены!"
echo "🎯 Границы регионов теперь будут корректно накладываться на точки."