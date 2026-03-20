/**
 * Компонент управления рисованием лассо
 * Использует mapbox-gl-draw для совместимости с MapLibre GL JS 
 */

import React, { useEffect, useRef, useCallback, useState } from 'react';
import MapboxDraw from '@mapbox/mapbox-gl-draw';
import { useControl } from 'react-map-gl/maplibre';
import { Feature, Polygon } from 'geojson';
import * as turf from '@turf/turf';
import {
  Paper,
  IconButton,
  Tooltip,
  ToggleButton,
  ToggleButtonGroup,
  Box,
  Badge,
} from '@mui/material';
import {
  PolylineOutlined,
  ClearOutlined,
  CheckOutlined,
} from '@mui/icons-material';
import { LassoControlProps, DrawMode } from '../lib/types';
import drawStyles from '../lib/drawStyles';

const LassoControl: React.FC<LassoControlProps> = ({
  onSelectionComplete,
  locations,
  mapRef,
  position = 'top-left',
  className = '',
}) => {
  const [selectedPointsCount, setSelectedPointsCount] = useState<number>(0);
  const [mode, setMode] = useState<string>('static');
  const drawRef = useRef<MapboxDraw | null>(null);

  /**
   * Создание и настройка экземпляра MapboxDraw
   */
  const drawInstance = useControl<MapboxDraw>(
    () => {
      const draw = new MapboxDraw({
        displayControlsDefault: false,
        controls: {
          polygon: true,
          trash: true,
        },
        defaultMode: 'static',
        styles: drawStyles,
        clickBuffer: 2,
        touchBuffer: 2,
      });
      
      drawRef.current = draw;
      return draw;
    },
    ({ map }) => {
      map.on('draw.create', handleDrawCreate);
      map.on('draw.update', handleDrawUpdate);
      map.on('draw.delete', handleDrawDelete);
      map.on('draw.modechange', handleModeChange);
    },
    ({ map }) => {
      map.off('draw.create', handleDrawCreate);
      map.off('draw.update', handleDrawUpdate);
      map.off('draw.delete', handleDrawDelete);
      map.off('draw.modechange', handleModeChange);
    },
    {
      position: position as any,
    }
  );

  /**
   * Обработчик создания нового полигона
   */
  const handleDrawCreate = useCallback((e: any) => {
    const feature = e.features[0] as Feature<Polygon>;
    if (!feature || !locations || locations.length === 0) return;

    import('@turf/turf').then((turfModule) => {
      try {
        const pointsInPolygon = locations.filter(loc => {
          const point = turfModule.point([loc.longitude, loc.latitude]);
          return turfModule.booleanPointInPolygon(point, feature);
        });

        setSelectedPointsCount(pointsInPolygon.length);
        onSelectionComplete(pointsInPolygon);
      } catch (error) {
        console.error('Ошибка при анализе полигона:', error);
      }
    });
  }, [locations, onSelectionComplete]);

  /**
   * Обработчик обновления полигона
   */
  const handleDrawUpdate = useCallback((e: any) => {
    const feature = e.features[0] as Feature<Polygon>;
    if (!feature || !locations || locations.length === 0) return;

    import('@turf/turf').then((turfModule) => {
      const pointsInPolygon = locations.filter(loc => {
        const point = turfModule.point([loc.longitude, loc.latitude]);
        return turfModule.booleanPointInPolygon(point, feature);
      });

      setSelectedPointsCount(pointsInPolygon.length);
      onSelectionComplete(pointsInPolygon);
    });
  }, [locations, onSelectionComplete]);

  /**
   * Обработчик удаления полигона
   */
  const handleDrawDelete = useCallback(() => {
    setSelectedPointsCount(0);
    onSelectionComplete([]);
  }, [onSelectionComplete]);

  /**
   * Обработчик смены режима
   */
  const handleModeChange = useCallback((e: any) => {
    setMode(e.mode);
  }, []);

  /**
   * Переключение режима рисования
   */
  const toggleDrawMode = useCallback(() => {
    if (!drawRef.current) return;
    
    if (mode === 'static') {
      drawRef.current.changeMode('draw_polygon');
    } else {
      drawRef.current.changeMode('static');
    }
  }, [mode]);

  /**
   * Очистка всех полигонов
   */
  const handleClear = useCallback(() => {
    if (!drawRef.current) return;
    drawRef.current.deleteAll();
    drawRef.current.changeMode('static');
    setSelectedPointsCount(0);
    onSelectionComplete([]);
  }, [onSelectionComplete]);

  return (
    <Box
      sx={{
        position: 'absolute',
        top: 80,
        left: 20,
        zIndex: 10,
        display: 'flex',
        flexDirection: 'column',
        gap: 1,
      }}
      className={className}
    >
      <Paper elevation={3} sx={{ borderRadius: 2, overflow: 'hidden' }}>
        <ToggleButtonGroup
          orientation="vertical"
          value={mode === 'draw_polygon' ? 'draw' : 'static'}
          exclusive
          size="small"
        >
          <ToggleButton 
            value="draw" 
            aria-label="рисовать лассо"
            onClick={toggleDrawMode}
          >
            <Tooltip title={mode === 'draw_polygon' ? "Режим рисования активен" : "Рисовать лассо"} placement="right">
              <PolylineOutlined color={mode === 'draw_polygon' ? 'primary' : 'inherit'} />
            </Tooltip>
          </ToggleButton>
        </ToggleButtonGroup>
      </Paper>

      {selectedPointsCount > 0 && (
        <Paper elevation={3} sx={{ borderRadius: 2, p: 1, bgcolor: 'primary.main', color: 'white' }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <CheckOutlined fontSize="small" />
            <Box component="span" sx={{ fontSize: '0.875rem', fontWeight: 'bold' }}>
              {selectedPointsCount}
            </Box>
            <Box component="span" sx={{ fontSize: '0.75rem', opacity: 0.9 }}>
              выделено
            </Box>
          </Box>
        </Paper>
      )}

      <Paper elevation={3} sx={{ borderRadius: 2, p: 0.5 }}>
        <IconButton onClick={handleClear} size="small">
          <Tooltip title="Очистить всё" placement="right">
            <ClearOutlined fontSize="small" />
          </Tooltip>
        </IconButton>
      </Paper>
    </Box>
  );
};

export default LassoControl;
