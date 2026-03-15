import type { LayerConfig } from '../../../widgets/LayersControl/ui/LayersControl';

// Все доступные стили OpenFreeMap
// Источник: https://openfreemap.org/quick_start/
export const OPENFREEMAP_STYLES: LayerConfig[] = [
  {
    id: 'openfreemap-liberty',
    name: 'OpenFreeMap Liberty',
    styleUrl: 'https://tiles.openfreemap.org/styles/liberty',
    mapType: 'vector',
    visible: false,
    type: 'base',
    attribution: '© OpenFreeMap © OpenMapTiles © OpenStreetMap'
  },
  {
    id: 'openfreemap-bright',
    name: 'OpenFreeMap Bright',
    styleUrl: 'https://tiles.openfreemap.org/styles/bright',
    mapType: 'vector',
    visible: false,
    type: 'base',
    attribution: '© OpenFreeMap © OpenMapTiles © OpenStreetMap'
  },
  {
    id: 'openfreemap-positron',
    name: 'OpenFreeMap Positron',
    styleUrl: 'https://tiles.openfreemap.org/styles/positron',
    mapType: 'vector',
    visible: false,
    type: 'base',
    attribution: '© OpenFreeMap © OpenMapTiles © OpenStreetMap'
  },
  {
    id: 'openfreemap-dark',
    name: 'OpenFreeMap Dark',
    styleUrl: 'https://tiles.openfreemap.org/styles/dark',
    mapType: 'vector',
    visible: false,
    type: 'base',
    attribution: '© OpenFreeMap © OpenMapTiles © OpenStreetMap'
  },
  {
    id: 'openfreemap-fiord',
    name: 'OpenFreeMap Fiord',
    styleUrl: 'https://tiles.openfreemap.org/styles/fiord',
    mapType: 'vector',
    visible: false,
    type: 'base',
    attribution: '© OpenFreeMap © OpenMapTiles © OpenStreetMap'
  },
  {
    id: 'openfreemap-3d',
    name: 'OpenFreeMap 3D',
    styleUrl: 'https://tiles.openfreemap.org/styles/positron',
    mapType: 'vector',
    visible: false,
    type: 'base',
    attribution: '© OpenFreeMap © OpenMapTiles © OpenStreetMap'
  }
];

// Существующие растровые слои
export const RASTER_LAYERS: LayerConfig[] = [
  {
    id: 'osm',
    name: 'OpenStreetMap',
    tileUrl: 'https://tile.openstreetmap.org/{z}/{x}/{y}.png',
    mapType: 'raster',
    visible: true,
    type: 'base',
    maxZoom: 19,
    attribution: '© OpenStreetMap'
  },
  {
    id: 'satellite',
    name: 'Спутник (ArcGIS)',
    tileUrl: 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}',
    mapType: 'raster',
    visible: false,
    type: 'base',
    maxZoom: 19,
    attribution: '© Esri, Maxar, Earthstar Geographics'
  }
];

// Слой Maptiler Dark (векторный)
export const MAPTILER_DARK: LayerConfig = {
  id: 'dark',
  name: 'Maptiler Dark',
  styleUrl: `https://api.maptiler.com/maps/dark/style.json?key=${import.meta.env.PUBLIC_MAPTILER_KEY}`,
  mapType: 'vector',
  visible: false,
  type: 'base',
  attribution: '© Maptiler © OpenStreetMap'
};

// Объединяем все слои в один массив
export const ALL_BASE_LAYERS: LayerConfig[] = [
  // Растровые слои
  ...RASTER_LAYERS,
  
  // Maptiler Dark
  MAPTILER_DARK,
  
  // OpenFreeMap стили
  ...OPENFREEMAP_STYLES,
  
  // CARTO стили (бесплатные, без токена)
  {
    id: 'carto-positron',
    name: 'CARTO Positron (светлая)',
    styleUrl: 'https://basemaps.cartocdn.com/gl/positron-gl-style/style.json',
    mapType: 'vector',
    visible: false,
    type: 'base',
    attribution: '© CARTO © OpenStreetMap'
  },
  {
    id: 'carto-dark-matter',
    name: 'CARTO Dark Matter (тёмная)',
    styleUrl: 'https://basemaps.cartocdn.com/gl/dark-matter-gl-style/style.json',
    mapType: 'vector',
    visible: false,
    type: 'base',
    attribution: '© CARTO © OpenStreetMap'
  },
  {
    id: 'carto-voyager',
    name: 'CARTO Voyager (нейтральная)',
    styleUrl: 'https://basemaps.cartocdn.com/gl/voyager-gl-style/style.json',
    mapType: 'vector',
    visible: false,
    type: 'base',
    attribution: '© CARTO © OpenStreetMap'
  },
  {
    id: 'carto-positron-nolabels',
    name: 'CARTO Positron (без подписей)',
    styleUrl: 'https://basemaps.cartocdn.com/gl/positron-nolabels-gl-style/style.json',
    mapType: 'vector',
    visible: false,
    type: 'base',
    attribution: '© CARTO © OpenStreetMap'
  },
  {
    id: 'carto-dark-matter-nolabels',
    name: 'CARTO Dark Matter (без подписей)',
    styleUrl: 'https://basemaps.cartocdn.com/gl/dark-matter-nolabels-gl-style/style.json',
    mapType: 'vector',
    visible: false,
    type: 'base',
    attribution: '© CARTO © OpenStreetMap'
  },
  {
    id: 'carto-voyager-nolabels',
    name: 'CARTO Voyager (без подписей)',
    styleUrl: 'https://basemaps.cartocdn.com/gl/voyager-nolabels-gl-style/style.json',
    mapType: 'vector',
    visible: false,
    type: 'base',
    attribution: '© CARTO © OpenStreetMap'
  }
];
