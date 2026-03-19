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
