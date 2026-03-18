import React, { useState, useMemo, useCallback } from 'react';
import {
  Box,
  Typography,
  TextField,
  Button,
  List,
  ListItem,
  ListItemText,
  Checkbox,
  IconButton,
  Tooltip,
  InputAdornment,
  Paper
} from '@mui/material';
import SearchIcon from '@mui/icons-material/Search';
import CenterFocusWeakIcon from '@mui/icons-material/CenterFocusWeak';
import CheckBoxOutlineBlankIcon from '@mui/icons-material/CheckBoxOutlineBlank';
import CheckBoxIcon from '@mui/icons-material/CheckBox';

interface RegionListProps {
  regions: string[];                    // Список всех регионов
  selectedRegions: Set<string>;         // Текущие выбранные регионы
  onSelectionChange: (regions: Set<string>) => void; // Обработчик изменения выбора
  onCenterRegion: (region: string) => void; // Центрирование на одном регионе
  onCenterSelected: () => void;          // Центрирование на всех выбранных
}

export const RegionList: React.FC<RegionListProps> = ({
  regions,
  selectedRegions,
  onSelectionChange,
  onCenterRegion,
  onCenterSelected
}) => {
  const [searchTerm, setSearchTerm] = useState('');

  // Фильтруем регионы по поисковому запросу
  const filteredRegions = useMemo(() => {
    if (!searchTerm.trim()) return regions;
    return regions.filter(region =>
      region.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [regions, searchTerm]);

  // Обработчики для массовых операций
  const handleSelectAll = useCallback(() => {
    onSelectionChange(new Set(filteredRegions));
  }, [filteredRegions, onSelectionChange]);

  const handleDeselectAll = useCallback(() => {
    onSelectionChange(new Set());
  }, [onSelectionChange]);

  // Переключение выбора одного региона
  const handleToggleRegion = useCallback((region: string) => {
    const newSelection = new Set(selectedRegions);
    if (newSelection.has(region)) {
      newSelection.delete(region);
    } else {
      newSelection.add(region);
    }
    onSelectionChange(newSelection);
  }, [selectedRegions, onSelectionChange]);

  return (
    <Box sx={{ width: '100%' }}>
      <Box sx={{ display: 'flex', gap: 1, mb: 2 }}>
        <TextField
          fullWidth
          size="small"
          placeholder="Поиск региона..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <SearchIcon fontSize="small" />
              </InputAdornment>
            ),
          }}
        />
      </Box>

      <Box sx={{ display: 'flex', gap: 1, mb: 2 }}>
        <Button size="small" variant="outlined" onClick={handleSelectAll} fullWidth>
          Все
        </Button>
        <Button size="small" variant="outlined" onClick={handleDeselectAll} fullWidth>
          Ни одного
        </Button>
        {selectedRegions.size > 0 && (
          <Button
            size="small"
            variant="contained"
            onClick={onCenterSelected}
            startIcon={<CenterFocusWeakIcon />}
            fullWidth
          >
            Центрировать выбранные
          </Button>
        )}
      </Box>

      <Paper variant="outlined" sx={{ maxHeight: 300, overflow: 'auto' }}>
        <List dense>
          {filteredRegions.map((region) => {
            const isSelected = selectedRegions.has(region);
            return (
              <ListItem
                key={region}
                secondaryAction={
                  <Tooltip title="Центрировать на регионе">
                    <IconButton
                      edge="end"
                      size="small"
                      onClick={() => onCenterRegion(region)}
                    >
                      <CenterFocusWeakIcon fontSize="small" />
                    </IconButton>
                  </Tooltip>
                }
                disablePadding
              >
                <Box
                  sx={{
                    display: 'flex',
                    alignItems: 'center',
                    width: '100%',
                    pl: 2,
                    pr: 1,
                    py: 0.5,
                    '&:hover': { bgcolor: 'action.hover' }
                  }}
                >
                  <Checkbox
                    size="small"
                    checked={isSelected}
                    onChange={() => handleToggleRegion(region)}
                    icon={<CheckBoxOutlineBlankIcon fontSize="small" />}
                    checkedIcon={<CheckBoxIcon fontSize="small" />}
                  />
                  <ListItemText
                    primary={region}
                    primaryTypographyProps={{ variant: 'body2' }}
                    sx={{ ml: 1 }}
                  />
                </Box>
              </ListItem>
            );
          })}
          {filteredRegions.length === 0 && (
            <ListItem>
              <ListItemText
                primary="Регионы не найдены"
                primaryTypographyProps={{ color: 'text.secondary', align: 'center' }}
              />
            </ListItem>
          )}
        </List>
      </Paper>
    </Box>
  );
};

export default RegionList;
