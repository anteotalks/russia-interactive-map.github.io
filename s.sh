#!/bin/bash
set -e

echo "📦 Устанавливаем recharts для графиков..."
pnpm add recharts

echo "🏗️ ВОССТАНАВЛИВАЕМ ДАШБОРДЫ (НЕ ТРОГАЯ ГРАНИЦЫ)..."

# 1. Создаём компонент Dashboard (не трогая useRegionLayer)
mkdir -p src/shared/ui/Dashboard

cat > src/shared/ui/Dashboard/Dashboard.tsx << 'EOF'
import React, { useState } from 'react';
import {
  Paper,
  Typography,
  Box,
  IconButton,
  Divider,
  Chip,
  Tabs,
  Tab,
  Grid,
  Card,
  CardContent,
  useTheme,
} from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip as RechartsTooltip,
  ResponsiveContainer,
} from 'recharts';
import { Location } from '../../../entities/location/lib/types';

export type DashboardType = 'point' | 'region' | 'selection';
export type PointDashboardData = { type: 'point'; location: Location };
export type RegionDashboardData = { type: 'region'; regionName: string; locations: Location[] };
export type SelectionDashboardData = { type: 'selection'; locations: Location[] };
export type DashboardData = PointDashboardData | RegionDashboardData | SelectionDashboardData;

interface DashboardProps {
  open: boolean;
  data: DashboardData | null;
  onClose: () => void;
  selectedYear: '2002' | '2010' | '2021';
  dynamicsPeriod: '2010-2021' | '2002-2021';
  mode: 'dynamics' | 'absolute';
  absolutePeriod: '2002-2010' | '2010-2021' | '2002-2021';
}

const calculateStats = (locations: Location[], selectedYear: '2002' | '2010' | '2021', dynamicsPeriod: '2010-2021' | '2002-2021') => {
  const count = locations.length;
  const pop2002 = locations.reduce((s, l) => s + l.population_2002, 0);
  const pop2010 = locations.reduce((s, l) => s + l.population_2010, 0);
  const pop2021 = locations.reduce((s, l) => s + l.population_2021, 0);

  const mean2002 = pop2002 / count;
  const mean2010 = pop2010 / count;
  const mean2021 = pop2021 / count;

  const sorted2002 = [...locations].sort((a,b) => a.population_2002 - b.population_2002);
  const median2002 = sorted2002[Math.floor(count/2)].population_2002;
  const sorted2010 = [...locations].sort((a,b) => a.population_2010 - b.population_2010);
  const median2010 = sorted2010[Math.floor(count/2)].population_2010;
  const sorted2021 = [...locations].sort((a,b) => a.population_2021 - b.population_2021);
  const median2021 = sorted2021[Math.floor(count/2)].population_2021;

  const dynamics = locations.map(l => {
    const p2002 = l.population_2002;
    const p2010 = l.population_2010;
    const p2021 = l.population_2021;
    if (selectedYear === '2002') return 0;
    if (selectedYear === '2010') return p2002 > 0 ? ((p2010 - p2002) / p2002) * 100 : 0;
    if (dynamicsPeriod === '2010-2021') return p2010 > 0 ? ((p2021 - p2010) / p2010) * 100 : 0;
    return p2002 > 0 ? ((p2021 - p2002) / p2002) * 100 : 0;
  });
  const minDynamics = Math.min(...dynamics);
  const maxDynamics = Math.max(...dynamics);
  const avgDynamics = dynamics.reduce((a,b) => a+b,0) / dynamics.length;

  const binCount = 10;
  const min = Math.min(...dynamics, -0.01);
  const max = Math.max(...dynamics, 0.01);
  const step = (max - min) / binCount;
  const bins = Array(binCount).fill(0);
  dynamics.forEach(v => {
    const idx = Math.floor((v - min) / step);
    if (idx >= 0 && idx < binCount) bins[idx] += 1;
    else if (v >= max) bins[binCount-1] += 1;
  });
  const histogramData = bins.map((c, i) => ({
    range: `${(min + i*step).toFixed(1)}–${(min + (i+1)*step).toFixed(1)}`,
    count: c,
  }));

  return {
    count,
    pop2002, pop2010, pop2021,
    mean2002, mean2010, mean2021,
    median2002, median2010, median2021,
    minDynamics, maxDynamics, avgDynamics,
    histogramData,
  };
};

