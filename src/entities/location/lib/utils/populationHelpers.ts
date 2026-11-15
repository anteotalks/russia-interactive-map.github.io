import { Location } from '../types';
import { DynamicsPeriod } from '../../../../shared/types/visualization';

export function isCrimeanRegion(region: string): boolean {
  const lower = region.toLowerCase();
  return lower.includes('крым') || lower.includes('севастополь');
}

export function getPopulationForYear(
  location: Location,
  year: '2002' | '2010' | '2021'
): number {
  if (year === '2002' && isCrimeanRegion(location.region)) {
    return location.population_2010;
  }
  return location[`population_${year}`];
}

export function getPopulationsForPeriod(
  location: Location,
  period: DynamicsPeriod
): { start: number; end: number } {
  const isCrimea = isCrimeanRegion(location.region);

  switch (period) {
    case '2002-2010':
      return {
        start: isCrimea ? location.population_2010 : location.population_2002,
        end: location.population_2010,
      };
    case '2010-2021':
      return {
        start: location.population_2010,
        end: location.population_2021,
      };
    case '2002-2021':
    default:
      return {
        start: isCrimea ? location.population_2010 : location.population_2002,
        end: location.population_2021,
      };
  }
}

export function calculateDynamicsPercent(
  location: Location,
  period: DynamicsPeriod
): number {
  const { start, end } = getPopulationsForPeriod(location, period);
  if (start === 0) return 0;
  return ((end - start) / start) * 100;
}

export function calculateAbsoluteChange(
  location: Location,
  period: DynamicsPeriod
): number {
  const { start, end } = getPopulationsForPeriod(location, period);
  return end - start;
}
