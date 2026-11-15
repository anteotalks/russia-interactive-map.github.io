import React from 'react';
import { Paper, IconButton, Tooltip, Stack } from '@mui/material';
import CropFreeIcon from '@mui/icons-material/CropFree';
import GestureIcon from '@mui/icons-material/Gesture';
import ClearIcon from '@mui/icons-material/Clear';
import { SelectionMode } from '../../lib/hooks/useSelectionMode';

interface SelectionToolbarProps {
  mode: SelectionMode;
  onModeChange: (mode: SelectionMode) => void;
  onClear: () => void;
  isVisible?: boolean;
}

export const SelectionToolbar: React.FC<SelectionToolbarProps> = ({
  mode,
  onModeChange,
  onClear,
  isVisible = true,
}) => {
  if (!isVisible) return null;

  return (
    <Paper
      elevation={3}
      sx={{
        position: 'absolute',
        top: 20,
        right: 20,
        zIndex: 1200,
        borderRadius: 2,
        overflow: 'hidden',
        backgroundColor: 'rgba(255, 255, 255, 0.95)',
      }}
    >
      <Stack direction="row" spacing={0.5} sx={{ p: 0.5 }}>
        <Tooltip title="Прямоугольное выделение" arrow>
          <IconButton
            size="small"
            color={mode === 'rectangle' ? 'primary' : 'default'}
            onClick={() => onModeChange(mode === 'rectangle' ? 'none' : 'rectangle')}
          >
            <CropFreeIcon fontSize="small" />
          </IconButton>
        </Tooltip>
        <Tooltip title="Лассо (многоугольное выделение)" arrow>
          <IconButton
            size="small"
            color={mode === 'lasso' ? 'primary' : 'default'}
            onClick={() => onModeChange(mode === 'lasso' ? 'none' : 'lasso')}
          >
            <GestureIcon fontSize="small" />
          </IconButton>
        </Tooltip>
        <Tooltip title="Очистить выделение" arrow>
          <IconButton size="small" onClick={onClear}>
            <ClearIcon fontSize="small" />
          </IconButton>
        </Tooltip>
      </Stack>
    </Paper>
  );
};

export default SelectionToolbar;
