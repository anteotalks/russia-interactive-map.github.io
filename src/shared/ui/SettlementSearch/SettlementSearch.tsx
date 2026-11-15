import React, { useState, useMemo, useCallback, useEffect, useRef } from 'react';
import {
  Box,
  Typography,
  TextField,
  Paper,
  InputAdornment,
  IconButton,
  Chip,
  Tooltip,
  CircularProgress,
  List,
  ListItem,
  ListItemButton,
  ListItemText
} from '@mui/material';
import SearchIcon from '@mui/icons-material/Search';
import ClearIcon from '@mui/icons-material/Clear';
import CenterFocusWeakIcon from '@mui/icons-material/CenterFocusWeak';
import { getAbsoluteChange } from '../../../shared/lib/color/utils';
import { Location } from '../../../entities/location/lib/types';
import { DynamicsPeriod } from '../../../shared/types/visualization';

interface SettlementSearchProps {
  locations: Location[] | null;
  onCenterLocation: (location: Location) => void;
  selectedYear: '2002' | '2010' | '2021';
  mode: 'dynamics' | 'absolute';
  dynamicsPeriod: DynamicsPeriod;
  absolutePeriod: DynamicsPeriod;
  currentPalette: string[];
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

export const SettlementSearch: React.FC<SettlementSearchProps> = React.memo(({
  locations,
  onCenterLocation,
  selectedYear,
  mode,
  dynamicsPeriod,
  absolutePeriod,
  currentPalette
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

  const handleSearchChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setSearchTerm(value);
    setIsSearching(true);
    debouncedSetTerm(value);
  }, [debouncedSetTerm]);

  const handleClearSearch = useCallback(() => {
    setSearchTerm('');
    setDebouncedTerm('');
    setIsSearching(false);
    debouncedSetTerm.cancel();
  }, [debouncedSetTerm]);

  const searchResults = useMemo(() => {
    if (!debouncedTerm.trim() || !locations) return [];
    const lower = debouncedTerm.toLowerCase();
    return locations.filter(loc =>
      loc.populated_place.toLowerCase().includes(lower) ||
      loc.region.toLowerCase().includes(lower)
    );
  }, [locations, debouncedTerm]);

  const getRowColor = useCallback((location: Location): string => {
    const change = getAbsoluteChange(location, absolutePeriod);
    if (change > 0) return 'rgba(26, 150, 65, 0.08)';
    if (change < 0) return 'rgba(215, 25, 28, 0.08)';
    return 'transparent';
  }, [absolutePeriod]);

  const formatDynamics = useCallback((location: Location): string => {
    const pop2002 = location.population_2002;
    let dynamicsPercent = 0;
    if (selectedYear === '2010') {
      if (pop2002 > 0) dynamicsPercent = ((location.population_2010 - pop2002) / pop2002) * 100;
    } else if (selectedYear === '2021') {
      if (dynamicsPeriod === '2010-2021') {
        const pop2010 = location.population_2010;
        if (pop2010 > 0) dynamicsPercent = ((location.population_2021 - pop2010) / pop2010) * 100;
      } else {
        if (pop2002 > 0) dynamicsPercent = ((location.population_2021 - pop2002) / pop2002) * 100;
      }
    }
    const sign = dynamicsPercent > 0 ? '+' : '';
    return `${sign}${dynamicsPercent.toFixed(1)}%`;
  }, [selectedYear, dynamicsPeriod]);

  const formatAbsolute = useCallback((location: Location): string => {
    const change = getAbsoluteChange(location, absolutePeriod);
    const sign = change > 0 ? '+' : '';
    return `${sign}${change.toLocaleString()} чел.`;
  }, [absolutePeriod]);

  useEffect(() => {
    return () => { debouncedSetTerm.cancel(); };
  }, [debouncedSetTerm]);

  return (
    <Box sx={{ width: '100%' }}>
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
        <Box sx={{ mb: 1 }}>
          <Typography variant="caption" color="text.secondary">
            Найдено: {searchResults.length}
          </Typography>
        </Box>
      )}

      {searchResults.length > 0 ? (
        <Paper variant="outlined" sx={{ maxHeight: 400, overflow: 'auto' }}>
          <List dense>
            {searchResults.map((location) => {
              const bgColor = getRowColor(location);
              const dynamicsStr = formatDynamics(location);
              const isPositive = dynamicsStr.startsWith('+');
              return (
                <ListItem
                  key={location.id}
                  disablePadding
                  sx={{ backgroundColor: bgColor, '&:hover': { backgroundColor: 'action.hover' } }}
                  secondaryAction={
                    <Tooltip title="Центрировать">
                      <IconButton edge="end" size="small" onClick={() => onCenterLocation(location)}>
                        <CenterFocusWeakIcon fontSize="small" />
                      </IconButton>
                    </Tooltip>
                  }
                >
                  <ListItemButton onClick={() => onCenterLocation(location)}>
                    <ListItemText
                      primary={
                        <Box display="flex" alignItems="center" gap={1}>
                          <Typography variant="body2" fontWeight="medium">
                            {location.populated_place}
                          </Typography>
                          <Chip label={location.region} size="small" variant="outlined" sx={{ fontSize: '0.7rem' }} />
                        </Box>
                      }
                      secondary={
                        <Box display="flex" gap={2} mt={0.5}>
                          <Typography variant="caption" color="text.secondary">
                            👥 {location[`population_${selectedYear}`].toLocaleString()} чел.
                          </Typography>
                          <Typography variant="caption" sx={{ color: isPositive ? 'success.main' : 'error.main' }}>
                            {dynamicsStr}
                          </Typography>
                          {mode === 'absolute' && (
                            <Typography variant="caption" sx={{ color: formatAbsolute(location).startsWith('+') ? 'success.main' : 'error.main' }}>
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
});

SettlementSearch.displayName = 'SettlementSearch';
export default SettlementSearch;
