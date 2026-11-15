/**
 * HexagonLayer по официальному примеру deck.gl
 * https://deck.gl/docs/api-reference/aggregation-layers/hexagon-layer
 */

import { useMemo } from 'react';
import { HexagonLayer } from '@deck.gl/aggregation-layers';
import type { Color, PickingInfo } from '@deck.gl/core';
import { Location } from '../../../entities/location/lib/types';
import { hexToRgb } from '../color/utils';
import { FilterDirection } from '../../../shared/types/visualization';

export interface HexagonLayerSettings {
  mode: 'dynamics' | 'absolute';
  selectedYear: '2002' | '2010' | '2021';
  dynamicsPeriod: '2002-2010' | '2010-2021' | '2002-2021';
  absolutePeriod: '2002-2010' | '2010-2021' | '2002-2021';
  absoluteFilter: FilterDirection;
  radius: number;              // Радиус гексагона в метрах
  coverage: number;            // Заполнение (0-1)
  extruded: boolean;           // 3D-высота
  elevationScale: number;      // Масштаб высоты
  elevationRange: [number, number]; // Диапазон высот [min, max]
  upperPercentile: number;     // Верхний процентиль (100 = все)
  opacity: number;             // Прозрачность
}

// Предопределённый материал из примера
const DEFAULT_MATERIAL = {
  ambient: 0.64,
  diffuse: 0.6,
  shininess: 32,
  specularColor: [51, 51, 51]
};

// Цветовой диапазон по умолчанию (если палитра не подходит)
const DEFAULT_COLOR_RANGE: Color[] = [
  [1, 152, 189],
  [73, 227, 206],
  [216, 254, 181],
  [254, 237, 177],
  [254, 173, 84],
  [209, 55, 78]
];

export const useHexagonLayer = (
  data: Location[] | null,
  settings: HexagonLayerSettings,
  palette: string[]
) => {
  const layer = useMemo(() => {
    if (!data || data.length === 0) return null;

    // Конвертируем данные в формат [lng, lat]
    const points: [number, number][] = data
      .filter(point => {
        const pop = point[`population_${settings.selectedYear}`];
        return !isNaN(pop) && isFinite(pop) && pop > 0;
      })
      .map(point => [point.longitude, point.latitude]);

    if (points.length === 0) return null;

    // Создаём colorRange из палитры или используем дефолтный
    let colorRange: Color[];
    try {
      colorRange = palette.map(hex => {
        const [r, g, b] = hexToRgb(hex);
        return [r, g, b, Math.round(settings.opacity * 255)];
      });
      // Если палитра слишком короткая, дополняем
      if (colorRange.length < 2) {
        colorRange = DEFAULT_COLOR_RANGE;
      }
    } catch {
      colorRange = DEFAULT_COLOR_RANGE;
    }

    return new HexagonLayer<[number, number]>({
      id: 'hexagon-layer',
      data: points,
      
      // Основные параметры как в примере
      gpuAggregation: true,     // Используем GPU для производительности
      colorRange,
      coverage: settings.coverage,
      elevationRange: settings.elevationRange,
      elevationScale: settings.elevationScale,
      extruded: settings.extruded,
      getPosition: (d: [number, number]) => d,
      pickable: true,
      radius: settings.radius,
      upperPercentile: settings.upperPercentile,
      
      // Материал для 3D-освещения (как в примере)
      material: DEFAULT_MATERIAL,

      // Анимация (опционально)
      transitions: {
        elevationScale: 3000
      },

      updateTriggers: {
        radius: [settings.radius],
        coverage: [settings.coverage],
        elevationScale: [settings.elevationScale],
        extruded: [settings.extruded],
        colorRange: [palette, settings.opacity]
      },

      parameters: {
        depthWriteEnabled: true,
        depthTest: true
      }
    });
  }, [data, settings, palette]);

  return useMemo(() => (layer ? [layer] : []), [layer]);
};

// Вспомогательная функция для тултипа
export function getHexagonTooltip({ object }: PickingInfo) {
  if (!object) return null;
  
  // object.position - [lng, lat] центроида
  // object.count - количество точек в гексагоне
  const lat = object.position?.[1];
  const lng = object.position?.[0];
  const count = object.count || 0;

  return {
    html: `<div>
      <strong>Гексагон</strong><br/>
      Точек: ${count}<br/>
      Центр: ${lng?.toFixed(4)}, ${lat?.toFixed(4)}
    </div>`,
    style: {
      backgroundColor: '#111',
      color: '#fff',
      padding: '8px',
      borderRadius: '4px',
      fontSize: '12px'
    }
  };
}

export default useHexagonLayer;
