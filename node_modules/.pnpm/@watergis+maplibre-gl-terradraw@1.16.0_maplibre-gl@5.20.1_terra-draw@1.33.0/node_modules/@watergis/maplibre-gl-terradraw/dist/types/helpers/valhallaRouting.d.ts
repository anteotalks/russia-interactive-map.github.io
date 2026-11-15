import { type GeoJSONFeature, LngLat } from 'maplibre-gl';
export interface ValhallaTripSummary {
    has_time_restrictions: boolean;
    min_lat: number;
    min_lon: number;
    max_lat: number;
    max_lon: number;
    time: number;
    length: number;
    cost: number;
}
export interface ValhallaRoutingLocation {
    type: string;
    lat: number;
    lon: number;
    city: string;
    original_index: number;
}
export interface ValhallaRoutingLeg {
    maneuvers: {
        type: number;
        instruction: string;
        verbal_pre_transition_instruction: string;
        verbal_post_transition_instruction: string;
        time: number;
        length: number;
        cost: number;
        begin_shape_index: number;
        end_shape_index: number;
        rough: boolean;
        travel_mode: string;
        travel_type: string;
    }[];
    summary: ValhallaTripSummary;
    shape: string;
}
export interface ValhallaTripResult {
    trip: {
        locations: ValhallaRoutingLocation[];
        legs: ValhallaRoutingLeg[];
        summary: ValhallaTripSummary;
        status_message: string;
        status: number;
        units: string;
        language: string;
    };
    id: string;
}
export interface ValhallaError {
    error: string;
    error_code: number;
    status: string;
    status_code: number;
}
export declare const costingModelOptions: readonly [{
    readonly value: "pedestrian";
    readonly label: "Pedestrian";
}, {
    readonly value: "bicycle";
    readonly label: "Bicycle";
}, {
    readonly value: "auto";
    readonly label: "Car";
}];
export type costingModelType = (typeof costingModelOptions)[number]['value'];
export declare const routingDistanceUnitOptions: readonly [{
    readonly value: "kilometers";
    readonly label: "km";
}, {
    readonly value: "miles";
    readonly label: "mile";
}];
export type routingDistanceUnitType = (typeof routingDistanceUnitOptions)[number]['value'];
export declare class ValhallaRouting {
    private tripData;
    getTripData(): LngLat[];
    private url;
    private tripSummary;
    getTripSummary(): ValhallaTripSummary | undefined;
    constructor(url: string);
    clearFeatures(): void;
    calcRoute(tripData: LngLat[], costingModel: costingModelType, distanceUnit: routingDistanceUnitType): Promise<{
        feature: GeoJSONFeature;
        pointFeatures: {
            type: string;
            features: GeoJSONFeature[];
        };
    } | undefined>;
    private geoLineString;
    private geoPoint;
    private decodeShape;
}
//# sourceMappingURL=valhallaRouting.d.ts.map