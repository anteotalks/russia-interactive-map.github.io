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
