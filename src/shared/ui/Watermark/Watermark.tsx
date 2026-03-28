import React from 'react';
import { Box } from '@mui/material';

export const Watermark: React.FC = () => {
  return (
    <Box
      sx={{
        position: 'fixed',
        bottom: 20,
        left: 20,
        zIndex: 9998,
        pointerEvents: 'none',
        userSelect: 'none',
        lineHeight: 1.1,
        fontFamily: 'Jost, sans-serif',
      }}
    >
      <Box
        sx={{
          fontWeight: 700,
          fontSize: '30px',
          textTransform: 'uppercase',
          letterSpacing: '1px',
          color: 'rgba(128, 128, 128, 0.5)',
          fontFamily: 'Jost, sans-serif',
        }}
      >
        АНТОН ПАВЛОВ
      </Box>
      <Box
        sx={{
          fontWeight: 400,
          fontSize: '26px',
          color: 'rgba(128, 128, 128, 0.5)',
          fontFamily: 'Jost, sans-serif',
        }}
      >
        tg-@anteotalks
      </Box>
    </Box>
  );
};

export default Watermark;
