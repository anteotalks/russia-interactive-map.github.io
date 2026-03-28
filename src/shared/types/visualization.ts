export type VisualizationMode = 'dynamics' | 'absolute';
export type DynamicsPeriod = '2002-2010' | '2010-2021' | '2002-2021';
export type FilterDirection = 'all' | 'growth' | 'decline';

export interface AbsoluteModeConfig {
    period: DynamicsPeriod;
    filter: FilterDirection;
}

export interface DynamicsModeConfig {
    period: DynamicsPeriod;
    filter: FilterDirection;
    showZero: boolean;
}

export interface VisualizationConfig {
    mode: VisualizationMode;
    year: '2002' | '2010' | '2021';
    absolute: AbsoluteModeConfig;
    dynamics: DynamicsModeConfig;
}

export const DEFAULT_VISUALIZATION_CONFIG: VisualizationConfig = {
    mode: 'dynamics',
    year: '2021',
    absolute: {
        period: '2002-2021',
        filter: 'all'
    },
    dynamics: {
        period: '2010-2021',
        filter: 'all',
        showZero: true
    }
};

export interface FilterSettings {
    populationMin: number;
    populationMax: number;
    dynamicsMin: number;
    dynamicsMax: number;
    showZeroPopulation: boolean;
}

export const DEFAULT_FILTER_SETTINGS: FilterSettings = {
    populationMin: 0,
    populationMax: 0,
    dynamicsMin: -100,
    dynamicsMax: 100,
    showZeroPopulation: true
};

// Тип для хранения состояния выбранных регионов
export type SelectedRegions = Set<string>;
