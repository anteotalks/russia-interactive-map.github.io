import type { TerrainSource, MeasureUnitType, MeasureUnitSymbolType } from '../interfaces';
import type { GeoJSONStoreFeatures } from 'terra-draw';
import { Map } from 'maplibre-gl';
export declare const queryElevationByPoint: (feature: GeoJSONStoreFeatures, map?: Map, computeElevation?: boolean, terrainSource?: TerrainSource, measureUnitType?: MeasureUnitType, measureUnitSymbols?: MeasureUnitSymbolType) => GeoJSONStoreFeatures;
//# sourceMappingURL=queryElevationByPoint.d.ts.map