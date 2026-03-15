/**
 * Типы для работы с цветами и палитрами
 */

export type RgbColor = [number, number, number];
export type RgbaColor = [number, number, number, number];

/**
 * Конфигурация градиента
 */
export interface GradientConfig {
  /** Цвет для отрицательных значений (минимум) */
  startColor: string;
  /** Цвет для нулевого значения (середина) */
  midColor: string;
  /** Цвет для положительных значений (максимум) */
  endColor: string;
}

/**
 * Состояние палитры в приложении
 */
export interface PaletteState {
  /** Текущая выбранная палитра из библиотеки */
  selectedPalette: PaletteName | 'custom';
  /** Пользовательский градиент (если выбран custom) */
  customGradient: GradientConfig;
  /** Флаг инвертирования */
  inverted: boolean;
}

/**
 * События изменения палитры
 */
export interface PaletteEvents {
  onPaletteChange: (palette: string[]) => void;
  onInvert: () => void;
  onCustomGradientChange: (gradient: GradientConfig) => void;
}
