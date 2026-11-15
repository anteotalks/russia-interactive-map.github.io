import { type TerraDrawMouseEvent, type TerraDrawKeyboardEvent, type TerraDrawAdapterStyling, type HexColor, TerraDrawExtend, type GeoJSONStoreFeatures } from 'terra-draw';
declare const TerraDrawBaseDrawMode: typeof TerraDrawExtend.TerraDrawBaseDrawMode;
export type TextModeStyling = {
    pointColor?: HexColor;
    pointWidth?: number;
    pointOutlineColor?: HexColor;
    pointOutlineWidth?: number;
    textColor?: HexColor;
    textSize?: number;
    textSelectedSize?: number;
    textHaloColor?: HexColor;
    textSelectedHaloColor?: HexColor;
    textHaloWidth?: number;
    textFont?: string[];
};
export type DOMStyles = {
    textArea?: Partial<CSSStyleDeclaration>;
    submitButton?: Partial<CSSStyleDeclaration>;
};
export type TextModeOptions = {
    styles?: Partial<TextModeStyling>;
    placeholder?: string;
    onTextCommit?: (featureId: TerraDrawExtend.FeatureId, text: string) => void;
    draggable?: boolean;
    editable?: boolean;
    domStyles?: DOMStyles;
};
export declare class TerraDrawTextMode extends TerraDrawBaseDrawMode<Omit<TextModeStyling, 'textFont'>> {
    mode: string;
    options?: TextModeOptions;
    private editable;
    private activeWrapper;
    private activeTextarea;
    private activeFeatureId;
    private activeLngLat;
    private _mapContainer;
    private rafId?;
    private repositionRafId?;
    private lastReposition;
    constructor(options?: TextModeOptions);
    start(): void;
    stop(): void;
    cleanUp(): void;
    getMap(): HTMLElement | null;
    private createTextAreaWrapper;
    private createTextAreaElement;
    private resizeTextarea;
    private createTextAreaTooltip;
    private createSubmitButton;
    private createDomStyles;
    private mountTextAreaPopup;
    private showTextarea;
    private editText;
    private getFeatureLngLat;
    private startRepositionLoop;
    private stopRepositionLoop;
    private commitText;
    private dismissTextarea;
    onClick(event: TerraDrawMouseEvent): void;
    onKeyUp(event: TerraDrawKeyboardEvent): void;
    onMouseMove(event: TerraDrawMouseEvent): void;
    styleFeature(feature: GeoJSONStoreFeatures): TerraDrawAdapterStyling;
    validateFeature(feature: GeoJSONStoreFeatures): {
        valid: boolean;
        reason?: string;
    };
    private getNearestPointFeature;
}
export {};
//# sourceMappingURL=TerraDrawTextMode.d.ts.map