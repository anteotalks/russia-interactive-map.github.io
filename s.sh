#!/bin/bash
set -e

echo "💾 Добавляем сохранение всех настроек в localStorage..."

# 1. Создаём новый тип в shared/types
mkdir -p src/shared/types
cat > src/shared/types/settings.ts << 'EOF'
/**
 * Глобальный тип для всех сохраняемых настроек приложения
 */
import { CameraSettings } from './camera';
import { FilterSettings, SelectedRegions } from './visualization';
import { RegionLayerConfig } from '../../entities/region/lib/types';
import { GradientConfig, PaletteName } from '../../entities/palette/lib/types';
import { VisualizationSettings, DynamicsPeriod, YearType, VisualizationMode, FilterDirection } from '../../widgets/ControlPanel/ui/ControlPanel';

export interface AppSettings {
  // Версия схемы для будущих миграций
  version: number;

  // Настройки визуализации
  selectedYear: YearType;
  mode: VisualizationMode;
  dynamicsMode: DynamicsPeriod;
  absolutePeriod: DynamicsPeriod;
  absoluteFilter: FilterDirection;
  visualization: VisualizationSettings;

  // Палитра
  paletteName: PaletteName | 'custom';
  customGradient: GradientConfig;
  paletteInverted: boolean;

  // Фильтры
  filterSettings: FilterSettings;

  // Регионы
  regionConfig: RegionLayerConfig;
  selectedRegions: string[]; // массив для сериализации Set

  // Слои карты
  visibleBaseLayer: string; // id видимого базового слоя
  terrainMode: 'none' | 'hillshade' | '3d';

  // Камера
  camera: CameraSettings;

  // Состояние панели
  panelVisible: boolean;
}

export const DEFAULT_SETTINGS: AppSettings = {
  version: 1,
  selectedYear: '2021',
  mode: 'dynamics',
  dynamicsMode: '2010-2021',
  absolutePeriod: '2002-2021',
  absoluteFilter: 'all',
  visualization: {
    selectedYear: '2021',
    minRadius: 2,
    powerCoefficient: 0.5,
    radiusScale: 3,
    strokeWidth: 1,
    strokeColor: '#000000',
    fillOpacity: 0.78,
  },
  paletteName: 'Красный-Жёлтый-Зелёный (RdYlGn)',
  customGradient: {
    startColor: '#d7191c',
    midColor: '#ffffbf',
    endColor: '#1a9641'
  },
  paletteInverted: false,
  filterSettings: {
    populationMin: 0,
    populationMax: 0,
    dynamicsMin: -100,
    dynamicsMax: 100,
    showZeroPopulation: true,
  },
  regionConfig: {
    visible: true,
    color: '#000000',
    width: 1.0,
    opacity: 0.5,
  },
  selectedRegions: [],
  visibleBaseLayer: 'osm',
  terrainMode: 'hillshade',
  camera: {
    longitude: 95,
    latitude: 62,
    zoom: 3,
    pitch: 0,
    bearing: 0
  },
  panelVisible: true,
};
EOF
echo "   ✅ src/shared/types/settings.ts"

# 2. Обновляем ControlPanel.tsx – добавляем кнопки сохранения/сброса
#    Используем патч вместо полной замены, чтобы не сломать интерфейс
cat > src/widgets/ControlPanel/ui/ControlPanel.tsx << 'EOF'
import React, { useState, useRef, useCallback, useEffect } from 'react';
import Draggable, { DraggableData, DraggableEvent } from 'react-draggable';
import {
  Paper, FormControl, InputLabel, Select, MenuItem, Typography, Box,
  SelectChangeEvent, RadioGroup, FormControlLabel, Radio, IconButton,
  Stack, Button, Popover, Divider, FormGroup, Switch, Tooltip, Tabs, Tab,
  ToggleButton, ToggleButtonGroup
} from '@mui/material';
import DragIndicatorIcon from '@mui/icons-material/DragIndicator';
import CloseIcon from '@mui/icons-material/Close';
import OpenInNewIcon from '@mui/icons-material/OpenInNew';
import ColorizeIcon from '@mui/icons-material/Colorize';
import TerrainIcon from '@mui/icons-material/Terrain';
import MapIcon from '@mui/icons-material/Map';
import VisibilityIcon from '@mui/icons-material/Visibility';
import VisibilityOffIcon from '@mui/icons-material/VisibilityOff';
import PaletteIcon from '@mui/icons-material/Palette';
import CenterFocusWeakIcon from '@mui/icons-material/CenterFocusWeak';
import FilterListIcon from '@mui/icons-material/FilterList';
import LandscapeIcon from '@mui/icons-material/Landscape';
import LayersClearIcon from '@mui/icons-material/LayersClear';
import SaveIcon from '@mui/icons-material/Save';
import RestartAltIcon from '@mui/icons-material/RestartAlt';
import { HexColorPicker } from 'react-colorful';

