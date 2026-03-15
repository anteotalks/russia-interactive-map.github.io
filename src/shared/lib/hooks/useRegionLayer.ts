/**
 * Хук для создания слоя границ регионов с правильной реактивностью
 * и отключённой подсветкой при наведении
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
    if (!regionsData) return null;

    // Преобразуем HEX в RGB для deck.gl
    const lineColorRgb = hexToRgb(config.color);

    return new GeoJsonLayer({
      id: 'regions-layer',
      data: regionsData,

      // Основные параметры отрисовки
      stroked: true,              // Рисуем только линии
      filled: false,              // Без заливки
      getLineColor: lineColorRgb, // Цвет линий из конфига
      getLineWidth: config.width, // Толщина линий
      lineWidthUnits: 'pixels',   // Толщина в пикселях (не зависит от зума)
      opacity: config.opacity,    // Прозрачность слоя

      // ОТКЛЮЧАЕМ ВСЮ ПОДСВЕТКУ
      pickable: false,            // Не реагируем на hover/click
      autoHighlight: false,       // Отключаем автоматическую подсветку
      highlightColor: [0, 0, 0, 0], // Прозрачный цвет на всякий случай

      // ПРАВИЛЬНАЯ РЕАКТИВНОСТЬ: слой перерисовывается при изменении этих параметров
      updateTriggers: {
        getLineColor: [config.color],
        getLineWidth: [config.width],
        opacity: [config.opacity],
      },

      // Дополнительные ограничения для чётких линий
      lineWidthMinPixels: 0.5,
      lineWidthMaxPixels: 10,
    });
  }, [regionsData, config.color, config.width, config.opacity]);
};
