import { Feature, Geometry } from 'geojson';

export interface RegionProperties {
  name_rus: string;
}

export type RegionFeature = Feature<Geometry, RegionProperties>;

export interface RegionLayerConfig {
  visible: boolean;
  color: string;
  width: number;
  opacity: number;
}

export const DEFAULT_REGION_CONFIG: RegionLayerConfig = {
  visible: true,
  color: '#000000',
  width: 1.0,
  opacity: 0.5,
};
