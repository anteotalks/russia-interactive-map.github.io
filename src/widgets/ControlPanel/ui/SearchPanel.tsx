import React, { useState, useEffect, useRef, useMemo } from 'react';
import {
  Box,
  TextField,
  InputAdornment,
  IconButton,
  List,
  ListItem,
  ListItemButton,
  ListItemText,
  Typography,
  Chip,
  Paper,
  CircularProgress,
  Tooltip
} from '@mui/material';
import SearchIcon from '@mui/icons-material/Search';
import ClearIcon from '@mui/icons-material/Clear';
import CenterFocusWeakIcon from '@mui/icons-material/CenterFocusWeak';
import type { Location } from '../../../entities/location/lib/types';
import { getAbsoluteChange, getColorByDynamics, getNeutralColor, hexToRgb } from '../../../shared/lib/color';

interface SearchPanelProps {
  locations: Location[] | null;
  onCenterLocation: (location: Location) => void;
  selectedYear: '2002' | '2010' | '2021';
  mode: 'dynamics' | 'absolute';
  dynamicsPeriod: '2002-2010' | '2010-2021' | '2002-2021';
  absolutePeriod: '2002-2010' | '2010-2021' | '2002-2021';
  currentPalette: string[];
  fillOpacity?: number;
}

function isCrimeanRegion(region: string): boolean {
  const lower = region.toLowerCase();
  return lower.includes('крым') || lower.includes('севастополь');
}

function getCorrectedPopulation(location: Location, year: '2002' | '2010' | '2021'): number {
  if (year === '2002' && isCrimeanRegion(location.region)) {
    return location.population_2010;
  }
  return location[`population_${year}`];
}

function getColorForLocation(
  location: Location,
  mode: 'dynamics' | 'absolute',
  selectedYear: '2002' | '2010' | '2021',
  dynamicsPeriod: '2002-2010' | '2010-2021' | '2002-2021',
  absolutePeriod: '2002-2010' | '2010-2021' | '2002-2021',
  palette: string[],
  opacity: number = 0.78
): string {
  try {
    let color: [number, number, number, number];
    
    if (mode === 'absolute') {
      const change = getAbsoluteChange(location, absolutePeriod);
      color = getColorByAbsoluteChange(change, palette, opacity);
    } else {
      const pop2002 = getCorrectedPopulation(location, '2002');
      const pop2010 = location.population_2010;
      const pop2021 = location.population_2021;
      
      if (selectedYear === '2002') {
        color = getNeutralColor(palette, opacity);
      } else if (selectedYear === '2010') {
        if (pop2002 === 0 || isNaN(pop2002)) {
          color = getNeutralColor(palette, opacity);
        } else {
          const changePercent = ((pop2010 - pop2002) / pop2002) * 100;
          color = getColorByDynamics(changePercent, palette, opacity);
        }
      } else {
        if (dynamicsPeriod === '2010-2021') {
          if (pop2010 === 0 || isNaN(pop2010)) {
            color = getNeutralColor(palette, opacity);
          } else {
            const changePercent = ((pop2021 - pop2010) / pop2010) * 100;
            color = getColorByDynamics(changePercent, palette, opacity);
          }
        } else {
          if (pop2002 === 0 || isNaN(pop2002)) {
            color = getNeutralColor(palette, opacity);
          } else {
            const changePercent = ((pop2021 - pop2002) / pop2002) * 100;
            color = getColorByDynamics(changePercent, palette, opacity);
          }
        }
      }
    }
    
    return `rgba(${color[0]}, ${color[1]}, ${color[2]}, ${color[3] / 255})`;
  } catch {
    return 'rgba(128, 128, 128, 0.78)';
  }
}

function formatNumber(num: number): string {
  return new Intl.NumberFormat('ru-RU').format(num);
}

function debounce<T extends (...args: any[]) => any>(func: T, wait: number): T & { cancel: () => void } {
  let timeout: NodeJS.Timeout | null = null;
  const debounced = ((...args: Parameters<T>) => {
    if (timeout) clearTimeout(timeout);
    timeout = setTimeout(() => func(...args), wait);
  }) as T & { cancel: () => void };
  debounced.cancel = () => {
    if (timeout) clearTimeout(timeout);
    timeout = null;
  };
  return debounced;
}

// Добавляем недостающую функцию getColorByAbsoluteChange
function getColorByAbsoluteChange(change: number, palette: string[], opacity: number = 0.78): [number, number, number, number] {
  const alpha = Math.round(opacity * 255);
  if (palette.length < 3) return [128, 128, 128, alpha];
  if (change > 0) {
    const [r, g, b] = hexToRgb(palette[palette.length - 1]);
    return [r, g, b, alpha];
  }
  if (change < 0) {
    const [r, g, b] = hexToRgb(palette[0]);
    return [r, g, b, alpha];
  }
  const [r, g, b] = hexToRgb(palette[1]);
  return [r, g, b, alpha];
}

function hexToRgb(hex: string): [number, number, number] {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  return result 
    ? [parseInt(result[1], 16), parseInt(result[2], 16), parseInt(result[3], 16)]
    : [0, 0, 0];
}

