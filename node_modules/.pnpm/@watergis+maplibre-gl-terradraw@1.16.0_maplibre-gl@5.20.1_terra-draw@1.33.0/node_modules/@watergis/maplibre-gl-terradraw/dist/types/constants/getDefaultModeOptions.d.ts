import type { ModeOptions } from '../interfaces/ModeOptions';
import { type GeoJSONStoreFeatures } from 'terra-draw';
export declare const polygonValidation: (feature: GeoJSONStoreFeatures, e: {
    updateType: string;
}) => {
    valid: boolean;
    reason?: string;
};
export declare const getDefaultModeOptions: () => ModeOptions;
//# sourceMappingURL=getDefaultModeOptions.d.ts.map