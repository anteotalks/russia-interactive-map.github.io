import type { StyleSpecification } from 'maplibre-gl';
export declare const TERRADRAW_SOURCE_IDS: string[];
export declare const TERRADRAW_MEASURE_SOURCE_IDS: string[];
export declare const TERRADRAW_VALHALLA_SOURCE_IDS: string[];
export declare const cleanMaplibreStyle: (style: StyleSpecification, options?: {
    excludeTerraDrawLayers?: boolean;
    onlyTerraDrawLayers?: boolean;
}, sourceIds?: string[], prefixId?: string) => StyleSpecification;
//# sourceMappingURL=cleanMaplibreStyle.d.ts.map