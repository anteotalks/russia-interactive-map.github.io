import type { ModeOptions } from './ModeOptions';
import type { TerradrawMode } from './TerradrawMode';
import type { TerraDrawMapLibreGLAdapter } from 'terra-draw-maplibre-gl-adapter';
import type { TerraDrawModeUndoRedoInterface, TerraDrawSessionUndoRedoInterface, TerraDrawUndoRedoKeyboardShortcutsInterface } from 'terra-draw';
import type { ModeKeyboardShortcuts } from './KeyboardShortcutOptions';
export type TerraDrawMapLibreGLAdapterConfig = Omit<ConstructorParameters<typeof TerraDrawMapLibreGLAdapter>[0], 'map'>;
export interface TerradrawControlOptions {
    modes?: TerradrawMode[];
    open?: boolean;
    modeOptions?: ModeOptions;
    adapterOptions?: TerraDrawMapLibreGLAdapterConfig;
    showDeleteConfirmation?: boolean;
    keyboardShortcuts?: ModeKeyboardShortcuts;
    undoRedo?: {
        modeLevel?: TerraDrawModeUndoRedoInterface;
        sessionLevel?: TerraDrawSessionUndoRedoInterface;
        keyboardShortcuts?: TerraDrawUndoRedoKeyboardShortcutsInterface;
    };
}
//# sourceMappingURL=TerradrawControlOptions.d.ts.map