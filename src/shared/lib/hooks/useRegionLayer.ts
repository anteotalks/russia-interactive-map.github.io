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