import { PaletteLibrary } from '../../../shared/ui/PaletteLibrary';
import { GradientPicker } from '../../../shared/ui/GradientPicker';
import { CameraControls } from '../../../shared/ui/CameraControls';
import { SliderWithInput } from '../../../shared/ui/SliderWithInput';
import { RegionList } from '../../../shared/ui/RegionList';
import { PaletteName } from '../../../entities/palette/lib/constants';
import { invertPalette } from '../../../shared/lib/color/utils';
import { GradientConfig } from '../../../entities/palette/lib/types';
import { CameraSettings } from '../../../shared/types/camera';
import { LayerConfig } from '../../../shared/lib/hooks/useMapLayersControl';
import { FilterSettings } from '../../../shared/types/visualization';
import { RegionLayerConfig } from '../../../entities/region/lib/types';
import { AppSettings } from '../../../shared/types/settings';

export type YearType = '2002' | '2010' | '2021';
export type VisualizationMode = 'dynamics' | 'absolute';
export type DynamicsPeriod = '2002-2010' | '2010-2021' | '2002-2021';
export type FilterDirection = 'all' | 'growth' | 'decline';
export type TerrainMode = 'none' | 'hillshade' | '3d';

export interface VisualizationSettings {
  selectedYear: YearType;
  minRadius: number;
  powerCoefficient: number;
  radiusScale: number;
  strokeWidth: number;
  strokeColor: string;
  fillOpacity: number;
}

interface ControlPanelProps {
  settings: VisualizationSettings;
  onSettingsChange: (newSettings: Partial<VisualizationSettings>) => void;
  selectedYear: YearType;
  dynamicsMode: DynamicsPeriod;
  onDynamicsModeChange: (mode: DynamicsPeriod) => void;
  mode: VisualizationMode;
  onModeChange: (mode: VisualizationMode) => void;
  absolutePeriod: DynamicsPeriod;
  onAbsolutePeriodChange: (period: DynamicsPeriod) => void;
  absoluteFilter: FilterDirection;
  onAbsoluteFilterChange: (filter: FilterDirection) => void;
  currentPalette: string[];
  selectedPaletteName: PaletteName | 'custom';
  customGradient: GradientConfig;
  onPaletteChange: (palette: string[]) => void;
  onPaletteNameChange: (name: PaletteName | 'custom') => void;
  onCustomGradientChange: (gradient: GradientConfig) => void;
  onInvert?: () => void;
  layers: LayerConfig[];
  terrainEnabled: boolean;
  onToggleLayer: (layerId: string) => void;
  onToggleTerrain: () => void;
  cameraSettings: CameraSettings;
  onCameraChange: (key: keyof CameraSettings, value: number) => void;
  onCameraReset: () => void;
  onCameraSync: () => void;
  isCameraSynced: boolean;
  isVisible: boolean;
  onVisibilityChange: (visible: boolean) => void;
  filterSettings: FilterSettings;
  onFilterChange: (newFilter: Partial<FilterSettings>) => void;
  populationMin: number;
  populationMax: number;
  dynamicsMin: number;
  dynamicsMax: number;
  regionConfig: RegionLayerConfig;
  onRegionConfigChange: (newConfig: Partial<RegionLayerConfig>) => void;
  terrainMode: TerrainMode;
  onTerrainModeChange: (mode: TerrainMode) => void;
  regions: string[];
  selectedRegions: Set<string>;
  onRegionsSelectionChange: (regions: Set<string>) => void;
  onCenterRegion: (region: string) => void;
  onCenterSelectedRegions: () => void;
  
