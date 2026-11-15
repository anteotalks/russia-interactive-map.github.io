import { type ModeKeyboardShortcuts, type TerradrawValhallaMode } from '../interfaces';
import type { TerraDraw } from 'terra-draw';
export type ModeActionsOptions = {
    onDelete?: () => void;
    onDeleteSelected?: () => void;
    onValhallaMode?: (mode: TerradrawValhallaMode) => void;
    onValhallaSettingsSelected?: () => void;
    onDownload?: () => void;
};
export declare class ModeKeyboardShortcutController {
    private terradraw;
    private controlContainer?;
    private modeActions?;
    private handler;
    private shortcuts;
    constructor(terradraw: TerraDraw, controlContainer?: HTMLElement | undefined, shortcuts?: ModeKeyboardShortcuts, modeActions?: ModeActionsOptions | undefined);
    mount(): void;
    private initialiseModeActionKeyboardShortcuts;
    private matchesShortcut;
    private executeAction;
    private validateShortcuts;
    destroy(): void;
    private syncButtonStates;
}
//# sourceMappingURL=modeKeyboardShortcutController.d.ts.map