import type { ModeOptions } from './ModeOptions';
import type { TerradrawValhallaMode } from './TerradrawMode';
import type { Contour, routingDistanceUnitType, costingModelType } from '../helpers';
import type { SymbolLayerSpecification } from 'maplibre-gl';
import type { TerraDrawMapLibreGLAdapterConfig } from './TerradrawControlOptions';
import type { ModeKeyboardShortcuts } from './KeyboardShortcutOptions';
export interface ValhallaControlOptions {
    modes?: TerradrawValhallaMode[];
    open?: boolean;
    modeOptions?: ModeOptions;
    adapterOptions?: TerraDrawMapLibreGLAdapterConfig;
    keyboardShortcuts?: ModeKeyboardShortcuts;
    showDeleteConfirmation?: boolean;
    routingLineLayerNodeLabelSpec?: SymbolLayerSpecification;
    timeIsochroneLabelLayerSpec?: SymbolLayerSpecification;
    distanceIsochroneLabelLayerSpec?: SymbolLayerSpecification;
}
export interface ValhallaOptions {
    url?: string;
    routingOptions?: {
        costingModel?: costingModelType;
        distanceUnit?: routingDistanceUnitType;
    };
    isochroneOptions?: {
        timeCostingModel?: costingModelType;
        distanceCostingModel?: costingModelType;
        contours?: Contour[];
    };
}
//# sourceMappingURL=ValhallaControlOptions.d.ts.map