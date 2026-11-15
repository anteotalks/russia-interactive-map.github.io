export type MeasureUnitType = 'metric' | 'imperial';
export type MetricAreaUnit = 'square meters' | 'square kilometers' | 'ares' | 'hectares';
export type ImperialAreaUnit = 'square feet' | 'square yards' | 'acres' | 'square miles';
export type AreaUnitCallBackType = (valueInSquareMeters: number) => {
    area: number;
    unit: string;
};
export type areaUnitType = AreaUnitCallBackType | MetricAreaUnit | ImperialAreaUnit | undefined;
export type MetricDistanceUnit = 'kilometer' | 'meter' | 'centimeter';
export type ImperialDistanceUnit = 'mile' | 'foot' | 'inch';
export type DistanceUnitCallBackType = (valueInMeter: number) => {
    distance: number;
    unit: string;
};
export type distanceUnitType = DistanceUnitCallBackType | MetricDistanceUnit | ImperialDistanceUnit | undefined;
export type MetricElevationUnit = 'meter';
export type ImperialElevationUnit = 'foot';
export type MeasureUnitSymbolType = Record<MetricDistanceUnit | ImperialDistanceUnit | MetricAreaUnit | ImperialAreaUnit | MetricElevationUnit | ImperialElevationUnit, string>;
//# sourceMappingURL=MeasureUnit.d.ts.map