import React, { useState } from 'react';
import {
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Box,
  Stack,
  IconButton,
  Tooltip,
  Paper,
  SelectChangeEvent,
  ListSubheader
} from '@mui/material';
import SwapHorizIcon from '@mui/icons-material/SwapHoriz';
import { PALETTE_LIBRARY, PaletteName, PALETTE_CATEGORIES } from '../../../entities/palette/lib/constants';

interface PaletteLibraryProps {
  value: PaletteName | 'custom';
  onChange: (paletteName: PaletteName | 'custom', colors: string[]) => void;
  onInvert: () => void;
  showInvert?: boolean;
}

const getPreviewColors = (paletteName: PaletteName): string[] => {
  const colors = PALETTE_LIBRARY[paletteName];
  if (colors && Array.isArray(colors) && colors.length >= 3) {
    return colors;
  }
  return ['#d7191c', '#ffffbf', '#1a9641'];
};

export const PaletteLibrary: React.FC<PaletteLibraryProps> = ({
  value,
  onChange,
  onInvert,
  showInvert = true
}) => {
  const [previewPalette, setPreviewPalette] = useState<string[]>(
    value === 'custom' 
      ? ['#d7191c', '#ffffbf', '#1a9641'] 
      : getPreviewColors(value as PaletteName)
  );

  const handleChange = (event: SelectChangeEvent) => {
    const selected = event.target.value as PaletteName | 'custom';
    if (selected === 'custom') {
      onChange('custom', []);
      setPreviewPalette(['#d7191c', '#ffffbf', '#1a9641']);
    } else {
      const colors = getPreviewColors(selected);
      setPreviewPalette(colors);
      onChange(selected, colors);
    }
  };

  const handleMouseEnter = (paletteName: PaletteName) => {
    const colors = getPreviewColors(paletteName);
    setPreviewPalette(colors);
  };

  const renderMenuItems = () => {
    const items = [];
    items.push(
      <MenuItem key="custom" value="custom">
        -- Пользовательская --
      </MenuItem>
    );
    Object.entries(PALETTE_CATEGORIES).forEach(([category, paletteNames]) => {
      items.push(
        <ListSubheader key={`header-${category}`} sx={{ bgcolor: 'transparent', fontWeight: 'bold', color: 'primary.main' }}>
          {category}
        </ListSubheader>
      );
      paletteNames.forEach(paletteName => {
        const colors = getPreviewColors(paletteName as PaletteName);
        items.push(
          <MenuItem 
            key={paletteName} 
            value={paletteName}
            onMouseEnter={() => handleMouseEnter(paletteName as PaletteName)}
            sx={{ display: 'flex', flexDirection: 'column', alignItems: 'stretch', py: 1 }}
          >
            <Box sx={{ display: 'flex', justifyContent: 'space-between', width: '100%', mb: 0.5 }}>
              <span>{paletteName}</span>
            </Box>
            <Box
              sx={{
                height: 16,
                width: '100%',
                background: `linear-gradient(90deg, ${colors[0]} 0%, ${colors[1]} 50%, ${colors[2]} 100%)`,
                borderRadius: 1,
                border: '1px solid #ddd'
              }}
            />
          </MenuItem>
        );
      });
    });
    return items;
  };

  const renderPreview = () => {
    if (value === 'custom') return null;
    const colors = previewPalette;
    if (!colors || colors.length < 3) return null;
    return (
      <Paper 
        variant="outlined" 
        sx={{ 
          mt: 1, 
          height: 32, 
          width: '100%',
          background: `linear-gradient(90deg, ${colors[0]} 0%, ${colors[1]} 50%, ${colors[2]} 100%)`,
          borderRadius: 1,
          border: '1px solid #ccc'
        }} 
      />
    );
  };

  return (
    <Box>
      <Stack direction="row" spacing={1} alignItems="center">
        <FormControl fullWidth size="small">
          <InputLabel>Библиотека палитр</InputLabel>
          <Select
            value={value}
            label="Библиотека палитр"
            onChange={handleChange}
            MenuProps={{
              PaperProps: {
                sx: { maxHeight: 500, width: 350 }
              }
            }}
          >
            {renderMenuItems()}
          </Select>
        </FormControl>
        {showInvert && (
          <Tooltip title="Инвертировать палитру">
            <IconButton onClick={onInvert} size="small">
              <SwapHorizIcon />
            </IconButton>
          </Tooltip>
        )}
      </Stack>
      {renderPreview()}
    </Box>
  );
};
