#!/bin/bash

# ПОЛНОЕ ВОССТАНОВЛЕНИЕ ВСЕХ ФАЙЛОВ ДЛЯ ГРАНИЦ ИЗ ТВОЕГО ПРИМЕРА

set -e

echo "🔧 ВОССТАНАВЛИВАЕМ ВСЕ ФАЙЛЫ ДЛЯ ГРАНИЦ..."

# 1. useRegionLayer (уже есть, но перезапишем для гарантии)
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
    if (!regionsData || !regionsData.features || regionsData.features.length === 0) {
      return null;
    }

    if (!config) return null;

    const lineColorRgb = hexToRgb(config.color);

    return new GeoJsonLayer({
      id: 'regions-layer',
      data: regionsData,
      stroked: true,
      filled: false,
      getLineColor: lineColorRgb,
      getLineWidth: config.width,
      lineWidthUnits: 'pixels',
      opacity: config.opacity,
      visible: config.visible,
      pickable: false,
      autoHighlight: false,
      highlightColor: [0, 0, 0, 0],
      
      parameters: {
        depthMask: false,
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

# 2. useMapLayers (основной слой точек)
cat > src/shared/lib/hooks/useMapLayers.ts << 'EOF'
/**
 * Хук для слоя точек с фильтрацией по населению, динамике и регионам
 * Использует DataFilterExtension с filterSize: 3
 * Третье измерение – индекс региона для фильтрации по выбранным регионам
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
import { FilterDirection } from '../../../shared/types/visualization';

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
  absoluteFilter: FilterDirection;
  selectedRegionIndices: Set<number> | null;
  onClick?: (info: any) => void;
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

  const regionToIndexMap = useMemo(() => {
    if (!data) return new Map<string, number>();
    const uniqueRegions = Array.from(new Set(data.map(loc => loc.region))).sort();
    return new Map(uniqueRegions.map((region, index) => [region, index]));
  }, [data]);

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

  const getFilterValue = useCallback((d: Location): [number, number, number] => {
    const pop = d[`population_${settings.selectedYear}`] || 0;
    const regionIndex = regionToIndexMap.get(d.region) ?? -1;

    let dynamicsPercent = 0;
    const pop2002 = d.population_2002;
    const pop2010 = d.population_2010;
    const pop2021 = d.population_2021;

    if (settings.mode === 'absolute') {
      let change = 0;
      if (settings.absolutePeriod === '2002-2010') {
        if (pop2002 > 0) change = pop2010 - pop2002;
      } else if (settings.absolutePeriod === '2010-2021') {
        if (pop2010 > 0) change = pop2021 - pop2010;
      } else {
        if (pop2002 > 0) change = pop2021 - pop2002;
      }
      dynamicsPercent = pop2002 > 0 ? (change / pop2002) * 100 : 0;
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

    return [pop, dynamicsPercent, regionIndex];
  }, [settings.selectedYear, settings.mode, settings.absolutePeriod, settings.dynamicsPeriod, regionToIndexMap]);

  const filterRange = useMemo((): [number, number][] => {
    const popMin = settings.populationMin > 0 ? settings.populationMin : -Infinity;
    const popMax = settings.populationMax > 0 ? settings.populationMax : Infinity;
    const effectivePopMin = settings.showZeroPopulation ? popMin : Math.max(popMin, 0.1);

    let dynMin = settings.dynamicsMin;
    let dynMax = settings.dynamicsMax;

    if (settings.mode === 'absolute') {
      if (settings.absoluteFilter === 'growth') {
        dynMin = 0.001;
        dynMax = Infinity;
      } else if (settings.absoluteFilter === 'decline') {
        dynMin = -Infinity;
        dynMax = -0.001;
      }
    }

    let regionMin = -Infinity;
    let regionMax = Infinity;

    if (settings.selectedRegionIndices && settings.selectedRegionIndices.size > 0) {
      const indicesArray = Array.from(settings.selectedRegionIndices);
      if (indicesArray.length > 0) {
        regionMin = Math.min(...indicesArray);
        regionMax = Math.max(...indicesArray);
      } else {
        regionMin = -Infinity;
        regionMax = Infinity;
      }
    }

    return [
      [effectivePopMin, popMax],
      [dynMin, dynMax],
      [regionMin, regionMax]
    ];
  }, [
    settings.populationMin, settings.populationMax, settings.showZeroPopulation,
    settings.dynamicsMin, settings.dynamicsMax,
    settings.mode, settings.absoluteFilter,
    settings.selectedRegionIndices
  ]);

  const filterExtension = useMemo(() => new DataFilterExtension({ filterSize: 3 }), []);

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
      pickable: true,
      autoHighlight: false,
      highlightColor: [0, 0, 0, 0],
      onClick: settings.onClick,
      updateTriggers: {
        getFillColor: [settings.selectedYear, settings.dynamicsPeriod, settings.mode, settings.absolutePeriod, palette, settings.fillOpacity],
        getRadius: [settings.selectedYear, settings.powerCoefficient, settings.mode, settings.absolutePeriod, settings.minRadius],
        stroked: [settings.strokeWidth],
        getLineColor: [settings.strokeColor],
        getLineWidth: [settings.strokeWidth],
        getFilterValue: [settings.selectedYear, settings.mode, settings.absolutePeriod, settings.dynamicsPeriod, regionToIndexMap],
        filterRange: [
          settings.populationMin, settings.populationMax, settings.showZeroPopulation,
          settings.dynamicsMin, settings.dynamicsMax,
          settings.mode, settings.absoluteFilter,
          settings.selectedRegionIndices
        ],
        onClick: [settings.onClick],
      },
      parameters: {
        depthWriteEnabled: false,
        depthCompare: 'always'
      } as const,
    });
  }, [
    data, getFillColor, getRadius, getLineWidth,
    settings.radiusScale, settings.minRadius,
    settings.strokeWidth, settings.strokeColor, strokeRgb,
    filterExtension, getFilterValue, filterRange,
    settings.selectedYear, settings.dynamicsPeriod, settings.mode, settings.absolutePeriod,
    settings.powerCoefficient, palette, settings.fillOpacity,
    settings.populationMin, settings.populationMax, settings.showZeroPopulation,
    settings.dynamicsMin, settings.dynamicsMax,
    settings.absoluteFilter,
    settings.selectedRegionIndices,
    regionToIndexMap,
    settings.onClick,
  ]);

  return useMemo(() => (layer ? [layer] : []), [layer]);
};
EOF

# 3. MapPage (самый важный - там правильное объединение слоёв)
cat > src/pages/MapPage/ui/MapPage.tsx << 'EOF'
import React, { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import type { FeatureCollection } from 'geojson';
import { FlyToInterpolator } from '@deck.gl/core';
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
import { DEFAULT_FILTER_SETTINGS, FilterSettings, SelectedRegions } from '../../../shared/types/visualization';
import type { PaletteName } from '../../../entities/palette/lib/constants';
import { AppSettings, DEFAULT_SETTINGS } from '../../../shared/types/settings';
import Watermark from '../../../shared/ui/Watermark';
import Dashboard, { DashboardData } from '../../../shared/ui/Dashboard';

export interface VisualizationSettings {
  selectedYear: YearType;
  minRadius: number;
  powerCoefficient: number;
  radiusScale: number;
  strokeWidth: number;
  strokeColor: string;
  fillOpacity: number;
}

const STORAGE_KEY = 'map_app_settings';

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

const calculateBoundsForRegions = (
  regions: Set<string>,
  locations: Location[] | null
): { minLat: number; maxLat: number; minLon: number; maxLon: number } | null => {
  if (!locations || regions.size === 0) return null;

  let minLat = 90, maxLat = -90, minLon = 180, maxLon = -180;
  let found = false;

  locations.forEach(loc => {
    if (regions.has(loc.region)) {
      minLat = Math.min(minLat, loc.latitude);
      maxLat = Math.max(maxLat, loc.latitude);
      minLon = Math.min(minLon, loc.longitude);
      maxLon = Math.max(maxLon, loc.longitude);
      found = true;
    }
  });

  if (!found) return null;
  return { minLat, maxLat, minLon, maxLon };
};

export const MapPage: React.FC = () => {
  const [locations, setLocations] = useState<Location[] | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  
  const loadSavedSettings = useCallback((): AppSettings => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved) as AppSettings;
        if (parsed.version === DEFAULT_SETTINGS.version) {
          return parsed;
        }
      }
    } catch (error) {
      console.error('Ошибка загрузки настроек из localStorage:', error);
    }
    return DEFAULT_SETTINGS;
  }, []);

  const [settings, setSettings] = useState<VisualizationSettings>(() => 
    loadSavedSettings().visualization
  );
  const [mode, setMode] = useState<VisualizationMode>(() => 
    loadSavedSettings().mode
  );
  const [dynamicsMode, setDynamicsMode] = useState<'2010-2021' | '2002-2021'>(() => 
    loadSavedSettings().dynamicsMode as '2010-2021' | '2002-2021'
  );
  const [absolutePeriod, setAbsolutePeriod] = useState<DynamicsPeriod>(() => 
    loadSavedSettings().absolutePeriod
  );
  const [absoluteFilter, setAbsoluteFilter] = useState<FilterDirection>(() => 
    loadSavedSettings().absoluteFilter
  );
  const [isPanelVisible, setIsPanelVisible] = useState(() => 
    loadSavedSettings().panelVisible
  );
  const [filterSettings, setFilterSettings] = useState<FilterSettings>(() => 
    loadSavedSettings().filterSettings
  );
  const [terrainMode, setTerrainMode] = useState<TerrainMode>(() => 
    loadSavedSettings().terrainMode
  );
  const [regionConfig, setRegionConfig] = useState<RegionLayerConfig>(() => 
    loadSavedSettings().regionConfig
  );
  const [selectedRegions, setSelectedRegions] = useState<SelectedRegions>(() => 
    new Set(loadSavedSettings().selectedRegions)
  );

  const [dashboardData, setDashboardData] = useState<DashboardData | null>(null);
  const [dashboardOpen, setDashboardOpen] = useState(false);

  const { palette, selectedName, customGradient, selectPalette, setPaletteColors, setCustomGradient, toggleInvert } = usePalette();
  
  useEffect(() => {
    const saved = loadSavedSettings();
    if (saved.paletteName !== 'custom') {
      selectPalette(saved.paletteName);
    }
  }, []);

  const { settings: cameraSettings, updateSetting: updateCameraSetting, resetToDefault: resetCamera, mapRef } = useCamera(() => 
    loadSavedSettings().camera
  );
  
  const { layers: mapLayers, terrainEnabled, toggleLayer, toggleTerrain, baseLayer, viewState, handleViewStateChange, updateViewState } = 
    useMapLayersControl(ALL_BASE_LAYERS);

  useEffect(() => {
    const saved = loadSavedSettings();
    const savedLayer = ALL_BASE_LAYERS.find(l => l.id === saved.visibleBaseLayer);
    if (savedLayer && !savedLayer.visible) {
      toggleLayer(savedLayer.id);
    }
  }, []);

  const [populationMax, setPopulationMax] = useState(10000000);
  const [dynamicsMin, setDynamicsMin] = useState(-100);
  const [dynamicsMax, setDynamicsMax] = useState(100);

  const activeRequests = useRef(0);
  const [regionsData, setRegionsData] = useState<FeatureCollection | null>(null);

  useEffect(() => {
    const controller = new AbortController();
    const signal = AbortSignal.any([controller.signal, AbortSignal.timeout(30000)]);
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
  }, []);

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
  const handleCameraChange = useCallback((key: keyof typeof cameraSettings, value: number) => { 
    updateCameraSetting(key, value); 
    updateViewState({ [key]: value }); 
  }, [updateCameraSetting, updateViewState]);
  
  useAltKeyPress(() => setIsPanelVisible(prev => !prev));
  
  const handleFilterChange = useCallback((newFilter: Partial<FilterSettings>) => 
    setFilterSettings(prev => ({ ...prev, ...newFilter })), []);
  
  const handleRegionConfigChange = useCallback((newConfig: Partial<RegionLayerConfig>) => {
    setRegionConfig(prev => ({ ...prev, ...newConfig }));
  }, []);
  
  const handleTerrainModeChange = useCallback((mode: TerrainMode) => setTerrainMode(mode), []);
  const handleRegionsSelectionChange = useCallback((newSelection: Set<string>) => {
    setSelectedRegions(newSelection);
  }, []);

  const handleCenterRegion = useCallback((region: string) => {
    const bounds = calculateBoundsForRegions(new Set([region]), locations);
    if (!bounds) return;

    const { minLat, maxLat, minLon, maxLon } = bounds;
    const centerLat = (minLat + maxLat) / 2;
    const centerLon = (minLon + maxLon) / 2;

    const latDiff = maxLat - minLat;
    const lonDiff = maxLon - minLon;
    const maxDiff = Math.max(latDiff, lonDiff);
    
    let zoom = 5;
    if (maxDiff > 20) zoom = 3;
    else if (maxDiff > 10) zoom = 4;
    else if (maxDiff > 5) zoom = 5;
    else if (maxDiff > 2) zoom = 6;
    else if (maxDiff > 1) zoom = 7;
    else if (maxDiff > 0.5) zoom = 8;
    else if (maxDiff > 0.2) zoom = 9;
    else zoom = 10;

    updateViewState({
      longitude: centerLon,
      latitude: centerLat,
      zoom,
      transitionInterpolator: new FlyToInterpolator({ speed: 1.5 }),
      transitionDuration: 2000,
    });
  }, [locations, updateViewState]);

  const handleCenterSelectedRegions = useCallback(() => {
    if (selectedRegions.size === 0) return;
    
    const bounds = calculateBoundsForRegions(selectedRegions, locations);
    if (!bounds) return;

    const { minLat, maxLat, minLon, maxLon } = bounds;
    const centerLat = (minLat + maxLat) / 2;
    const centerLon = (minLon + maxLon) / 2;

    const latDiff = maxLat - minLat;
    const lonDiff = maxLon - minLon;
    const maxDiff = Math.max(latDiff, lonDiff);
    
    let zoom = 5;
    if (maxDiff > 20) zoom = 3;
    else if (maxDiff > 10) zoom = 4;
    else if (maxDiff > 5) zoom = 5;
    else if (maxDiff > 2) zoom = 6;
    else if (maxDiff > 1) zoom = 7;
    else if (maxDiff > 0.5) zoom = 8;
    else if (maxDiff > 0.2) zoom = 9;
    else zoom = 10;

    updateViewState({
      longitude: centerLon,
      latitude: centerLat,
      zoom,
      transitionInterpolator: new FlyToInterpolator({ speed: 1.5 }),
      transitionDuration: 2000,
    });
  }, [selectedRegions, locations, updateViewState]);

  const stableLocations = useMemo(() => locations, [locations]);

  const filteredLocations = useMemo(() => {
    if (!stableLocations) return null;
    if (selectedRegions.size === 0) return stableLocations;
    return stableLocations.filter(loc => selectedRegions.has(loc.region));
  }, [stableLocations, selectedRegions]);

  const visibleLocations = filteredLocations;

  const handleLayerClick = useCallback((info: any) => {
    if (!info.object) return;
    const location = info.object as Location;
    setDashboardData({ type: 'point', location });
    setDashboardOpen(true);
  }, []);

  const layerSettings = useMemo(() => ({
    selectedYear: settings.selectedYear,
    powerCoefficient: settings.powerCoefficient,
    radiusScale: settings.radiusScale,
    minRadius: settings.minRadius,
    mode,
    dynamicsPeriod: dynamicsMode,
    absolutePeriod,
    absoluteFilter,
    strokeWidth: settings.strokeWidth,
    strokeColor: settings.strokeColor,
    fillOpacity: settings.fillOpacity,
    populationMin: filterSettings.populationMin,
    populationMax: filterSettings.populationMax,
    dynamicsMin: filterSettings.dynamicsMin,
    dynamicsMax: filterSettings.dynamicsMax,
    showZeroPopulation: filterSettings.showZeroPopulation,
    onClick: handleLayerClick,
    selectedRegionIndices: null,
  }), [settings, mode, dynamicsMode, absolutePeriod, absoluteFilter, filterSettings, handleLayerClick]);

  const deckLayers = useMapLayers(visibleLocations, layerSettings, palette);
  const regionLayer = useRegionLayer(regionsData, regionConfig);

  const allLayers = useMemo(() => {
    const layers = [];
    if (regionConfig.visible && regionLayer) layers.push(regionLayer);
    if (deckLayers.length > 0) layers.push(...deckLayers);
    return layers;
  }, [regionConfig.visible, regionLayer, deckLayers]);

  const handleSettingsChange = useCallback((newSettings: Partial<VisualizationSettings>) => 
    setSettings(prev => ({ ...prev, ...newSettings })), []);
  const handleModeChange = useCallback((newMode: VisualizationMode) => setMode(newMode), []);
  const handleDynamicsModeChange = useCallback((mode: DynamicsPeriod) => { 
    if (mode === '2010-2021' || mode === '2002-2021') setDynamicsMode(mode); 
  }, []);
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

  const regionList = useMemo(() => {
    if (!locations) return [];
    const uniqueRegions = new Set(locations.map(loc => loc.region));
    return Array.from(uniqueRegions).sort();
  }, [locations]);

  useEffect(() => {
    if (isLoading) return;

    const settingsToSave: AppSettings = {
      version: DEFAULT_SETTINGS.version,
      selectedYear: settings.selectedYear,
      mode,
      dynamicsMode,
      absolutePeriod,
      absoluteFilter,
      visualization: settings,
      paletteName: selectedName,
      customGradient,
      paletteInverted: false,
      filterSettings,
      regionConfig,
      selectedRegions: Array.from(selectedRegions),
      visibleBaseLayer: baseLayer.id,
      terrainMode,
      camera: cameraSettings,
      panelVisible: isPanelVisible,
    };

    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(settingsToSave));
    } catch (error) {
      console.error('Ошибка сохранения настроек в localStorage:', error);
    }
  }, [
    settings, mode, dynamicsMode, absolutePeriod, absoluteFilter,
    selectedName, customGradient, filterSettings, regionConfig,
    selectedRegions, baseLayer, terrainMode, cameraSettings, isPanelVisible,
    isLoading
  ]);

  const handleResetToDefault = useCallback(() => {
    if (window.confirm('Сбросить все настройки к значениям по умолчанию?')) {
      localStorage.removeItem(STORAGE_KEY);
      window.location.reload();
    }
  }, []);

  const handleSaveSettings = useCallback(() => {
    alert('Настройки сохранены');
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
      <Watermark />
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
        regions={regionList}
        selectedRegions={selectedRegions}
        onRegionsSelectionChange={handleRegionsSelectionChange}
        onCenterRegion={handleCenterRegion}
        onCenterSelectedRegions={handleCenterSelectedRegions}
        onSaveSettings={handleSaveSettings}
        onResetToDefault={handleResetToDefault}
        visiblePointsCount={visibleLocations?.length ?? 0}
        totalPointsCount={locations?.length ?? 0}
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
      <Dashboard
        open={dashboardOpen}
        data={dashboardData}
        onClose={() => setDashboardOpen(false)}
        selectedYear={settings.selectedYear}
        dynamicsPeriod={dynamicsMode}
        mode={mode}
        absolutePeriod={absolutePeriod}
      />
    </div>
  );
};

export default MapPage;
EOF

echo "✅ ВСЁ ВОССТАНОВЛЕНО!"
echo "🚀 Запусти: pnpm dev"