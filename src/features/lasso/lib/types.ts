/**
 * Типы для функциональности рисования лассо
 * Использует mapbox-gl-draw для совместимости с MapLibre 
 */

import { Feature, Polygon, Position } from 'geojson';
import { Location } from '../../../entities/location/lib/types';

/**
 * Режимы рисования mapbox-gl-draw
 */
export enum DrawMode {
  DRAW_POLYGON = 'draw_polygon',
  SIMPLE_SELECT = 'simple_select',
  DIRECT_SELECT = 'direct_select',
  STATIC = 'static',
}

/**
 * События рисования
 */
export type DrawEventType = 
  | 'draw.create'
  | 'draw.update'
  | 'draw.delete'
  | 'draw.selectionchange'
  | 'draw.modechange';

/**
 * Конфигурация для mapbox-gl-draw
 */
export interface DrawControlConfig {
  modes?: any;
  controls?: {
    point?: boolean;
    line_string?: boolean;
    polygon?: boolean;
    trash?: boolean;
    combine_features?: boolean;
    uncombine_features?: boolean;
  };
  displayControlsDefault?: boolean;
  keybindings?: boolean;
  touchEnabled?: boolean;
  boxSelect?: boolean;
  clickBuffer?: number;
  touchBuffer?: number;
  styles?: any[];
  defaultMode?: string;
}

/**
 * Пропсы для компонента LassoControl
 */
export interface LassoControlProps {
  onSelectionComplete: (selectedLocations: Location[]) => void;
  locations: Location[] | null;
  mapRef: React.MutableRefObject<any>;
  position?: 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right';
  className?: string;
}