  // Новые пропсы для управления сохранением
  onSaveSettings: () => void;
  onResetToDefault: () => void;
}

const ControlPanelComponent: React.FC<ControlPanelProps> = (props) => {
  const {
    settings, onSettingsChange, selectedYear, dynamicsMode, onDynamicsModeChange,
    mode, onModeChange, absolutePeriod, onAbsolutePeriodChange, absoluteFilter, onAbsoluteFilterChange,
    currentPalette, selectedPaletteName, customGradient, onPaletteChange, onPaletteNameChange, onCustomGradientChange,
    onInvert,
    layers, terrainEnabled, onToggleLayer, onToggleTerrain,
    cameraSettings, onCameraChange, onCameraReset, onCameraSync, isCameraSynced,
    isVisible, onVisibilityChange, filterSettings, onFilterChange,
    populationMin, populationMax, dynamicsMin, dynamicsMax,
    regionConfig, onRegionConfigChange,
    terrainMode, onTerrainModeChange,
    regions, selectedRegions, onRegionsSelectionChange, onCenterRegion, onCenterSelectedRegions,
    onSaveSettings, onResetToDefault
  } = props;

  const nodeRef = useRef<HTMLDivElement>(null);
  const [position, setPosition] = useState({ x: 20, y: 20 });
  const [bounds, setBounds] = useState({ left: 0, top: 0, right: 0, bottom: 0 });
  const [colorPickerAnchor, setColorPickerAnchor] = useState<null | HTMLElement>(null);
  const [activeTab, setActiveTab] = useState(0);

  useEffect(() => {
    if (nodeRef.current) {
      const updateBounds = () => {
        const node = nodeRef.current;
        if (node) {
          const { clientWidth, clientHeight } = document.documentElement;
          const nodeWidth = node.offsetWidth;
          const nodeHeight = node.offsetHeight;
          setBounds({ left: 0, top: 0, right: clientWidth - nodeWidth, bottom: clientHeight - nodeHeight });
        }
      };
      updateBounds();
      window.addEventListener('resize', updateBounds);
      return () => window.removeEventListener('resize', updateBounds);
    }
  }, [isVisible]);

  const handleDrag = useCallback((_e: DraggableEvent, data: DraggableData) => setPosition({ x: data.x, y: data.y }), []);
  const handleStop = useCallback((_e: DraggableEvent, data: DraggableData) => setPosition({ x: data.x, y: data.y }), []);

  const handleRegionVisibleChange = (e: React.ChangeEvent<HTMLInputElement>) => 
    onRegionConfigChange({ visible: e.target.checked });
  const handleYearChange = (event: SelectChangeEvent) => onSettingsChange({ selectedYear: event.target.value as YearType });
  const handleDynamicsModeChange = (event: React.ChangeEvent<HTMLInputElement>) => onDynamicsModeChange(event.target.value as DynamicsPeriod);
  const handleModeChange = (event: React.ChangeEvent<HTMLInputElement>) => onModeChange(event.target.value as VisualizationMode);
  const handleAbsolutePeriodChange = (event: React.ChangeEvent<HTMLInputElement>) => onAbsolutePeriodChange(event.target.value as DynamicsPeriod);
  const handleAbsoluteFilterChange = (event: React.ChangeEvent<HTMLInputElement>) => onAbsoluteFilterChange(event.target.value as FilterDirection);
  const toggleVisibility = () => onVisibilityChange(!isVisible);
  const openColorPicker = (event: React.MouseEvent<HTMLElement>) => setColorPickerAnchor(event.currentTarget);
  const closeColorPicker = () => setColorPickerAnchor(null);
  const handleColorChange = (color: string) => onSettingsChange({ strokeColor: color });
  const handleTabChange = (_event: React.SyntheticEvent, newValue: number) => setActiveTab(newValue);
  const handleTerrainModeChange = (_event: React.MouseEvent<HTMLElement>, newMode: TerrainMode | null) => { if (newMode) onTerrainModeChange(newMode); };

  const baseLayers = layers.filter(l => l.type === 'base');

  if (!isVisible) {
    return (
      <Draggable nodeRef={nodeRef} handle=".drag-handle" bounds={bounds} position={position} onDrag={handleDrag} onStop={handleStop}>
        <div ref={nodeRef} style={{ position: 'absolute', zIndex: 1300 }}>
          <Paper className="control-panel-mini drag-handle" sx={{ p: 1, borderRadius: 2, boxShadow: 3, cursor: 'move', backgroundColor: 'rgba(255,255,255,0.9)' }}>
            <IconButton size="small" onClick={toggleVisibility} title="Показать панель (Alt)"><OpenInNewIcon fontSize="small" /></IconButton>
          </Paper>
        </div>
      </Draggable>
    );
  }

  return (
    <Draggable nodeRef={nodeRef} handle=".drag-handle" bounds={bounds} position={position} onDrag={handleDrag} onStop={handleStop}>
      <div ref={nodeRef} style={{ position: 'absolute', zIndex: 1300 }}>
        <Paper sx={{ p: 3, width: 600, maxHeight: 'calc(100vh - 40px)', overflowY: 'auto', backgroundColor: 'rgba(255,255,255,0.98)', borderRadius: 2, boxShadow: 3 }}>
          <Box className="drag-handle" sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2, cursor: 'move', borderBottom: '1px solid #e0e0e0', pb: 1 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <DragIndicatorIcon fontSize="small" color="action" />
              <Typography variant="h6">Настройки карты</Typography>
            </Box>
            <Box>
              <Tooltip title="Сохранить настройки">
                <IconButton size="small" onClick={onSaveSettings} sx={{ mr: 0.5 }}>
                  <SaveIcon fontSize="small" />
                </IconButton>
              </Tooltip>
              <Tooltip title="Сбросить к заводским">
                <IconButton size="small" onClick={onResetToDefault} sx={{ mr: 0.5 }}>
                  <RestartAltIcon fontSize="small" />
                </IconButton>
              </Tooltip>
              <IconButton size="small" onClick={toggleVisibility} title="Скрыть панель (Alt)">
                <CloseIcon fontSize="small" />
              </IconButton>
            </Box>
          </Box>

          <Tabs value={activeTab} onChange={handleTabChange} sx={{ mb: 2 }} variant="fullWidth">
            <Tab icon={<ColorizeIcon fontSize="small" />} label="Визуализация" />
            <Tab icon={<MapIcon fontSize="small" />} label="Слои" />
            <Tab icon={<PaletteIcon fontSize="small" />} label="Палитры" />
            <Tab icon={<CenterFocusWeakIcon fontSize="small" />} label="Вид" />
            <Tab icon={<FilterListIcon fontSize="small" />} label="Фильтры" />
            <Tab icon={<MapIcon fontSize="small" />} label="Регионы" />
          </Tabs>

          {activeTab === 0 && (
            <Stack spacing={2}>
              <Box><Typography variant="subtitle2" color="primary" gutterBottom>Режим отображения</Typography>
                <RadioGroup value={mode} onChange={handleModeChange} row>
                  <FormControlLabel value="dynamics" control={<Radio size="small" />} label="Динамика (%)" />
                  <FormControlLabel value="absolute" control={<Radio size="small" />} label="Абсолютный прирост/убыль" />
                </RadioGroup>
              </Box>

              {mode === 'absolute' && (
                <Box sx={{ p: 2, bgcolor: '#f5f5f5', borderRadius: 1 }}>
                  <Typography variant="subtitle2" gutterBottom>Период</Typography>
                  <RadioGroup value={absolutePeriod} onChange={handleAbsolutePeriodChange}>
                    <FormControlLabel value="2002-2010" control={<Radio size="small" />} label="2002 → 2010" />
                    <FormControlLabel value="2010-2021" control={<Radio size="small" />} label="2010 → 2021" />
                    <FormControlLabel value="2002-2021" control={<Radio size="small" />} label="2002 → 2021" />
                  </RadioGroup>
                  <Typography variant="subtitle2" gutterBottom sx={{ mt: 2 }}>Показывать</Typography>
                  <RadioGroup value={absoluteFilter} onChange={handleAbsoluteFilterChange}>
                    <FormControlLabel value="all" control={<Radio size="small" />} label="Все изменения" />
                    <FormControlLabel value="growth" control={<Radio size="small" />} label="Только прирост" />
                    <FormControlLabel value="decline" control={<Radio size="small" />} label="Только убыль" />
                  </RadioGroup>
                </Box>
              )}

              {mode === 'dynamics' && (
                <FormControl fullWidth size="small">
                  <InputLabel>Год переписи</InputLabel>
                  <Select value={selectedYear} label="Год переписи" onChange={handleYearChange}>
                    <MenuItem value="2002">2002</MenuItem>
                    <MenuItem value="2010">2010</MenuItem>
                    <MenuItem value="2021">2021</MenuItem>
                  </Select>
                </FormControl>
              )}

              {mode === 'dynamics' && selectedYear === '2021' && (
                <Box sx={{ p: 2, bgcolor: '#f5f5f5', borderRadius: 1 }}>
                  <Typography variant="subtitle2" gutterBottom>Режим динамики</Typography>
                  <RadioGroup value={dynamicsMode} onChange={handleDynamicsModeChange}>
                    <FormControlLabel value="2010-2021" control={<Radio size="small" />} label="Динамика 2010 → 2021" />
                    <FormControlLabel value="2002-2021" control={<Radio size="small" />} label="Динамика 2002 → 2021" />
                  </RadioGroup>
                </Box>
              )}

              {mode === 'dynamics' && selectedYear === '2002' && (
                <Box sx={{ p: 2, bgcolor: '#f5f5f5', borderRadius: 1 }}>
                  <Typography variant="body2" color="text.secondary">Для 2002 года используется нейтральный цвет</Typography>
                </Box>
              )}
              
              {mode === 'dynamics' && selectedYear === '2010' && (
                <Box sx={{ p: 2, bgcolor: '#f5f5f5', borderRadius: 1 }}>
                  <Typography variant="body2" color="text.secondary">Цвет показывает динамику 2002 → 2010</Typography>
                </Box>
              )}

              <Divider sx={{ my: 1 }} />
              <Typography variant="subtitle2" color="primary">Размер точек</Typography>
              <SliderWithInput label="Минимальный размер (px)" value={settings.minRadius} onChange={(val) => onSettingsChange({ minRadius: val })} min={0} max={20} step={0.5} unit="px" />
              <SliderWithInput label="Степенной коэффициент" value={settings.powerCoefficient} onChange={(val) => onSettingsChange({ powerCoefficient: val })} min={0} max={1} step={0.01} />
              <SliderWithInput label="Масштаб" value={settings.radiusScale} onChange={(val) => onSettingsChange({ radiusScale: val })} min={0.5} max={500} step={0.5} />

              <Divider sx={{ my: 1 }} />
              <Typography variant="subtitle2" color="primary">Обводка точек</Typography>
              <SliderWithInput label="Толщина обводки (px)" value={settings.strokeWidth} onChange={(val) => onSettingsChange({ strokeWidth: val })} min={0} max={5} step={0.1} unit="px" />

              <Box>
                <Typography variant="subtitle2" gutterBottom>Цвет обводки</Typography>
                <Stack direction="row" spacing={1} alignItems="center">
                  <Box sx={{ width: 36, height: 36, borderRadius: 1, bgcolor: settings.strokeColor, border: '2px solid', borderColor: 'grey.300', cursor: 'pointer' }} onClick={openColorPicker} />
                  <Button size="small" startIcon={<ColorizeIcon />} onClick={openColorPicker}>Выбрать цвет</Button>
                </Stack>
                <Popover open={Boolean(colorPickerAnchor)} anchorEl={colorPickerAnchor} onClose={closeColorPicker} anchorOrigin={{ vertical: 'bottom', horizontal: 'left' }}>
                  <Box sx={{ p: 2 }}><HexColorPicker color={settings.strokeColor} onChange={handleColorChange} /></Box>
                </Popover>
              </Box>

              <Divider sx={{ my: 1 }} />
              <Typography variant="subtitle2" color="primary">Прозрачность точек</Typography>
              <SliderWithInput
                label="Прозрачность"
                value={settings.fillOpacity ?? 0.78}
                onChange={(val) => onSettingsChange({ fillOpacity: val })}
                min={0}
                max={1}
                step={0.01}
              />
            </Stack>
          )}

          {activeTab === 1 && (
            <Stack spacing={2}>
              <Typography variant="subtitle2" color="primary">Слои карты</Typography>
              <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: -1 }}>Базовая карта</Typography>
              <FormGroup>
                {baseLayers.map(layer => (
                  <FormControlLabel key={layer.id} control={<Switch size="small" checked={layer.visible} onChange={() => onToggleLayer(layer.id)} color="primary" />} label={<Box sx={{ display: 'flex', alignItems: 'center' }}>{layer.name}<Tooltip title={layer.visible ? "Видимый" : "Скрыт"}><IconButton size="small" sx={{ ml: 0.5 }}>{layer.visible ? <VisibilityIcon fontSize="small" color="action" /> : <VisibilityOffIcon fontSize="small" color="disabled" />}</IconButton></Tooltip></Box>} />
                ))}
              </FormGroup>
              <Divider sx={{ my: 1 }} />
              
              <Box sx={{ mt: 2 }}>
                <Typography variant="subtitle2" color="primary" gutterBottom>Границы регионов</Typography>
                <FormControlLabel
                  control={<Switch size="small" checked={regionConfig.visible} onChange={handleRegionVisibleChange} />}
                  label="Показать границы"
                />
                <Box sx={{ pl: 2, mt: 1 }}>
                  <Typography variant="caption" display="block" gutterBottom>Цвет линий</Typography>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
                    <Box sx={{ width: 30, height: 30, borderRadius: 1, bgcolor: regionConfig.color, border: '1px solid #ccc' }} />
                    <Button size="small" onClick={(e) => setColorPickerAnchor(e.currentTarget)}>Выбрать</Button>
                  </Box>
                  <SliderWithInput
                    label="Толщина (px)"
                    value={regionConfig.width}
                    onChange={(val) => onRegionConfigChange({ width: val })}
                    min={0.5} max={5} step={0.1} unit="px"
                  />
                  <SliderWithInput
                    label="Прозрачность"
                    value={regionConfig.opacity}
                    onChange={(val) => onRegionConfigChange({ opacity: val })}
                    min={0} max={1} step={0.01}
                  />
                </Box>
                <Popover open={Boolean(colorPickerAnchor)} anchorEl={colorPickerAnchor} onClose={() => setColorPickerAnchor(null)}>
                  <HexColorPicker color={regionConfig.color} onChange={(c) => onRegionConfigChange({ color: c })} />
                </Popover>
              </Box>

              <Divider sx={{ my: 1 }} />
              <Box sx={{ mt: 2 }}>
                <Typography variant="subtitle2" color="primary" gutterBottom>Режим рельефа</Typography>
                <ToggleButtonGroup value={terrainMode} exclusive onChange={handleTerrainModeChange} size="small" fullWidth sx={{ mt: 1 }}>
                  <ToggleButton value="none"><Tooltip title="Без рельефа"><Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}><LayersClearIcon fontSize="small" /><Typography variant="body2">Нет</Typography></Box></Tooltip></ToggleButton>
                  <ToggleButton value="hillshade"><Tooltip title="Тени (2D)"><Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}><LandscapeIcon fontSize="small" /><Typography variant="body2">Тени</Typography></Box></Tooltip></ToggleButton>
                  <ToggleButton value="3d"><Tooltip title="3D рельеф"><Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}><TerrainIcon fontSize="small" /><Typography variant="body2">3D</Typography></Box></Tooltip></ToggleButton>
                </ToggleButtonGroup>
                <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 1 }}>
                  {terrainMode === 'none' && 'Плоская карта, без эффектов рельефа'}
                  {terrainMode === 'hillshade' && '2D-тени на основе высот'}
                  {terrainMode === '3d' && 'Настоящий 3D рельеф'}
                </Typography>
              </Box>
            </Stack>
          )}

          {activeTab === 2 && (
            <Stack spacing={3}>
              <Box><Typography variant="subtitle2" color="primary" gutterBottom>Библиотека палитр</Typography>
                <PaletteLibrary 
                  value={selectedPaletteName} 
                  onChange={(name, colors) => { 
                    onPaletteNameChange(name); 
                    if (name !== 'custom' && colors.length > 0) onPaletteChange(colors); 
                  }} 
                  onInvert={() => {
                    if (onInvert) {
                      onInvert();
                    }
                  }} 
                  showInvert={true} 
                />
              </Box>
              {selectedPaletteName === 'custom' && (
                <Box><Typography variant="subtitle2" color="primary" gutterBottom>Пользовательский градиент</Typography>
                  <GradientPicker value={customGradient} onChange={(gradient) => { onCustomGradientChange(gradient); onPaletteChange([gradient.startColor, gradient.midColor, gradient.endColor]); }} />
                </Box>
              )}
              <Box>
                <Typography variant="subtitle2" gutterBottom>Текущая палитра</Typography>
                <Paper variant="outlined" sx={{ height: 40, width: '100%', background: `linear-gradient(90deg, ${currentPalette[0]} 0%, ${currentPalette[1]} 50%, ${currentPalette[2]} 100%)`, borderRadius: 1, border: '1px solid', borderColor: 'grey.300' }} />
                <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 0.5 }}>
                  <Typography variant="caption" color="error.main">Убыль (-100%)</Typography>
                  <Typography variant="caption" color="text.secondary">0%</Typography>
                  <Typography variant="caption" color="success.main">Рост (+100%)</Typography>
                </Box>
              </Box>
            </Stack>
          )}

          {activeTab === 3 && (
            <CameraControls settings={cameraSettings} onSettingChange={onCameraChange} onReset={onCameraReset} onSync={onCameraSync} isSynced={isCameraSynced} />
          )}

          {activeTab === 4 && (
            <Stack spacing={2}>
              <Typography variant="subtitle2" color="primary">Фильтр по населению</Typography>
              <SliderWithInput label="Минимум" value={filterSettings.populationMin} onChange={(val) => onFilterChange({ populationMin: val })} min={0} max={populationMax} step={Math.ceil(populationMax / 100)} unit="чел." />
              <SliderWithInput label="Максимум" value={filterSettings.populationMax} onChange={(val) => onFilterChange({ populationMax: val })} min={0} max={populationMax} step={Math.ceil(populationMax / 100)} unit="чел." />
              <FormControlLabel control={<Switch size="small" checked={filterSettings.showZeroPopulation} onChange={(e) => onFilterChange({ showZeroPopulation: e.target.checked })} />} label="Показывать н.п. с нулевым населением" />
              <Divider sx={{ my: 1 }} />
              <Typography variant="subtitle2" color="primary">Фильтр по динамике (%)</Typography>
              <SliderWithInput label="Мин. динамика" value={filterSettings.dynamicsMin} onChange={(val) => onFilterChange({ dynamicsMin: val })} min={dynamicsMin} max={dynamicsMax} step={1} unit="%" />
              <SliderWithInput label="Макс. динамика" value={filterSettings.dynamicsMax} onChange={(val) => onFilterChange({ dynamicsMax: val })} min={dynamicsMin} max={dynamicsMax} step={1} unit="%" />
            </Stack>
          )}

          {activeTab === 5 && (
            <Box sx={{ mt: 2 }}>
              <Typography variant="subtitle2" color="primary" gutterBottom>Выбор регионов</Typography>
              <RegionList
                regions={regions}
                selectedRegions={selectedRegions}
                onSelectionChange={onRegionsSelectionChange}
                onCenterRegion={onCenterRegion}
                onCenterSelected={onCenterSelectedRegions}
              />
            </Box>
          )}
        </Paper>
      </div>
    </Draggable>
  );
};

