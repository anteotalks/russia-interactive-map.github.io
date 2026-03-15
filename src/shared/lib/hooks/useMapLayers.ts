/**
 * Хук для слоя точек с отключённой подсветкой
 */

import { useMemo, useCallback } from 'react';
import { ScatterplotLayer } from '@deck.gl/layers';
import { DataFilterExtension } from '@deck.gl/extensions';
import type { Color } from '@deck.gl/core';
import { Location } from '../../../entities/location/lib/types';
import {
  getColorByDynamics,
  getColorByAbsoluteChange,
  getAbsoluteChange,
  getNeutralColor,
  hexToRgb
} from '../color/utils';

interface LayerSettings {
  selectedYear: '2002' | '2010' | '2021';
  powerCoefficient: number;
  radiusScale: number;
  minRadius: number;
  mode: 'dynamics' | 'absolute';
  dynamicsPeriod: '2002-2010' | '2010-2021' | '2002-2021';
  absolutePeriod: '2002-2010' | '2010-2021' | '2002-2021';
  strokeWidth: number;
  strokeColor: string;
  fillOpacity: number;
  populationMin: number;
  populationMax: number;
  dynamicsMin: number;
  dynamicsMax: number;
  showZeroPopulation: boolean;
}

export const useMapLayers = (
  data: Location[] | null,
  settings: LayerSettings,
  palette: string[]
) => {
  const strokeRgb = useMemo(() => {
    try {
      return hexToRgb(settings.strokeColor);
    } catch {
      return [0, 0, 0] as [number, number, number];
    }
  }, [settings.strokeColor]);

  const getFillColor = useCallback((d: Location): Color => {
    const pop2002 = d.population_2002;
    const pop2010 = d.population_2010;
    const pop2021 = d.population_2021;

    if (settings.mode === 'absolute') {
      const change = getAbsoluteChange(d, settings.absolutePeriod);
      return getColorByAbsoluteChange(change, palette, settings.fillOpacity) as Color;
    }

    if (settings.selectedYear === '2002') {
      return getNeutralColor(palette, settings.fillOpacity) as Color;
    }

    if (settings.selectedYear === '2010') {
      if (pop2002 === 0 || isNaN(pop2002) || !isFinite(pop2002)) {
        return getNeutralColor(palette, settings.fillOpacity) as Color;
      }
      const changePercent = ((pop2010 - pop2002) / pop2002) * 100;
      return getColorByDynamics(changePercent, palette, settings.fillOpacity) as Color;
    }

    if (settings.selectedYear === '2021') {
      if (settings.dynamicsPeriod === '2010-2021') {
        if (pop2010 === 0 || isNaN(pop2010) || !isFinite(pop2010)) {
          return getNeutralColor(palette, settings.fillOpacity) as Color;
        }
        const changePercent = ((pop2021 - pop2010) / pop2010) * 100;
        return getColorByDynamics(changePercent, palette, settings.fillOpacity) as Color;
      } else {
        if (pop2002 === 0 || isNaN(pop2002) || !isFinite(pop2002)) {
          return getNeutralColor(palette, settings.fillOpacity) as Color;
        }
        const changePercent = ((pop2021 - pop2002) / pop2002) * 100;
        return getColorByDynamics(changePercent, palette, settings.fillOpacity) as Color;
      }
    }

    return getNeutralColor(palette, settings.fillOpacity) as Color;
  }, [settings.selectedYear, settings.dynamicsPeriod, settings.mode, settings.absolutePeriod, palette, settings.fillOpacity]);

  const getRadius = useCallback((d: Location): number => {
    if (settings.mode === 'absolute') {
      const change = Math.abs(getAbsoluteChange(d, settings.absolutePeriod));
      if (change === 0 || isNaN(change) || !isFinite(change)) {
        return settings.minRadius;
      }
      return Math.pow(change, settings.powerCoefficient);
    }

    const pop = d[`population_${settings.selectedYear}`];
    if (pop === 0 || isNaN(pop) || !isFinite(pop)) {
      return settings.minRadius;
    }
    return Math.pow(pop, settings.powerCoefficient);
  }, [settings.selectedYear, settings.powerCoefficient, settings.mode, settings.absolutePeriod, settings.minRadius]);

  const getLineWidth = useCallback((_d: Location): number => {
    return settings.strokeWidth;
  }, [settings.strokeWidth]);

  const getFilterValue = useCallback((d: Location): [number, number] => {
    const pop = d[`population_${settings.selectedYear}`] || 0;

    let dynamicsPercent = 0;
    const pop2002 = d.population_2002;
    const pop2010 = d.population_2010;
    const pop2021 = d.population_2021;

    if (settings.mode === 'absolute') {
      if (settings.absolutePeriod === '2002-2010') {
        if (pop2002 > 0) dynamicsPercent = ((pop2010 - pop2002) / pop2002) * 100;
      } else if (settings.absolutePeriod === '2010-2021') {
        if (pop2010 > 0) dynamicsPercent = ((pop2021 - pop2010) / pop2010) * 100;
      } else {
        if (pop2002 > 0) dynamicsPercent = ((pop2021 - pop2002) / pop2002) * 100;
      }
    } else {
      if (settings.selectedYear === '2010') {
        if (pop2002 > 0) dynamicsPercent = ((pop2010 - pop2002) / pop2002) * 100;
      } else if (settings.selectedYear === '2021') {
        if (settings.dynamicsPeriod === '2010-2021') {
          if (pop2010 > 0) dynamicsPercent = ((pop2021 - pop2010) / pop2010) * 100;
        } else {
          if (pop2002 > 0) dynamicsPercent = ((pop2021 - pop2002) / pop2002) * 100;
        }
      }
    }

    return [pop, dynamicsPercent];
  }, [settings.selectedYear, settings.mode, settings.absolutePeriod, settings.dynamicsPeriod]);

  const filterRange: [number, number][] = useMemo(() => {
    const popMin = settings.populationMin > 0 ? settings.populationMin : -Infinity;
    const popMax = settings.populationMax > 0 ? settings.populationMax : Infinity;
    const effectivePopMin = settings.showZeroPopulation ? popMin : Math.max(popMin, 0.1);

    return [
      [effectivePopMin, popMax],
      [settings.dynamicsMin, settings.dynamicsMax]
    ];
  }, [settings.populationMin, settings.populationMax, settings.dynamicsMin, settings.dynamicsMax, settings.showZeroPopulation]);

  const filterExtension = useMemo(() => new DataFilterExtension({ filterSize: 2 }), []);

  const layer = useMemo(() => {
    if (!data || data.length === 0) return null;

    return new ScatterplotLayer<Location>({
      id: 'locations-layer',
      data,
      getPosition: (d: Location) => [d.longitude, d.latitude],
      getFillColor,
      getRadius,
      stroked: settings.strokeWidth > 0,
      getLineColor: [...strokeRgb, 255] as Color,
      getLineWidth,
      radiusScale: settings.radiusScale,
      lineWidthUnits: 'pixels',
      lineWidthScale: 1,
      lineWidthMinPixels: settings.strokeWidth > 0 ? 0.5 : 0,
      lineWidthMaxPixels: 10,
      radiusMinPixels: settings.minRadius,
      extensions: [filterExtension],
      getFilterValue,
      filterRange,
      
      // ОТКЛЮЧАЕМ ПОДСВЕТКУ
      pickable: true,             // Оставляем для тултипов
      autoHighlight: false,       // Убираем жёлтое свечение
      highlightColor: [0, 0, 0, 0], // Прозрачный цвет
      
      // Правильная реактивность
      updateTriggers: {
        getFillColor: [settings.selectedYear, settings.dynamicsPeriod, settings.mode, settings.absolutePeriod, palette, settings.fillOpacity],
        getRadius: [settings.selectedYear, settings.powerCoefficient, settings.mode, settings.absolutePeriod, settings.minRadius],
        stroked: [settings.strokeWidth],
        getLineColor: [settings.strokeColor],
        getLineWidth: [settings.strokeWidth],
        getFilterValue: [settings.selectedYear, settings.mode, settings.absolutePeriod, settings.dynamicsPeriod],
        filterRange: [settings.populationMin, settings.populationMax, settings.dynamicsMin, settings.dynamicsMax, settings.showZeroPopulation],
      },
      parameters: {
        depthWriteEnabled: false,
        depthCompare: 'always'
      } as const,
    });
  }, [data, getFillColor, getRadius, getLineWidth, settings.radiusScale, settings.minRadius, settings.strokeWidth, settings.strokeColor, strokeRgb, filterExtension, getFilterValue, filterRange]);

  return useMemo(() => (layer ? [layer] : []), [layer]);
};
