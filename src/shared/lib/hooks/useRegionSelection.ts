import { useState, useCallback, useMemo } from 'react';
import { Location } from '../../../entities/location/lib/types';

export interface RegionStats {
  count: number;
  pop2002: number;
  pop2010: number;
  pop2021: number;
  mean2002: number;
  mean2010: number;
  mean2021: number;
  median2002: number;
  median2010: number;
  median2021: number;
  dyn2002_2010: number;
  dyn2010_2021: number;
  dyn2002_2021: number;
  isCrimean: boolean;
}

export interface UseRegionSelectionReturn {
  selectedRegions: Set<string>;
  toggleRegion: (region: string) => void;
  selectAll: (regions: string[]) => void;
  deselectAll: () => void;
  setSelectedRegions: (regions: Set<string>) => void;
  isRegionSelected: (region: string) => boolean;
  getRegionStats: (regionName: string, locations: Location[]) => RegionStats | null;
}

function calculateMedian(arr: number[]): number {
  if (arr.length === 0) return 0;
  const sorted = [...arr].sort((a, b) => a - b);
  const mid = Math.floor(sorted.length / 2);
  return sorted.length % 2 === 0 ? (sorted[mid - 1] + sorted[mid]) / 2 : sorted[mid];
}

function isCrimeanRegion(region: string): boolean {
  const lower = region.toLowerCase();
  return lower.includes('крым') || lower.includes('севастополь');
}

function getCorrectedPopulation(location: Location, year: '2002' | '2010' | '2021'): number {
  if (year === '2002' && isCrimeanRegion(location.region)) {
    return location.population_2010;
  }
  return location[`population_${year}`];
}

export function useRegionSelection(): UseRegionSelectionReturn {
  const [selectedRegions, setSelectedRegions] = useState<Set<string>>(new Set());

  const toggleRegion = useCallback((region: string) => {
    setSelectedRegions(prev => {
      const newSet = new Set(prev);
      if (newSet.has(region)) {
        newSet.delete(region);
      } else {
        newSet.add(region);
      }
      return newSet;
    });
  }, []);

  const selectAll = useCallback((regions: string[]) => {
    setSelectedRegions(new Set(regions));
  }, []);

  const deselectAll = useCallback(() => {
    setSelectedRegions(new Set());
  }, []);

  const isRegionSelected = useCallback((region: string) => {
    return selectedRegions.has(region);
  }, [selectedRegions]);

  const getRegionStats = useCallback((regionName: string, locations: Location[]): RegionStats | null => {
    const regionLocations = locations.filter(loc => loc.region === regionName);
    if (regionLocations.length === 0) return null;

    const count = regionLocations.length;
    const pop2002 = regionLocations.reduce((sum, loc) => sum + getCorrectedPopulation(loc, '2002'), 0);
    const pop2010 = regionLocations.reduce((sum, loc) => sum + loc.population_2010, 0);
    const pop2021 = regionLocations.reduce((sum, loc) => sum + loc.population_2021, 0);

    const mean2002 = pop2002 / count;
    const mean2010 = pop2010 / count;
    const mean2021 = pop2021 / count;

    const median2002 = calculateMedian(regionLocations.map(loc => getCorrectedPopulation(loc, '2002')));
    const median2010 = calculateMedian(regionLocations.map(loc => loc.population_2010));
    const median2021 = calculateMedian(regionLocations.map(loc => loc.population_2021));

    const dyn2002_2010 = pop2002 > 0 ? ((pop2010 - pop2002) / pop2002) * 100 : 0;
    const dyn2010_2021 = pop2010 > 0 ? ((pop2021 - pop2010) / pop2010) * 100 : 0;
    const dyn2002_2021 = pop2002 > 0 ? ((pop2021 - pop2002) / pop2002) * 100 : 0;

    return {
      count,
      pop2002,
      pop2010,
      pop2021,
      mean2002,
      mean2010,
      mean2021,
      median2002,
      median2010,
      median2021,
      dyn2002_2010,
      dyn2010_2021,
      dyn2002_2021,
      isCrimean: regionLocations.some(loc => isCrimeanRegion(loc.region)),
    };
  }, []);

  return {
    selectedRegions,
    toggleRegion,
    selectAll,
    deselectAll,
    setSelectedRegions,
    isRegionSelected,
    getRegionStats,
  };
}
