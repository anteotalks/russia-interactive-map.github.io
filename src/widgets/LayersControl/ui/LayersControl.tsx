import React, { memo } from 'react';
import { Paper, Typography, FormGroup, FormControlLabel, Switch, Divider, Box, IconButton, Tooltip } from '@mui/material';
import TerrainIcon from '@mui/icons-material/Terrain';
import MapIcon from '@mui/icons-material/Map';
import VisibilityIcon from '@mui/icons-material/Visibility';
import VisibilityOffIcon from '@mui/icons-material/VisibilityOff';

interface LayerConfig {
  id: string;
  name: string;
  visible: boolean;
  type: 'base' | 'overlay' | 'terrain';
}

interface LayersControlProps {
  layers: LayerConfig[];
  terrainEnabled: boolean;
  onToggleLayer: (layerId: string) => void;
  onToggleTerrain: () => void;
}

export const LayersControl: React.FC<LayersControlProps> = ({ layers, terrainEnabled, onToggleLayer, onToggleTerrain }) => {
  const baseLayers = layers.filter(l => l.type === 'base');

  return (
    <Paper sx={{ position: 'absolute', top: 20, right: 20, zIndex: 1000, p: 2, width: 250, backgroundColor: 'rgba(255, 255, 255, 0.95)', borderRadius: 2, boxShadow: 3 }}>
      <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
        <MapIcon sx={{ mr: 1, color: 'primary.main' }} />
        <Typography variant="subtitle1" fontWeight={600}>Слои карты</Typography>
      </Box>
      <Divider sx={{ my: 1 }} />
      <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 1 }}>Базовая карта</Typography>
      <FormGroup>
        {baseLayers.map(layer => (
          <FormControlLabel key={layer.id} control={<Switch size="small" checked={layer.visible} onChange={() => onToggleLayer(layer.id)} color="primary" />} label={<Box sx={{ display: 'flex', alignItems: 'center' }}>{layer.name}<Tooltip title={layer.visible ? "Видимый" : "Скрыт"}><IconButton size="small" sx={{ ml: 0.5 }}>{layer.visible ? <VisibilityIcon fontSize="small" color="action" /> : <VisibilityOffIcon fontSize="small" color="disabled" />}</IconButton></Tooltip></Box>} />
        ))}
      </FormGroup>
      <Divider sx={{ my: 1.5 }} />
      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <Box sx={{ display: 'flex', alignItems: 'center' }}>
          <TerrainIcon sx={{ mr: 1, color: terrainEnabled ? 'success.main' : 'action.disabled' }} />
          <Typography variant="body2">Тени рельефа</Typography>
        </Box>
        <Switch size="small" checked={terrainEnabled} onChange={onToggleTerrain} color="success" />
      </Box>
    </Paper>
  );
};
