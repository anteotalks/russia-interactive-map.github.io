import { useState, useCallback, useRef } from 'react';
import { CameraSettings, DEFAULT_CAMERA_SETTINGS } from '../../types/camera';

interface UseCameraReturn {
  /** Текущие настройки камеры */
  settings: CameraSettings;
  /** Обновить отдельную настройку */
  updateSetting: (key: keyof CameraSettings, value: number) => void;
  /** Обновить несколько настроек */
  updateSettings: (newSettings: Partial<CameraSettings>) => void;
  /** Сбросить к настройкам по умолчанию */
  resetToDefault: () => void;
  /** Ссылка на карту */
  mapRef: React.MutableRefObject<any>;
}

/**
 * Упрощенный хук для управления настройками камеры
 * БЕЗ синхронизации с картой
 */
export const useCamera = (initialSettings?: Partial<CameraSettings>): UseCameraReturn => {
  const [settings, setSettings] = useState<CameraSettings>({
    ...DEFAULT_CAMERA_SETTINGS,
    ...initialSettings
  });
  const mapRef = useRef<any>(null);

  const updateSetting = useCallback((key: keyof CameraSettings, value: number) => {
    setSettings(prev => ({ ...prev, [key]: value }));
  }, []);

  const updateSettings = useCallback((newSettings: Partial<CameraSettings>) => {
    setSettings(prev => ({ ...prev, ...newSettings }));
  }, []);

  const resetToDefault = useCallback(() => {
    setSettings(DEFAULT_CAMERA_SETTINGS);
  }, []);

  return {
    settings,
    updateSetting,
    updateSettings,
    resetToDefault,
    mapRef
  };
};

export default useCamera;
