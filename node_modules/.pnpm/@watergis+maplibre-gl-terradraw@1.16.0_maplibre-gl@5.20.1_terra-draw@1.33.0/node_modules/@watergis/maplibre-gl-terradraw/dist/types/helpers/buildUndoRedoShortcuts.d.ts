import type { KeyboardShortcut } from '../interfaces';
export type UndoRedoKeyboardShortcut = {
    key: KeyboardShortcut['key'];
    heldKeys: KeyboardShortcut['heldKeys'];
};
export declare const buildUndoRedoShortcuts: (shortcut: KeyboardShortcut) => UndoRedoKeyboardShortcut[];
//# sourceMappingURL=buildUndoRedoShortcuts.d.ts.map