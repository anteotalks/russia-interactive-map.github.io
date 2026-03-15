/**
 * Типы для настроек камеры карты
 * Основано на документации MapLibre CameraOptions и deck.gl MapView
 */

export interface CameraSettings {
  /** Долгота центра карты (от -180 до 180) */
  longitude: number;
  /** Широта центра карты (от -85 до 85) */
  latitude: number;
  /** Уровень зума (от 0 до 22) */
  zoom: number;
  /** Наклон карты в градусах (от 0 до 85) */
  pitch: number;
  /** Поворот карты в градусах (от -180 до 180) */
  bearing: number;
}

/**
 * Настройки камеры по умолчанию для карты России
 */
export const DEFAULT_CAMERA_SETTINGS: CameraSettings = {
  longitude: 95,
  latitude: 62,
  zoom: 3,
  pitch: 0,
  bearing: 0
};

/**
 * Допустимые диапазоны значений для ползунков
 */
export const CAMERA_LIMITS = {
  longitude: { min: -180, max: 180, step: 0.1 },
  latitude: { min: -85, max: 85, step: 0.1 },
  zoom: { min: 1, max: 20, step: 0.1 },
  pitch: { min: 0, max: 85, step: 1 },
  bearing: { min: -180, max: 180, step: 1 }
} as const;

/**
 * Тип для ключей настроек камеры
 */
export type CameraSettingKey = keyof CameraSettings;
