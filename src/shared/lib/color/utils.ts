import { Location } from '../../../entities/location/lib/types';
import { DynamicsPeriod } from '../../../entities/location/lib/types';

export type RgbColor = [number, number, number];
export type RgbaColor = [number, number, number, number];

export const hexToRgb = (hex: string): RgbColor => {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  return result 
    ? [parseInt(result[1], 16), parseInt(result[2], 16), parseInt(result[3], 16)]
    : [0, 0, 0];
};

export const getColorFromPalette = (palette: string[], normalizedValue: number, opacity: number = 0.78): RgbaColor => {
  const alpha = Math.round(opacity * 255);
  if (palette.length === 0) return [128, 128, 128, alpha];
  if (palette.length === 3) {
    if (normalizedValue <= 0.5) {
      const c1 = hexToRgb(palette[0]);
      const c2 = hexToRgb(palette[1]);
      const f = normalizedValue * 2;
      return [
        Math.round(c1[0] + (c2[0] - c1[0]) * f),
        Math.round(c1[1] + (c2[1] - c1[1]) * f),
        Math.round(c1[2] + (c2[2] - c1[2]) * f),
        alpha,
      ];
    } else {
      const c1 = hexToRgb(palette[1]);
      const c2 = hexToRgb(palette[2]);
      const f = (normalizedValue - 0.5) * 2;
      return [
        Math.round(c1[0] + (c2[0] - c1[0]) * f),
        Math.round(c1[1] + (c2[1] - c1[1]) * f),
        Math.round(c1[2] + (c2[2] - c1[2]) * f),
        alpha,
      ];
    }
  }
  const index = Math.min(Math.floor(normalizedValue * palette.length), palette.length - 1);
  const [r, g, b] = hexToRgb(palette[index]);
  return [r, g, b, alpha];
};

export const getColorByDynamics = (changePercent: number, palette: string[], opacity: number = 0.78): RgbaColor => {
  if (palette.length < 3) return [128, 128, 128, Math.round(opacity * 255)];
  const clamped = Math.max(-100, Math.min(100, changePercent));
  const normalized = (clamped + 100) / 200;
  return getColorFromPalette(palette, normalized, opacity);
};

export const getNeutralColor = (palette: string[], opacity: number = 0.78): RgbaColor => {
  if (palette.length >= 3) {
    const [r, g, b] = hexToRgb(palette[1]);
    return [r, g, b, Math.round(opacity * 255)];
  }
  return [128, 128, 128, Math.round(opacity * 255)];
};

export const invertPalette = (colors: string[]): string[] => {
  if (colors.length < 2) return colors;
  const reversed = [...colors];
  [reversed[0], reversed[reversed.length - 1]] = [reversed[reversed.length - 1], reversed[0]];
  return reversed;
};

export const getAbsoluteChange = (location: Location, period: DynamicsPeriod): number => {
  switch(period) {
    case '2002-2010':
      return location.population_2010 - location.population_2002;
    case '2010-2021':
      return location.population_2021 - location.population_2010;
    case '2002-2021':
    default:
      return location.population_2021 - location.population_2002;
  }
};

export const getColorByAbsoluteChange = (change: number, palette: string[], opacity: number = 0.78): RgbaColor => {
  const alpha = Math.round(opacity * 255);
  if (palette.length < 3) return [128, 128, 128, alpha];
  if (change > 0) {
    const [r, g, b] = hexToRgb(palette[palette.length - 1]);
    return [r, g, b, alpha];
  }
  if (change < 0) {
    const [r, g, b] = hexToRgb(palette[0]);
    return [r, g, b, alpha];
  }
  const [r, g, b] = hexToRgb(palette[1]);
  return [r, g, b, alpha];
};
