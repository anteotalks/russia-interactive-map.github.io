import { useState, useCallback, useMemo } from 'react';
import { CameraSettings, DEFAULT_CAMERA_SETTINGS } from '../../types/camera';

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

interface UseMapLayersControlReturn {
  layers: LayerConfig[];
  terrainEnabled: boolean;
  toggleLayer: (layerId: string) => void;
  toggleTerrain: () => void;
  visibleLayers: string[];
  baseLayer: LayerConfig;
  viewState: CameraSettings;
  handleViewStateChange: (newViewState: any) => void;
  updateViewState: (newSettings: Partial<CameraSettings>) => void;
}

export const useMapLayersControl = (initialLayers: LayerConfig[]): UseMapLayersControlReturn => {
  const [layers, setLayers] = useState<LayerConfig[]>(initialLayers);
  const [terrainEnabled, setTerrainEnabled] = useState(true);
  const [viewState, setViewState] = useState<CameraSettings>(DEFAULT_CAMERA_SETTINGS);

  const toggleLayer = useCallback((layerId: string) => {
    setLayers(prev => {
      const layer = prev.find(l => l.id === layerId);
      if (layer?.type === 'base') {
        return prev.map(l => 
          l.type === 'base' 
            ? { ...l, visible: l.id === layerId } 
            : l
        );
      }
      return prev.map(l => 
        l.id === layerId ? { ...l, visible: !l.visible } : l
      );
    });
  }, []);

  const toggleTerrain = useCallback(() => {
    setTerrainEnabled(prev => !prev);
  }, []);

  const handleViewStateChange = useCallback((newViewState: any) => {
    setViewState(prev => ({
      ...prev,
      longitude: newViewState.longitude ?? prev.longitude,
      latitude: newViewState.latitude ?? prev.latitude,
      zoom: newViewState.zoom ?? prev.zoom,
      pitch: newViewState.pitch ?? prev.pitch,
      bearing: newViewState.bearing ?? prev.bearing
    }));
  }, []);

  const updateViewState = useCallback((newSettings: Partial<CameraSettings>) => {
    setViewState(prev => ({ ...prev, ...newSettings }));
  }, []);

  const baseLayer = useMemo(() => {
    return layers.find(l => l.type === 'base' && l.visible) || layers[0];
  }, [layers]);

  const visibleLayers = useMemo(() => 
    layers.filter(layer => layer.visible).map(l => l.id), 
    [layers]
  );

  return { 
    layers, 
    terrainEnabled, 
    toggleLayer, 
    toggleTerrain, 
    visibleLayers, 
    baseLayer,
    viewState,
    handleViewStateChange,
    updateViewState
  };
};

export default useMapLayersControl;