export const SearchPanel: React.FC<SearchPanelProps> = ({
  locations,
  onCenterLocation,
  selectedYear,
  mode,
  dynamicsPeriod,
  absolutePeriod,
  currentPalette,
  fillOpacity = 0.78
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [debouncedTerm, setDebouncedTerm] = useState('');
  const [isSearching, setIsSearching] = useState(false);

  const debouncedSetTerm = useMemo(
    () => debounce((value: string) => {
      setDebouncedTerm(value);
      setIsSearching(false);
    }, 300),
    []
  );

  useEffect(() => {
    return () => {
      if (debouncedSetTerm.cancel) {
        debouncedSetTerm.cancel();
      }
    };
  }, [debouncedSetTerm]);

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setSearchTerm(value);
    setIsSearching(true);
    debouncedSetTerm(value);
  };

  const handleClearSearch = () => {
    setSearchTerm('');
    setDebouncedTerm('');
    setIsSearching(false);
    if (debouncedSetTerm.cancel) {
      debouncedSetTerm.cancel();
    }
  };

  const searchResults = useMemo(() => {
    if (!debouncedTerm.trim() || !locations) return [];
    const lower = debouncedTerm.toLowerCase();
    return locations.filter(loc =>
      loc.populated_place.toLowerCase().includes(lower) ||
      loc.region.toLowerCase().includes(lower)
    );
  }, [locations, debouncedTerm]);

  const formatDynamics = (location: Location): string => {
    const pop2002 = getCorrectedPopulation(location, '2002');
    const pop2010 = location.population_2010;
    const pop2021 = location.population_2021;
    let dynamicsPercent = 0;
    
    if (selectedYear === '2010') {
      if (pop2002 > 0) dynamicsPercent = ((pop2010 - pop2002) / pop2002) * 100;
    } else if (selectedYear === '2021') {
      if (dynamicsPeriod === '2010-2021') {
        if (pop2010 > 0) dynamicsPercent = ((pop2021 - pop2010) / pop2010) * 100;
      } else {
        if (pop2002 > 0) dynamicsPercent = ((pop2021 - pop2002) / pop2002) * 100;
      }
    }
    const sign = dynamicsPercent > 0 ? '+' : dynamicsPercent < 0 ? '' : '';
    return `${sign}${dynamicsPercent.toFixed(1)}%`;
  };

  const formatAbsolute = (location: Location): string => {
    const change = getAbsoluteChange(location, absolutePeriod);
    const sign = change > 0 ? '+' : change < 0 ? '' : '';
    return `${sign}${formatNumber(Math.abs(change))} чел.`;
  };

  const formatPopulation = (location: Location): string => {
    const pop = getCorrectedPopulation(location, selectedYear);
    return formatNumber(pop);
  };

  return (
    <Box>
      <TextField
        fullWidth
        size="small"
        placeholder="Поиск по названию или региону..."
        value={searchTerm}
        onChange={handleSearchChange}
        InputProps={{
          startAdornment: (
            <InputAdornment position="start">
              <SearchIcon fontSize="small" />
            </InputAdornment>
          ),
          endAdornment: searchTerm && (
            <InputAdornment position="end">
              {isSearching ? (
                <CircularProgress size={20} />
              ) : (
                <IconButton size="small" onClick={handleClearSearch}>
                  <ClearIcon fontSize="small" />
                </IconButton>
              )}
            </InputAdornment>
          )
        }}
        sx={{ mb: 2 }}
      />

      {debouncedTerm && searchResults.length > 0 && (
        <Typography variant="caption" color="text.secondary" sx={{ mb: 1, display: 'block' }}>
          Найдено: {searchResults.length}
        </Typography>
      )}

      {searchResults.length > 0 ? (
        <Paper variant="outlined" sx={{ maxHeight: 400, overflow: 'auto' }}>
          <List dense>
            {searchResults.map((location) => {
              const bgColor = getColorForLocation(
                location,
                mode,
                selectedYear,
                dynamicsPeriod,
                absolutePeriod,
                currentPalette,
                fillOpacity
              );
              const dynamicsStr = formatDynamics(location);
              const isPositive = dynamicsStr.startsWith('+');
              const populationStr = formatPopulation(location);
              
              return (
                <ListItem
                  key={location.id}
                  disablePadding
                  sx={{ 
                    backgroundColor: bgColor,
                    '&:hover': { backgroundColor: 'action.hover' }
                  }}
                  secondaryAction={
                    <Tooltip title="Центрировать на карте">
                      <IconButton 
                        edge="end" 
                        size="small" 
                        onClick={() => onCenterLocation(location)}
                      >
                        <CenterFocusWeakIcon fontSize="small" />
                      </IconButton>
                    </Tooltip>
                  }
                >
                  <ListItemButton onClick={() => onCenterLocation(location)}>
                    <ListItemText
                      primary={
                        <Box display="flex" alignItems="center" gap={1} flexWrap="wrap">
                          <Typography variant="body2" fontWeight="medium">
                            {location.populated_place}
                          </Typography>
                          <Chip 
                            label={location.region} 
                            size="small" 
                            variant="outlined" 
                            sx={{ fontSize: '0.7rem' }} 
                          />
                        </Box>
                      }
                      secondary={
                        <Box display="flex" gap={2} mt={0.5} flexWrap="wrap">
                          <Typography variant="caption" color="text.secondary">
                            👥 {populationStr} чел.
                          </Typography>
                          <Typography 
                            variant="caption" 
                            sx={{ color: isPositive ? 'success.main' : 'error.main' }}
                          >
                            {dynamicsStr}
                          </Typography>
                          {mode === 'absolute' && (
                            <Typography 
                              variant="caption" 
                              sx={{ color: formatAbsolute(location).startsWith('+') ? 'success.main' : 'error.main' }}
                            >
                              {formatAbsolute(location)}
                            </Typography>
                          )}
                        </Box>
                      }
                    />
                  </ListItemButton>
                </ListItem>
              );
            })}
          </List>
        </Paper>
      ) : debouncedTerm ? (
        <Paper variant="outlined" sx={{ p: 3, textAlign: 'center' }}>
          <Typography color="text.secondary">Ничего не найдено</Typography>
        </Paper>
      ) : null}
    </Box>
  );
};

export default SearchPanel;
