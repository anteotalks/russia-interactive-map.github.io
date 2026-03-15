/**
 * Хук для слоя границ регионов с защитой от повторной инициализации
 * и корректной обработкой видимости.
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
      // Видимость управляется напрямую, без updateTriggers
      visible: config.visible,
      pickable: false,          // для кликов пока не нужно
      autoHighlight: false,
      highlightColor: [0, 0, 0, 0],
      // updateTriggers только для тех пропсов, которые могут меняться без пересоздания слоя
      updateTriggers: {
        getLineColor: [config.color],
        getLineWidth: [config.width],
        opacity: [config.opacity],
        // visible не включаем – он управляется напрямую
      },
      lineWidthMinPixels: 0.5,
      lineWidthMaxPixels: 10,
    });
  }, [regionsData, config.visible, config.color, config.width, config.opacity]);
  // Зависимость от visible добавлена, чтобы слой пересоздавался при его изменении
  // (так надёжнее, чем полагаться на внутренний механизм deck.gl)
};
