import React from 'react';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import Stack from '@mui/material/Stack';
import Paper from '@mui/material/Paper';
import { HexColorPicker } from 'react-colorful';
import { GradientConfig } from '../../../entities/palette/lib/types';

interface GradientPickerProps {
  value: GradientConfig;
  onChange: (gradient: GradientConfig) => void;
  title?: string;
}

export const GradientPicker: React.FC<GradientPickerProps> = ({
  value,
  onChange,
  title = 'Пользовательский градиент'
}) => {
  const handleStartChange = (color: string) => {
    onChange({ ...value, startColor: color });
  };

  const handleMidChange = (color: string) => {
    onChange({ ...value, midColor: color });
  };

  const handleEndChange = (color: string) => {
    onChange({ ...value, endColor: color });
  };

  return (
    <Box sx={{ mt: 2 }}>
      <Typography variant="subtitle2" gutterBottom>
        {title}
      </Typography>
      <Stack direction="row" spacing={2} sx={{ mb: 2 }}>
        <Paper variant="outlined" sx={{ p: 1, flex: 1 }}>
          <Typography variant="caption" display="block" align="center" gutterBottom>
            Убыль (-100%)
          </Typography>
          <HexColorPicker 
            color={value.startColor} 
            onChange={handleStartChange} 
            style={{ width: '100%', height: 120 }}
          />
        </Paper>
        <Paper variant="outlined" sx={{ p: 1, flex: 1 }}>
          <Typography variant="caption" display="block" align="center" gutterBottom>
            Ноль (0%)
          </Typography>
          <HexColorPicker 
            color={value.midColor} 
            onChange={handleMidChange} 
            style={{ width: '100%', height: 120 }}
          />
        </Paper>
        <Paper variant="outlined" sx={{ p: 1, flex: 1 }}>
          <Typography variant="caption" display="block" align="center" gutterBottom>
            Рост (+100%)
          </Typography>
          <HexColorPicker 
            color={value.endColor} 
            onChange={handleEndChange} 
            style={{ width: '100%', height: 120 }}
          />
        </Paper>
      </Stack>
      <Paper 
        variant="outlined" 
        sx={{ 
          height: 40, 
          width: '100%',
          background: `linear-gradient(90deg, ${value.startColor} 0%, ${value.midColor} 50%, ${value.endColor} 100%)`,
          borderRadius: 1,
          mb: 1
        }} 
      />
    </Box>
  );
};
