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
import { GradientConfig } from '../../../entities/palette/lib/types';
import { CameraSettings } from '../../../shared/types/camera';
import { LayerConfig } from '../../../shared/lib/hooks/useMapLayersControl';
import { FilterSettings } from '../../../shared/types/visualization';
import { RegionLayerConfig } from '../../../entities/region/lib/types';

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
  onSaveSettings: () => void;
  onResetToDefault: () => void;
  visiblePointsCount: number;
  totalPointsCount: number;
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
    onSaveSettings, onResetToDefault,
    visiblePointsCount, totalPointsCount,
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

          <Box sx={{ mb: 2, p: 1, bgcolor: 'action.hover', borderRadius: 1, textAlign: 'center' }}>
            <Typography variant="body2" color="text.secondary">
              Найдено: <strong>{visiblePointsCount}</strong> из {totalPointsCount} населённых пунктов
            </Typography>
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