export const Dashboard: React.FC<DashboardProps> = ({
  open, data, onClose, selectedYear, dynamicsPeriod, mode, absolutePeriod
}) => {
  const theme = useTheme();
  const [tabIndex, setTabIndex] = useState(0);
  if (!open || !data) return null;

  const renderPoint = (d: PointDashboardData) => {
    const loc = d.location;
    const popData = [
      { year: '2002', population: loc.population_2002 },
      { year: '2010', population: loc.population_2010 },
      { year: '2021', population: loc.population_2021 },
    ];
    return (
      <>
        <Typography variant="h5" gutterBottom>{loc.populated_place}</Typography>
        <Chip label={loc.region} size="small" sx={{ mb: 3 }} />
        <Typography variant="subtitle1" gutterBottom>Население по годам</Typography>
        <ResponsiveContainer width="100%" height={250}>
          <BarChart data={popData}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="year" />
            <YAxis />
            <RechartsTooltip />
            <Bar dataKey="population" fill={theme.palette.primary.main} />
          </BarChart>
        </ResponsiveContainer>
      </>
    );
  };

  const renderRegionOrSelection = (title: string, locs: Location[]) => {
    const stats = calculateStats(locs, selectedYear, dynamicsPeriod);
    const popData = [
      { year: '2002', population: stats.pop2002 },
      { year: '2010', population: stats.pop2010 },
      { year: '2021', population: stats.pop2021 },
    ];
    return (
      <>
        <Typography variant="h5" gutterBottom>{title}</Typography>
        <Typography variant="body2" color="text.secondary" gutterBottom>
          Населенных пунктов: {stats.count}
        </Typography>
        <Tabs value={tabIndex} onChange={(_,v) => setTabIndex(v)} sx={{ mb: 2 }}>
          <Tab label="Население" />
          <Tab label="Динамика" />
          <Tab label="Статистика" />
        </Tabs>
        {tabIndex === 0 && (
          <ResponsiveContainer width="100%" height={250}>
            <BarChart data={popData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="year" />
              <YAxis />
              <RechartsTooltip />
              <Bar dataKey="population" fill={theme.palette.primary.main} />
            </BarChart>
          </ResponsiveContainer>
        )}
        {tabIndex === 1 && (
          <>
            <Typography variant="subtitle2" gutterBottom>
              Мин: {stats.minDynamics.toFixed(1)}% | Макс: {stats.maxDynamics.toFixed(1)}% | Среднее: {stats.avgDynamics.toFixed(1)}%
            </Typography>
            <ResponsiveContainer width="100%" height={250}>
              <BarChart data={stats.histogramData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="range" angle={-45} textAnchor="end" height={70} interval={0} />
                <YAxis />
                <RechartsTooltip />
                <Bar dataKey="count" fill={theme.palette.secondary.main} />
              </BarChart>
            </ResponsiveContainer>
          </>
        )}
        {tabIndex === 2 && (
          <Grid container spacing={2}>
            <Grid item xs={6}>
              <Card variant="outlined"><CardContent>
                <Typography variant="subtitle2">Среднее</Typography>
                <Typography>2002: {stats.mean2002.toFixed(0)}</Typography>
                <Typography>2010: {stats.mean2010.toFixed(0)}</Typography>
                <Typography>2021: {stats.mean2021.toFixed(0)}</Typography>
              </CardContent></Card>
            </Grid>
            <Grid item xs={6}>
              <Card variant="outlined"><CardContent>
                <Typography variant="subtitle2">Медиана</Typography>
                <Typography>2002: {stats.median2002}</Typography>
                <Typography>2010: {stats.median2010}</Typography>
                <Typography>2021: {stats.median2021}</Typography>
              </CardContent></Card>
            </Grid>
          </Grid>
        )}
      </>
    );
  };

  return (
    <Paper sx={{
      position: 'absolute', bottom: 20, right: 20,
      width: { xs: '90%', sm: 500, md: 600 },
      maxHeight: '80vh', overflow: 'auto', zIndex: 1300,
      p: 3, boxShadow: theme.shadows[10], borderRadius: 2,
    }}>
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
        <Typography variant="h6">
          {data.type === 'point' && 'Населённый пункт'}
          {data.type === 'region' && 'Регион'}
          {data.type === 'selection' && 'Выделенная область'}
        </Typography>
        <IconButton size="small" onClick={onClose}><CloseIcon fontSize="small" /></IconButton>
      </Box>
      <Divider sx={{ mb: 3 }} />
      {data.type === 'point' && renderPoint(data)}
      {data.type === 'region' && renderRegionOrSelection(data.regionName, data.locations)}
      {data.type === 'selection' && renderRegionOrSelection('Выделенная область', data.locations)}
    </Paper>
  );
};

export default Dashboard;
EOF

cat > src/shared/ui/Dashboard/index.ts << 'EOF'
export { default } from './Dashboard';
export type { DashboardData, DashboardType } from './Dashboard';
EOF
echo "✅ src/shared/ui/Dashboard/"

# 2. Обновляем MapPage.tsx - добавляем дашборд, НЕ ТРОГАЯ useRegionLayer
cat > src/pages/MapPage/ui/MapPage.tsx << 'EOF'
import React, { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import type { FeatureCollection } from 'geojson';
import { FlyToInterpolator, PickingInfo } from '@deck.gl/core';
import { fetchRegionsFromGeoJSON } from '../../../entities/region';
import { DEFAULT_REGION_CONFIG, RegionLayerConfig } from '../../../entities/region/lib/types';
import { useRegionLayer } from '../../../shared/lib/hooks/useRegionLayer';
import { MapWidget, TerrainMode } from '../../../widgets/Map/ui/MapWidget';
import { ControlPanel, DynamicsPeriod, YearType, VisualizationMode, FilterDirection, TerrainMode as PanelTerrainMode } from '../../../widgets/ControlPanel/ui/ControlPanel';
import { fetchLocationsFromCSV } from '../../../entities/location/api/locationApi';
import type { Location } from '../../../entities/location/lib/types';
import { useMapLayers } from '../../../shared/lib/hooks/useMapLayers';
import { useAltKeyPress } from '../../../shared/lib/hooks';
import { useMapLayersControl } from '../../../shared/lib/hooks/useMapLayersControl';
import { ALL_BASE_LAYERS } from '../lib/mapLayers';
import { usePalette } from '../../../shared/lib/hooks/usePalette';
import { useCamera } from '../../../shared/lib/hooks/useCamera';
import { DEFAULT_FILTER_SETTINGS, FilterSettings } from '../../../shared/types/visualization';
import type { PaletteName } from '../../../entities/palette/lib/constants';
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

  const [dashboardData, setDashboardData] = useState<DashboardData | null>(null);
  const [dashboardOpen, setDashboardOpen] = useState(false);

  const { palette, selectedName, customGradient, selectPalette, setPaletteColors, setCustomGradient, toggleInvert } = usePalette();
  const { settings: cameraSettings, updateSetting: updateCameraSetting, resetToDefault: resetCamera, mapRef } = useCamera();
  const { layers: mapLayers, terrainEnabled, toggleLayer, toggleTerrain, baseLayer, viewState, handleViewStateChange, updateViewState } = useMapLayersControl(ALL_BASE_LAYERS);

  const activeRequests = useRef(0);

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
    return () => { ignore = true; controller.abort(); };
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
    return () => { ignore = true; controller.abort(); };
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

  const handleMapClick = useCallback((info: PickingInfo) => {
    if (!info.picked) return;
    if (info.layer?.id === 'locations-layer' && info.object) {
      setDashboardData({ type: 'point', location: info.object as Location });
      setDashboardOpen(true);
    } else if (info.layer?.id === 'regions-layer' && info.object) {
      const feature = info.object as FeatureCollection['features'][0];
      const regionName = feature.properties?.name_rus;
      if (!regionName || !locations) return;
      const regionLocations = locations.filter(loc => loc.region === regionName);
      setDashboardData({ type: 'region', regionName, locations: regionLocations });
      setDashboardOpen(true);
    }
  }, [locations]);

  const handleCloseDashboard = useCallback(() => setDashboardOpen(false), []);

  const stableLocations = useMemo(() => locations, [locations]);

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
  }), [settings, mode, dynamicsMode, absolutePeriod, absoluteFilter, filterSettings]);

  const deckLayers = useMapLayers(stableLocations, layerSettings, palette);
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
        onClick={handleMapClick}
        viewState={viewState}
        onViewStateChange={handleMapViewStateChange}
      />
      <Dashboard
        open={dashboardOpen}
        data={dashboardData}
        onClose={handleCloseDashboard}
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
echo "✅ src/pages/MapPage/ui/MapPage.tsx (дашборд добавлен)"

# 3. Обновляем MapWidget.tsx для поддержки onClick
cat > src/widgets/Map/ui/MapWidget.tsx << 'EOF'
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
EOF
echo "✅ src/widgets/Map/ui/MapWidget.tsx (onClick добавлен)"

echo ""
echo "🎉 ДАШБОРДЫ ВОССТАНОВЛЕНЫ!"
echo "✅ useRegionLayer НЕ ТРОГАЛИ - границы работают как были"
echo "✅ Dashboard добавлен"
echo "✅ MapPage обновлён с onClick и Dashboard"
echo "✅ MapWidget обновлён с onClick"
echo ""
echo "🚀 Перезапустите проект: pnpm dev"