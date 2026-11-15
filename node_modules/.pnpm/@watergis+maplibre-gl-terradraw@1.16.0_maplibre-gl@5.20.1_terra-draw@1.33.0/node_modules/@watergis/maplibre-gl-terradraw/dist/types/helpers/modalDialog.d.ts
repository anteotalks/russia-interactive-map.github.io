export declare class ModalDialog {
    private className;
    private dialog;
    private title;
    constructor(className: string, title: string);
    create(parentElement: HTMLElement, addConttent: (contentElement: HTMLDivElement) => HTMLDivElement): void;
    open(): void;
    close(): void;
    createSegmentButtons(options: {
        value: string;
        label: string;
    }[], defaultValue: string, onClick?: (value: string) => void): HTMLDivElement;
}
//# sourceMappingURL=modalDialog.d.ts.map