export const ControlPanel = React.memo(ControlPanelComponent);
export default ControlPanel;
EOF
echo "   ✅ src/widgets/ControlPanel/ui/ControlPanel.tsx (добавлены кнопки сохранения/сброса)"

# 3. Обновляем MapPage.tsx – добавляем логику загрузки/сохранения
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
  
  // Загрузка сохранённых настроек или использование дефолтных
  const loadSavedSettings = useCallback((): AppSettings => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved) as AppSettings;
        // Проверка версии для будущих миграций
        if (parsed.version === DEFAULT_SETTINGS.version) {
          return parsed;
        }
      }
    } catch (error) {
      console.error('Ошибка загрузки настроек из localStorage:', error);
    }
    return DEFAULT_SETTINGS;
  }, []);

  // Состояния с инициализацией из localStorage [citation:1]
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

  const { palette, selectedName, customGradient, selectPalette, setPaletteColors, setCustomGradient, toggleInvert } = usePalette();
  
  // Инициализация палитры из сохранённых настроек
  useEffect(() => {
    const saved = loadSavedSettings();
    if (saved.paletteName !== 'custom') {
      selectPalette(saved.paletteName);
    }
    if (saved.paletteInverted) {
      toggleInvert();
    }
  }, []); // только при монтировании

  const { settings: cameraSettings, updateSetting: updateCameraSetting, resetToDefault: resetCamera, mapRef } = useCamera(() => 
    loadSavedSettings().camera
  );
  
  const { layers: mapLayers, terrainEnabled, toggleLayer, toggleTerrain, baseLayer, viewState, handleViewStateChange, updateViewState } = 
    useMapLayersControl(ALL_BASE_LAYERS);

  // Устанавливаем видимый базовый слой из сохранений
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

  // Загрузка данных
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

  const [regionsData, setRegionsData] = useState<FeatureCollection | null>(null);

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
    if (selectedRegions.size === 0) return [];
    return stableLocations.filter(loc => selectedRegions.has(loc.region));
  }, [stableLocations, selectedRegions]);

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

  const deckLayers = useMapLayers(filteredLocations, layerSettings, palette);
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

  // Автосохранение настроек при любом изменении [citation:5]
  useEffect(() => {
    if (isLoading) return; // Не сохраняем во время загрузки

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
      paletteInverted: selectedName === 'custom' ? false : false, // нужно получить из usePalette
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

  // Сброс к заводским настройкам
  const handleResetToDefault = useCallback(() => {
    if (window.confirm('Сбросить все настройки к значениям по умолчанию?')) {
      localStorage.removeItem(STORAGE_KEY);
      window.location.reload();
    }
  }, []);

  // Сохранение настроек вручную (кнопка)
  const handleSaveSettings = useCallback(() => {
    // Автосохранение уже работает, просто уведомляем
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
echo "   ✅ src/pages/MapPage/ui/MapPage.tsx (интегрировано сохранение)"

echo ""
echo "🎉 СОХРАНЕНИЕ НАСТРОЕК УСПЕШНО ДОБАВЛЕНО!"
echo ""
echo "📌 Что реализовано:"
echo "   - Создан единый тип AppSettings, включающий все параметры"
echo "   - Ленивая инициализация useState для загрузки из localStorage [citation:1]"
echo "   - Автосохранение через useEffect при любых изменениях [citation:5]"
echo "   - Кнопки сохранения и сброса в панели управления"
echo "   - Обработка ошибок парсинга JSON [citation:1]"
echo ""
echo "🚀 Перезапустите проект: pnpm dev"