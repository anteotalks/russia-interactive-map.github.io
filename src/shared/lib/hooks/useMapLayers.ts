/**
 * Хук для слоя точек с фильтрацией по населению, динамике и регионам
 * Использует DataFilterExtension с filterSize: 3
 * Третье измерение – индекс региона для фильтрации по выбранным регионам
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
import { FilterDirection } from '../../../shared/types/visualization';

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
  absoluteFilter: FilterDirection;
  selectedRegionIndices: Set<number> | null;
  onClick?: (info: any) => void;
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

  const regionToIndexMap = useMemo(() => {
    if (!data) return new Map<string, number>();
    const uniqueRegions = Array.from(new Set(data.map(loc => loc.region))).sort();
    return new Map(uniqueRegions.map((region, index) => [region, index]));
  }, [data]);

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

  const getFilterValue = useCallback((d: Location): [number, number, number] => {
    const pop = d[`population_${settings.selectedYear}`] || 0;
    const regionIndex = regionToIndexMap.get(d.region) ?? -1;

    let dynamicsPercent = 0;
    const pop2002 = d.population_2002;
    const pop2010 = d.population_2010;
    const pop2021 = d.population_2021;

    if (settings.mode === 'absolute') {
      let change = 0;
      if (settings.absolutePeriod === '2002-2010') {
        if (pop2002 > 0) change = pop2010 - pop2002;
      } else if (settings.absolutePeriod === '2010-2021') {
        if (pop2010 > 0) change = pop2021 - pop2010;
      } else {
        if (pop2002 > 0) change = pop2021 - pop2002;
      }
      dynamicsPercent = pop2002 > 0 ? (change / pop2002) * 100 : 0;
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

    return [pop, dynamicsPercent, regionIndex];
  }, [settings.selectedYear, settings.mode, settings.absolutePeriod, settings.dynamicsPeriod, regionToIndexMap]);

  const filterRange = useMemo((): [number, number][] => {
    const popMin = settings.populationMin > 0 ? settings.populationMin : -Infinity;
    const popMax = settings.populationMax > 0 ? settings.populationMax : Infinity;
    const effectivePopMin = settings.showZeroPopulation ? popMin : Math.max(popMin, 0.1);

    let dynMin = settings.dynamicsMin;
    let dynMax = settings.dynamicsMax;

    if (settings.mode === 'absolute') {
      if (settings.absoluteFilter === 'growth') {
        dynMin = 0.001;
        dynMax = Infinity;
      } else if (settings.absoluteFilter === 'decline') {
        dynMin = -Infinity;
        dynMax = -0.001;
      }
    }

    let regionMin = -Infinity;
    let regionMax = Infinity;

    if (settings.selectedRegionIndices && settings.selectedRegionIndices.size > 0) {
      const indicesArray = Array.from(settings.selectedRegionIndices);
      if (indicesArray.length > 0) {
        regionMin = Math.min(...indicesArray);
        regionMax = Math.max(...indicesArray);
      } else {
        regionMin = -Infinity;
        regionMax = Infinity;
      }
    }

    return [
      [effectivePopMin, popMax],
      [dynMin, dynMax],
      [regionMin, regionMax]
    ];
  }, [
    settings.populationMin, settings.populationMax, settings.showZeroPopulation,
    settings.dynamicsMin, settings.dynamicsMax,
    settings.mode, settings.absoluteFilter,
    settings.selectedRegionIndices
  ]);

  const filterExtension = useMemo(() => new DataFilterExtension({ filterSize: 3 }), []);

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
      pickable: true,
      autoHighlight: false,
      highlightColor: [0, 0, 0, 0],
      onClick: settings.onClick,
      updateTriggers: {
        getFillColor: [settings.selectedYear, settings.dynamicsPeriod, settings.mode, settings.absolutePeriod, palette, settings.fillOpacity],
        getRadius: [settings.selectedYear, settings.powerCoefficient, settings.mode, settings.absolutePeriod, settings.minRadius],
        stroked: [settings.strokeWidth],
        getLineColor: [settings.strokeColor],
        getLineWidth: [settings.strokeWidth],
        getFilterValue: [settings.selectedYear, settings.mode, settings.absolutePeriod, settings.dynamicsPeriod, regionToIndexMap],
        filterRange: [
          settings.populationMin, settings.populationMax, settings.showZeroPopulation,
          settings.dynamicsMin, settings.dynamicsMax,
          settings.mode, settings.absoluteFilter,
          settings.selectedRegionIndices
        ],
        onClick: [settings.onClick],
      },
      parameters: {
        depthWriteEnabled: false,
        depthCompare: 'always'
      } as const,
    });
  }, [
    data, getFillColor, getRadius, getLineWidth,
    settings.radiusScale, settings.minRadius,
    settings.strokeWidth, settings.strokeColor, strokeRgb,
    filterExtension, getFilterValue, filterRange,
    settings.selectedYear, settings.dynamicsPeriod, settings.mode, settings.absolutePeriod,
    settings.powerCoefficient, palette, settings.fillOpacity,
    settings.populationMin, settings.populationMax, settings.showZeroPopulation,
    settings.dynamicsMin, settings.dynamicsMax,
    settings.absoluteFilter,
    settings.selectedRegionIndices,
    regionToIndexMap,
    settings.onClick,
  ]);

  return useMemo(() => (layer ? [layer] : []), [layer]);
};
