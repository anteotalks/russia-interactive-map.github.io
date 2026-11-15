import type { LayerConfig } from '../../types/map';

/**
 * Построение стиля карты для MapLibre
 * Теперь только возвращает URL стиля или строит базовый растровый слой.
 */
export function buildMapStyle(baseLayer: LayerConfig): any {
  if (baseLayer.mapType === 'vector' && baseLayer.styleUrl) {
    return baseLayer.styleUrl;
  }

  // Для растровых карт строим стиль вручную
  const style: any = {
    version: 8,
    sources: {},
    layers: []
  };

  if (baseLayer.tileUrl) {
    style.sources[baseLayer.id] = {
      type: 'raster',
      tiles: [baseLayer.tileUrl],
      tileSize: 256,
      attribution: baseLayer.attribution || '© OpenStreetMap',
      maxzoom: baseLayer.maxZoom || 19
    };

    style.layers.push({
      id: `${baseLayer.id}-layer`,
      type: 'raster',
      source: baseLayer.id,
      minzoom: 0,
      maxzoom: baseLayer.maxZoom || 22
    });
  }

  return style;
}
