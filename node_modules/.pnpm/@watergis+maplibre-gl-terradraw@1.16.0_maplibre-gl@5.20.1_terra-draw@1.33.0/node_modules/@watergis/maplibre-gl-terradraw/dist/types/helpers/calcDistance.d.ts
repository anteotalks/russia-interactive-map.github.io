import type { GeoJSONStoreFeatures } from 'terra-draw';
import type { Map } from 'maplibre-gl';
import type { MeasureUnitType, distanceUnitType, TerrainSource, MeasureUnitSymbolType } from '../interfaces';
export declare const calcDistance: (feature: GeoJSONStoreFeatures, unitType: MeasureUnitType, distancePrecision: number, forceUnit?: distanceUnitType, measureUnitSymbols?: MeasureUnitSymbolType, map?: Map, computeElevation?: boolean, terrainSource?: TerrainSource) => GeoJSONStoreFeatures;
//# sourceMappingURL=calcDistance.d.ts.map