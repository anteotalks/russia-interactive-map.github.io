/**
 * Кнопка активации режима рисования
 * Добавляет визуальный индикатор активного режима
 */

import React from 'react';
import { IconButton, Paper, Tooltip } from '@mui/material';
import { PolylineOutlined } from '@mui/icons-material';

interface DrawToggleProps {
  isActive: boolean;
  onToggle: () => void;
}

export const DrawToggle: React.FC<DrawToggleProps> = ({ isActive, onToggle }) => {
  return (
    <Paper 
      elevation={3} 
      sx={{ 
        position: 'absolute', 
        top: 80, 
        left: 20, 
        zIndex: 10,
        borderRadius: 2,
        overflow: 'hidden',
        bgcolor: isActive ? 'primary.main' : 'background.paper',
        color: isActive ? 'white' : 'inherit',
        transition: 'all 0.2s'
      }}
    >
      <Tooltip title={isActive ? "Режим рисования активен" : "Включить рисование"} placement="right">
        <IconButton onClick={onToggle} color={isActive ? 'inherit' : 'default'}>
          <PolylineOutlined />
        </IconButton>
      </Tooltip>
    </Paper>
  );
};

export default DrawToggle;
