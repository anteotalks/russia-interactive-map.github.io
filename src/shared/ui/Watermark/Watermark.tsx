import React from 'react';
import { Box, Typography } from '@mui/material';

export const Watermark: React.FC = () => {
  return (
    <Box
      sx={{
        position: 'fixed',
        bottom: 20,
        left: 20,
        zIndex: 9998,
        pointerEvents: 'none',
        fontFamily: 'Jost, sans-serif',
        color: 'rgba(128, 128, 128, 0.5)',
        lineHeight: 1.1,
        userSelect: 'none',
      }}
    >
      <Typography
        component="div"
        sx={{
          fontWeight: 700,
          fontSize: '30px',
          textTransform: 'uppercase',
          letterSpacing: '1px',
        }}
      >
        АНТОН ПАВЛОВ
      </Typography>
      <Typography
        component="div"
        sx={{
          fontWeight: 400,
          fontSize: '26px',
        }}
      >
        tg-@anteotalks
      </Typography>
    </Box>
  );
};

export default Watermark;
