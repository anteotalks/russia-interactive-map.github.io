import { Map, type StyleSpecification } from 'maplibre-gl';
import { MaplibreTerradrawControl } from './MaplibreTerradrawControl';
import type { MeasureUnitType, areaUnitType, distanceUnitType, MeasureControlOptions, MeasureUnitSymbolType } from '../interfaces';
export declare class MaplibreMeasureControl extends MaplibreTerradrawControl {
    private measureOptions;
    private elevationCache;
    get measureUnitType(): MeasureUnitType;
    set measureUnitType(value: MeasureUnitType);
    get distancePrecision(): number;
    set distancePrecision(value: number);
    get distanceUnit(): distanceUnitType;
    set distanceUnit(value: distanceUnitType);
    get areaPrecision(): number;
    set areaPrecision(value: number);
    get areaUnit(): areaUnitType;
    set areaUnit(value: areaUnitType);
    get measureUnitSymbols(): MeasureUnitSymbolType;
    set measureUnitSymbols(value: MeasureUnitSymbolType);
    get computeElevation(): boolean;
    set computeElevation(value: boolean);
    get fontGlyphs(): string[];
    set fontGlyphs(fontNames: string[]);
    constructor(options?: MeasureControlOptions);
    onAdd(map: Map): HTMLElement;
    onRemove(): void;
    activate(): void;
    recalc(): void;
    cleanStyle(style: StyleSpecification, options?: {
        excludeTerraDrawLayers?: boolean;
        onlyTerraDrawLayers?: boolean;
    }): StyleSpecification;
    private registerMesureControl;
    private handleTerradrawDeselect;
    private handleTerradrawFeatureReady;
    private handleTerradrawFeatureChanged;
    private unregisterMesureControl;
    private replaceGeoJSONSource;
    private computeElevationByLineFeatureID;
    private recalculateElevationUnits;
    private updateElevationUnitsInSource;
    private measurePolygon;
    private measureLine;
    private measurePoint;
    private onFeatureDeleted;
}
//# sourceMappingURL=MaplibreMeasureControl.d.ts.map