import type { ElevationCacheConfig, TerrainSource, MeasureUnitType, MeasureUnitSymbolType } from '../interfaces';
import type { GeoJSONStoreFeatures } from 'terra-draw';
import { type CacheInterface } from './memoryCache';
export declare const queryElevationFromRasterDEM: (points: GeoJSONStoreFeatures[], terrainSource?: TerrainSource, cacheConfig?: ElevationCacheConfig, cacheInstance?: CacheInterface<number>, measureUnitType?: MeasureUnitType, measureUnitSymbols?: MeasureUnitSymbolType) => Promise<GeoJSONStoreFeatures[]>;
//# sourceMappingURL=queryElevationFromRasterDEM.d.ts.map