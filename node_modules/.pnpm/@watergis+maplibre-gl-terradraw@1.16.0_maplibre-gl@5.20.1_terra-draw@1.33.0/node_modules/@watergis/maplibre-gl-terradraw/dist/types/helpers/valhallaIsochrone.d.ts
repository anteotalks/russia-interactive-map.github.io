import type { GeoJSONStoreFeatures } from 'terra-draw';
import type { costingModelType } from './valhallaRouting';
export declare const contourTypeOptions: readonly [{
    readonly value: "time";
    readonly label: "Time";
}, {
    readonly value: "distance";
    readonly label: "Distance";
}];
export type ContourType = (typeof contourTypeOptions)[number]['value'];
export interface Contour {
    time?: number;
    distance?: number;
    color: string;
}
export declare class ValhallaIsochrone {
    private url;
    constructor(url: string);
    calcIsochrone(lon: number, lat: number, contourType: ContourType, costingModel: costingModelType, contours: Contour[]): Promise<{
        type: "FeatureCollection";
        features: GeoJSONStoreFeatures[];
    }>;
}
//# sourceMappingURL=valhallaIsochrone.d.ts.map