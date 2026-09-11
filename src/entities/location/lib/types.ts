export type Location = {
    id: number;
    code_2021: string;
    population_2002: number;
    population_2010: number;
    population_2021: number;
    region: string;
    municipal_formation: string;
    settlement: string;
    populated_place: string;
    latitude: number;
    longitude: number;
};

export type VisualizationMode = 'dynamics' | 'absolute';
export type DynamicsPeriod = '2002-2010' | '2010-2021' | '2002-2021';
