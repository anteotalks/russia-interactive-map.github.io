import { type TerraDrawMouseEvent, type TerraDrawKeyboardEvent, type TerraDrawAdapterStyling, type HexColor, TerraDrawExtend, type GeoJSONStoreFeatures } from 'terra-draw';
import { type Contour, type ContourType } from '../helpers/valhallaIsochrone';
import type { costingModelType } from '../helpers/valhallaRouting';
declare const TerraDrawBaseDrawMode: typeof TerraDrawExtend.TerraDrawBaseDrawMode;
export type IsochronePointStyling = {
    pointColor?: HexColor;
    pointWidth?: number;
    pointOutlineColor?: HexColor;
    pointOutlineWidth?: number;
    polygonFillOpacity?: number;
    polygonOutlineWidth?: number;
};
export type ValhallaIsochroneModeOptions = {
    url: string;
    costingModel?: costingModelType;
    contours?: Contour[];
    styles?: Partial<IsochronePointStyling>;
};
export declare abstract class TerraDrawValhallaIsochroneBaseMode extends TerraDrawBaseDrawMode<IsochronePointStyling> {
    protected abstract readonly contourType: ContourType;
    private _url;
    private _costingModel;
    private _contours;
    private pendingPointIds;
    get url(): string;
    set url(value: string);
    get costingModel(): costingModelType;
    set costingModel(value: costingModelType);
    get contours(): Contour[];
    set contours(value: Contour[]);
    constructor(options: ValhallaIsochroneModeOptions);
    start(): void;
    stop(): void;
    cleanUp(): void;
    onClick(event: TerraDrawMouseEvent): void;
    onMouseMove(_event: TerraDrawMouseEvent): void;
    onKeyUp(_event: TerraDrawKeyboardEvent): void;
    styleFeature(feature: GeoJSONStoreFeatures): TerraDrawAdapterStyling;
    validateFeature(feature: GeoJSONStoreFeatures): {
        valid: boolean;
        reason?: string;
    };
    private computeIsochrone;
    private deletePendingPoint;
}
export {};
//# sourceMappingURL=TerraDrawValhallaIsochroneBaseMode.d.ts.map