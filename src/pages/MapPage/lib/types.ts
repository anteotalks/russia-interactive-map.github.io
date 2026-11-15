export type YearType = '2002' | '2010' | '2021';

export interface VisualizationSettings {
  selectedYear: YearType;
  minRadius: number;
  powerCoefficient: number;
  radiusScale: number;
  strokeWidth: number;
  strokeColor: string;
}
