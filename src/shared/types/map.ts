export interface LayerConfig {
  id: string;
  name: string;
  visible: boolean;
  type: 'base' | 'overlay' | 'terrain';
  styleUrl?: string;
  tileUrl?: string;
  mapType: 'raster' | 'vector';
  maxZoom?: number;
  attribution?: string;
}
