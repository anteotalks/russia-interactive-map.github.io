import React, { useState, useEffect } from 'react';
import Box from '@mui/material/Box';
import Slider from '@mui/material/Slider';
import Input from '@mui/material/Input';
import Typography from '@mui/material/Typography';
import Stack from '@mui/material/Stack';
import { styled } from '@mui/material/styles';

const StyledInput = styled(Input)`width: 70px;`;

interface SliderWithInputProps {
  label: string;
  value: number;
  onChange: (value: number) => void;
  min: number;
  max: number;
  step?: number;
  unit?: string;
  disabled?: boolean;
}

const SliderWithInputComponent: React.FC<SliderWithInputProps> = ({
  label, value, onChange, min, max, step = 0.1, unit = '', disabled = false,
}) => {
  const [localValue, setLocalValue] = useState<string | number>(value);

  useEffect(() => { setLocalValue(value); }, [value]);

  const handleSliderChange = (_event: Event, newValue: number | number[]) => {
    const numValue = newValue as number;
    setLocalValue(numValue);
    onChange(numValue);
  };

  const handleInputChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = event.target.value;
    if (newValue === '') { setLocalValue(''); return; }
    const numValue = Number(newValue);
    if (!isNaN(numValue)) {
      setLocalValue(numValue);
      const clampedValue = Math.min(max, Math.max(min, numValue));
      onChange(clampedValue);
    }
  };

  const handleBlur = () => {
    let finalValue = localValue === '' ? min : Number(localValue);
    if (finalValue < min) finalValue = min;
    if (finalValue > max) finalValue = max;
    finalValue = Math.round(finalValue / step) * step;
    setLocalValue(finalValue);
    onChange(finalValue);
  };

  return (
    <Box sx={{ mb: 2 }}>
      <Typography variant="subtitle2" gutterBottom>{label}</Typography>
      <Stack direction="row" spacing={2} alignItems="center">
        <Box sx={{ flex: 1 }}>
          <Slider value={typeof localValue === 'number' ? localValue : min} onChange={handleSliderChange} min={min} max={max} step={step} valueLabelDisplay="auto" disabled={disabled} />
        </Box>
        <StyledInput value={localValue} size="small" onChange={handleInputChange} onBlur={handleBlur} disabled={disabled} inputProps={{ step, min, max, type: 'number' }} endAdornment={unit && <Box component="span" sx={{ ml: 0.5, color: 'text.secondary' }}>{unit}</Box>} />
      </Stack>
    </Box>
  );
};

// Мемоизация для оптимизации
export const SliderWithInput = React.memo(SliderWithInputComponent);
