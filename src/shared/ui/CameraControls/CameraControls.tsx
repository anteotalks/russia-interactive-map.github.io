import React from 'react';
import {
  Box,
  Typography,
  Stack,
  Paper,
  IconButton,
  Tooltip,
  Alert,
} from '@mui/material';
import SyncIcon from '@mui/icons-material/Sync';
import RestartAltIcon from '@mui/icons-material/RestartAlt';
import CenterFocusWeakIcon from '@mui/icons-material/CenterFocusWeak';
import NorthIcon from '@mui/icons-material/North';
import EastIcon from '@mui/icons-material/East';
import SouthIcon from '@mui/icons-material/South';
import WestIcon from '@mui/icons-material/West';
import ThreeDRotationIcon from '@mui/icons-material/ThreeDRotation';
import { SliderWithInput } from '../SliderWithInput';
import { CameraSettings, CAMERA_LIMITS, CameraSettingKey } from '../../types/camera';

interface CameraControlsProps {
  settings: CameraSettings;
  onSettingChange: (key: CameraSettingKey, value: number) => void;
  onReset: () => void;
  onSync: () => void;
  isSynced?: boolean;
}

export const CameraControls: React.FC<CameraControlsProps> = ({
  settings,
  onSettingChange,
  onReset,
  onSync,
  isSynced = true
}) => {
  return (
    <Box>
      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
        <Typography variant="subtitle2" color="primary" sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <CenterFocusWeakIcon fontSize="small" />
          Детальные настройки вида
        </Typography>
        <Box>
          <Tooltip title="Синхронизировать с картой">
            <IconButton size="small" onClick={onSync} color={isSynced ? 'success' : 'warning'} sx={{ mr: 0.5 }}>
              <SyncIcon fontSize="small" />
            </IconButton>
          </Tooltip>
          <Tooltip title="Сбросить к настройкам по умолчанию">
            <IconButton size="small" onClick={onReset}>
              <RestartAltIcon fontSize="small" />
            </IconButton>
          </Tooltip>
        </Box>
      </Box>

      {!isSynced && (
        <Alert severity="warning" size="small" sx={{ mb: 2 }} action={
          <IconButton color="inherit" size="small" onClick={onSync}>
            <SyncIcon fontSize="small" />
          </IconButton>
        }>
          Настройки отличаются от карты. Нажмите синхронизацию.
        </Alert>
      )}

      <Stack spacing={2}>
        <Paper variant="outlined" sx={{ p: 2 }}>
          <Typography variant="caption" color="text.secondary" sx={{ mb: 1, display: 'block' }}>
            Центр карты
          </Typography>
          <SliderWithInput
            label="Долгота"
            value={settings.longitude}
            onChange={(val) => onSettingChange('longitude', val)}
            min={CAMERA_LIMITS.longitude.min}
            max={CAMERA_LIMITS.longitude.max}
            step={CAMERA_LIMITS.longitude.step}
            unit="°"
          />
          <SliderWithInput
            label="Широта"
            value={settings.latitude}
            onChange={(val) => onSettingChange('latitude', val)}
            min={CAMERA_LIMITS.latitude.min}
            max={CAMERA_LIMITS.latitude.max}
            step={CAMERA_LIMITS.latitude.step}
            unit="°"
          />
          <SliderWithInput
            label="Зум"
            value={settings.zoom}
            onChange={(val) => onSettingChange('zoom', val)}
            min={CAMERA_LIMITS.zoom.min}
            max={CAMERA_LIMITS.zoom.max}
            step={CAMERA_LIMITS.zoom.step}
          />
        </Paper>

        <Paper variant="outlined" sx={{ p: 2 }}>
          <Typography variant="caption" color="text.secondary" sx={{ mb: 1, display: 'block' }}>
            Углы обзора
          </Typography>
          <SliderWithInput
            label="Наклон (pitch)"
            value={settings.pitch}
            onChange={(val) => onSettingChange('pitch', val)}
            min={CAMERA_LIMITS.pitch.min}
            max={CAMERA_LIMITS.pitch.max}
            step={CAMERA_LIMITS.pitch.step}
            unit="°"
          />
          <Box sx={{ mt: 0.5, mb: 1.5 }}>
            <Typography variant="caption" color="text.secondary">
              0° = вид сверху, 60°+ = горизонт
            </Typography>
          </Box>
          <SliderWithInput
            label="Поворот (bearing)"
            value={settings.bearing}
            onChange={(val) => onSettingChange('bearing', val)}
            min={CAMERA_LIMITS.bearing.min}
            max={CAMERA_LIMITS.bearing.max}
            step={CAMERA_LIMITS.bearing.step}
            unit="°"
          />
          <Box sx={{ mt: 0.5 }}>
            <Typography variant="caption" color="text.secondary">
              0° = север, 90° = восток, -90° = запад
            </Typography>
          </Box>
        </Paper>

        <Paper variant="outlined" sx={{ p: 2 }}>
          <Typography variant="caption" color="text.secondary" sx={{ mb: 1, display: 'block' }}>
            Быстрые preset'ы
          </Typography>
          <Stack direction="row" spacing={1} justifyContent="space-around" sx={{ mb: 2 }}>
            <Tooltip title="Вид сверху">
              <IconButton size="small" onClick={() => { onSettingChange('pitch', 0); onSettingChange('bearing', 0); }}>
                <CenterFocusWeakIcon fontSize="small" />
              </IconButton>
            </Tooltip>
            <Tooltip title="3D вид (45°)">
              <IconButton size="small" onClick={() => onSettingChange('pitch', 45)}>
                <ThreeDRotationIcon fontSize="small" />
              </IconButton>
            </Tooltip>
          </Stack>
          <Stack direction="row" spacing={1} justifyContent="space-around">
            <Tooltip title="Север"><IconButton size="small" onClick={() => onSettingChange('bearing', 0)}><NorthIcon fontSize="small" /></IconButton></Tooltip>
            <Tooltip title="Восток"><IconButton size="small" onClick={() => onSettingChange('bearing', 90)}><EastIcon fontSize="small" /></IconButton></Tooltip>
            <Tooltip title="Юг"><IconButton size="small" onClick={() => onSettingChange('bearing', 180)}><SouthIcon fontSize="small" /></IconButton></Tooltip>
            <Tooltip title="Запад"><IconButton size="small" onClick={() => onSettingChange('bearing', -90)}><WestIcon fontSize="small" /></IconButton></Tooltip>
          </Stack>
        </Paper>
      </Stack>
    </Box>
  );
};
