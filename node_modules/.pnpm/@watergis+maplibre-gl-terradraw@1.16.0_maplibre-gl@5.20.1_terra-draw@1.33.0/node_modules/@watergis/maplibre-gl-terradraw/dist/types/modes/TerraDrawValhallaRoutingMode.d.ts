import { TerraDrawLineStringMode, TerraDrawExtend, type TerraDrawMouseEvent, type TerraDrawKeyboardEvent, type TerraDrawAdapterStyling, type GeoJSONStoreFeatures } from 'terra-draw';
import { type costingModelType, type routingDistanceUnitType } from '../helpers/valhallaRouting';
export type LineStringModeStyling = NonNullable<NonNullable<ConstructorParameters<typeof TerraDrawLineStringMode>[0]>['styles']>;
export type RoutingNodePointStyling = {
    startPointColor: TerraDrawExtend.HexColorStyling;
    startPointWidth: TerraDrawExtend.NumericStyling;
    startPointOutlineColor: TerraDrawExtend.HexColorStyling;
    startPointOutlineWidth: TerraDrawExtend.NumericStyling;
    goalPointColor: TerraDrawExtend.HexColorStyling;
    goalPointWidth: TerraDrawExtend.NumericStyling;
    goalPointOutlineColor: TerraDrawExtend.HexColorStyling;
    goalPointOutlineWidth: TerraDrawExtend.NumericStyling;
    viaPointColor: TerraDrawExtend.HexColorStyling;
    viaPointWidth: TerraDrawExtend.NumericStyling;
    viaPointOutlineColor: TerraDrawExtend.HexColorStyling;
    viaPointOutlineWidth: TerraDrawExtend.NumericStyling;
};
export type RoutingModeStyling = LineStringModeStyling & RoutingNodePointStyling;
export type ValhallaRoutingModeOptions = {
    url: string;
    costingModel?: costingModelType;
    distanceUnit?: routingDistanceUnitType;
    styles?: Partial<RoutingModeStyling>;
};
export declare class TerraDrawValhallaRoutingMode extends TerraDrawLineStringMode {
    private _url;
    private _costingModel;
    private _distanceUnit;
    private pendingLineId;
    private trackedLineIds;
    get url(): string;
    set url(value: string);
    get costingModel(): costingModelType;
    set costingModel(value: costingModelType);
    get distanceUnit(): routingDistanceUnitType;
    set distanceUnit(value: routingDistanceUnitType);
    constructor(options: ValhallaRoutingModeOptions);
    onClick(event: TerraDrawMouseEvent): void;
    onKeyUp(event: TerraDrawKeyboardEvent): void;
    private finishAndRoute;
    styleFeature(feature: GeoJSONStoreFeatures): TerraDrawAdapterStyling;
    validateFeature(feature: GeoJSONStoreFeatures): {
        valid: boolean;
        reason?: string;
    };
    protected computeRoute(featureId: TerraDrawExtend.FeatureId, coordinates: [number, number][]): Promise<void>;
}
//# sourceMappingURL=TerraDrawValhallaRoutingMode.d.ts.map