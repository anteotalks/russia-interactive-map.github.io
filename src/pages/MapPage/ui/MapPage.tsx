import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { MapWidget, TerrainMode } from '../../../widgets/Map/ui/MapWidget';
import { ControlPanel, DynamicsPeriod, YearType, VisualizationMode, FilterDirection, TerrainMode as PanelTerrainMode } from '../../../widgets/ControlPanel/ui/ControlPanel';
import { fetchLocationsFromCSV } from '../../../entities/location/api/locationApi';
import type { Location } from '../../../entities/location/lib/types';
import { useMapLayers } from '../lib/useMapLayers';
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

  const { palette, selectedName, customGradient, selectPalette, setPaletteColors, setCustomGradient, toggleInvert } = usePalette();
  const { settings: cameraSettings, updateSetting: updateCameraSetting, resetToDefault: resetCamera, mapRef } = useCamera();
  const { layers: mapLayers, terrainEnabled, toggleLayer, toggleTerrain, baseLayer, viewState, handleViewStateChange, updateViewState } = useMapLayersControl(ALL_BASE_LAYERS);

  useEffect(() => {
    const loadData = async () => {
      setIsLoading(true);
      try {
        const data = await fetchLocationsFromCSV('/data_seva_updated1.csv');
        setLocations(data);
        setPopulationMax(getPopulationExtents(data)[1]);
        const dynExt = getDynamicsExtents(data);
        setDynamicsMin(dynExt[0]); setDynamicsMax(dynExt[1]);
      } catch (error) { console.error('Failed to load locations:', error); } finally { setIsLoading(false); }
    };
    loadData();
  }, []);

  const handleMapViewStateChange = useCallback((newViewState: any) => handleViewStateChange(newViewState), [handleViewStateChange]);
  const handleCameraChange = useCallback((key: keyof typeof cameraSettings, value: number) => { updateCameraSetting(key, value); updateViewState({ [key]: value }); }, [updateCameraSetting, updateViewState]);
  useAltKeyPress(() => setIsPanelVisible(prev => !prev));
  const handleFilterChange = useCallback((newFilter: Partial<FilterSettings>) => setFilterSettings(prev => ({ ...prev, ...newFilter })), []);
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
    strokeWidth: settings.strokeWidth,
    strokeColor: settings.strokeColor,
    fillOpacity: settings.fillOpacity,
    populationMin: filterSettings.populationMin,
    populationMax: filterSettings.populationMax,
    dynamicsMin: filterSettings.dynamicsMin,
    dynamicsMax: filterSettings.dynamicsMax,
    showZeroPopulation: filterSettings.showZeroPopulation,
  }), [settings, mode, dynamicsMode, absolutePeriod, filterSettings]);

  const deckLayers = useMapLayers(stableLocations, layerSettings, palette);

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
    return { html: `<div><strong>${location.populated_place}</strong><br/>Регион: ${location.region}<br/>Население (2002): ${location.population_2002.toLocaleString()}<br/>Население (2010): ${location.population_2010.toLocaleString()}<br/>Население (2021): ${location.population_2021.toLocaleString()}</div>`, style: { backgroundColor: '#111', color: '#fff', padding: '8px', borderRadius: '4px', fontSize: '12px' } };
  }, []);

  if (isLoading) {
    return <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh', width: '100vw', position: 'fixed', top: 0, left: 0, backgroundColor: '#fff', zIndex: 2000 }}>Загрузка данных...</div>;
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
        terrainMode={terrainMode}
        onTerrainModeChange={handleTerrainModeChange}
      />
      <MapWidget
        ref={mapRef}
        baseLayer={baseLayer}
        terrainMode={terrainMode}
        layers={deckLayers}
        getTooltip={getTooltip}
        viewState={viewState}
        onViewStateChange={handleMapViewStateChange}
      />
    </div>
  );
};

export default MapPage;
