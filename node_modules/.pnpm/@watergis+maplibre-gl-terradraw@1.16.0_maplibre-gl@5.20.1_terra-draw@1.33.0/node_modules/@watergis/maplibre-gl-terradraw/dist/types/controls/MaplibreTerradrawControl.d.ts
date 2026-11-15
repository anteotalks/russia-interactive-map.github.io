import type { ControlPosition, IControl, Map, StyleSpecification, SymbolLayerSpecification } from 'maplibre-gl';
import { TerraDraw, TerraDrawExtend, type GeoJSONStoreFeatures, type GeoJSONStoreGeometries } from 'terra-draw';
import type { TerradrawControlOptions, EventType, TerradrawMode, EventArgs } from '../interfaces';
import { ModeKeyboardShortcutController } from '../helpers';
import type { TextModeStyling } from '../modes/TerraDrawTextMode';
export declare class MaplibreTerradrawControl implements IControl {
    protected controlContainer?: HTMLElement;
    protected map?: Map;
    protected modeButtons: {
        [key: string]: HTMLButtonElement;
    };
    protected _isExpanded: boolean;
    protected _cssPrefix: string;
    protected _fontGlyphs?: string[];
    get isExpanded(): boolean;
    get fontGlyphs(): string[] | undefined;
    set fontGlyphs(fontNames: string[]);
    protected applyFontGlyphs(fontNames: string[], layers: (SymbolLayerSpecification | undefined)[]): void;
    protected get cssPrefix(): string;
    set isExpanded(value: boolean);
    get showDeleteConfirmation(): boolean;
    set showDeleteConfirmation(value: boolean);
    protected terradraw?: TerraDraw;
    protected options: TerradrawControlOptions;
    protected modeKeyboardShortcutController?: ModeKeyboardShortcutController;
    protected events: {
        [key: string]: [(event: EventArgs) => void];
    };
    protected defaultMode: string;
    constructor(options?: TerradrawControlOptions);
    getDefaultPosition(): ControlPosition;
    onAdd(map: Map): HTMLElement;
    onRemove(): void;
    on(event: EventType, callback: (event: EventArgs) => void): void;
    off(event: EventType, callback: (event: EventArgs) => void): void;
    protected dispatchEvent(event: EventType, args?: {
        [key: string]: unknown;
    }): void;
    activate(): void;
    deactivate(): void;
    protected handleModeChange(mode: string, target: TerraDraw): void;
    protected syncButtonStates(mode: string): void;
    getTerraDrawInstance(): TerraDraw | undefined;
    protected handleHistoryChange(event: {
        undoSize: number;
        redoSize: number;
    }): void;
    protected toggleEditor(): void;
    resetActiveMode(): void;
    protected addTerradrawButton(mode: TerradrawMode): void;
    getFeatures(onlySelected?: boolean): {
        type: string;
        features: GeoJSONStoreFeatures<GeoJSONStoreGeometries>[];
    } | undefined;
    cleanStyle(style: StyleSpecification, options?: {
        excludeTerraDrawLayers?: boolean;
        onlyTerraDrawLayers?: boolean;
    }): StyleSpecification;
    protected showDeleteConfirmationDialog(onConfirm: () => void, title?: string, message?: string): void;
    protected handleDeleteAllFeatures(): void;
    protected handleDeleteSelectedFeatures(): void;
    protected deleteSelectedTextSymbolLayer(selectedFeatures: GeoJSONStoreFeatures<GeoJSONStoreGeometries>[]): void;
    protected handleDownload(): void;
    protected toggleButtonsWhenNoFeature(): void;
    protected toggleDeleteSelectionButton(): void;
    protected clearExtendedFeatures(sourceIds: string[], ids?: TerraDrawExtend.FeatureId[] | undefined): void;
    protected createTerradrawTextLayer(map: Map, styles?: TextModeStyling): void;
    protected addTextFeaturesToSource(features: GeoJSONStoreFeatures<GeoJSONStoreGeometries>[], map: Map, styles?: TextModeStyling): void;
    protected getTextModeStyling(): Partial<TextModeStyling>;
    protected selectTextLabelLayer(featureId: TerraDrawExtend.FeatureId): void;
    protected resetTextLabelLayer(): void;
    protected clearTextLayers(): void;
}
//# sourceMappingURL=MaplibreTerradrawControl.d.ts.map