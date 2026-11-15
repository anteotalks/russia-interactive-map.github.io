import type { CircleLayerSpecification, SymbolLayerSpecification } from 'maplibre-gl';
import type { ModeOptions } from './ModeOptions';
import type { distanceUnitType, ImperialAreaUnit, ImperialDistanceUnit, MetricAreaUnit, MetricDistanceUnit } from './MeasureUnit';
import type { MeasureUnitType, areaUnitType } from './MeasureUnit';
import type { TerradrawMode } from './TerradrawMode';
import type { TerrainSource } from './TerrainSource';
import type { ElevationCacheConfig } from './ElevationCacheConfig';
import type { TerraDrawMapLibreGLAdapterConfig } from './TerradrawControlOptions';
import type { TerraDrawModeUndoRedoInterface, TerraDrawSessionUndoRedoInterface, TerraDrawUndoRedoKeyboardShortcutsInterface } from 'terra-draw';
import type { ModeKeyboardShortcuts } from './KeyboardShortcutOptions';
export interface MeasureControlOptions {
    modes?: TerradrawMode[];
    open?: boolean;
    modeOptions?: ModeOptions;
    adapterOptions?: TerraDrawMapLibreGLAdapterConfig;
    keyboardShortcuts?: ModeKeyboardShortcuts;
    showDeleteConfirmation?: boolean;
    pointLayerLabelSpec?: SymbolLayerSpecification;
    lineLayerLabelSpec?: SymbolLayerSpecification;
    routingLineLayerNodeSpec?: CircleLayerSpecification;
    polygonLayerSpec?: SymbolLayerSpecification;
    measureUnitType?: MeasureUnitType;
    distancePrecision?: number;
    distanceUnit?: distanceUnitType;
    areaPrecision?: number;
    areaUnit?: areaUnitType;
    measureUnitSymbols?: Record<MetricDistanceUnit | ImperialDistanceUnit | MetricAreaUnit | ImperialAreaUnit, string>;
    computeElevation?: boolean;
    terrainSource?: TerrainSource;
    elevationCacheConfig?: ElevationCacheConfig;
    undoRedo?: {
        modeLevel?: TerraDrawModeUndoRedoInterface;
        sessionLevel?: TerraDrawSessionUndoRedoInterface;
        keyboardShortcuts?: TerraDrawUndoRedoKeyboardShortcutsInterface;
    };
}
//# sourceMappingURL=MeasureControlOptions.d.ts.map