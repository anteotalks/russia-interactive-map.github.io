import { useState, useCallback, useMemo } from 'react';
import {
  PALETTE_LIBRARY,
  DEFAULT_PALETTE,
  PaletteName,
  GradientConfig
} from '../../../entities/palette';
import { invertPalette } from '../color';

export interface UsePaletteReturn {
  /** Текущий массив цветов */
  palette: string[];
  /** Название выбранной палитры */
  selectedName: PaletteName | 'custom';
  /** Пользовательский градиент */
  customGradient: GradientConfig;
  /** Выбрать палитру из библиотеки */
  selectPalette: (name: PaletteName | 'custom') => void;
  /** Установить цвета палитры (для custom) */
  setPaletteColors: (colors: string[]) => void;
  /** Установить пользовательский градиент */
  setCustomGradient: (gradient: GradientConfig) => void;
  /** Инвертировать текущую палитру */
  toggleInvert: () => void;
  /** Сбросить к палитре по умолчанию */
  resetToDefault: () => void;
}

const DEFAULT_GRADIENT: GradientConfig = {
  startColor: '#d7191c',
  midColor: '#ffffbf',
  endColor: '#1a9641'
};

export const usePalette = (): UsePaletteReturn => {
  const [selectedName, setSelectedName] = useState<PaletteName | 'custom'>('Красный-Жёлтый-Зелёный (RdYlGn)');
  const [customGradient, setCustomGradient] = useState<GradientConfig>(DEFAULT_GRADIENT);
  const [customColors, setCustomColors] = useState<string[]>([
    DEFAULT_GRADIENT.startColor,
    DEFAULT_GRADIENT.midColor,
    DEFAULT_GRADIENT.endColor
  ]);
  const [inverted, setInverted] = useState(false);

  // Текущая палитра (вычисляемое значение)
  const palette = useMemo(() => {
    let colors: string[];
    if (selectedName === 'custom') {
      colors = [...customColors];
    } else {
      const base = PALETTE_LIBRARY[selectedName as PaletteName];
      colors = base && Array.isArray(base) && base.length >= 3 ? [...base] : DEFAULT_PALETTE;
    }
    return inverted ? invertPalette(colors) : colors;
  }, [selectedName, customColors, inverted]);

  const selectPalette = useCallback((name: PaletteName | 'custom') => {
    setSelectedName(name);
    setInverted(false); // сбрасываем инвертирование при смене палитры
  }, []);

  const setPaletteColors = useCallback((colors: string[]) => {
    if (colors.length >= 3) {
      setCustomColors(colors.slice(0, 3));
      setCustomGradient({
        startColor: colors[0],
        midColor: colors[1],
        endColor: colors[2]
      });
    }
  }, []);

  const toggleInvert = useCallback(() => {
    setInverted(prev => !prev);
  }, []);

  const resetToDefault = useCallback(() => {
    setSelectedName('Красный-Жёлтый-Зелёный (RdYlGn)');
    setCustomGradient(DEFAULT_GRADIENT);
    setCustomColors([DEFAULT_GRADIENT.startColor, DEFAULT_GRADIENT.midColor, DEFAULT_GRADIENT.endColor]);
    setInverted(false);
  }, []);

  return {
    palette,
    selectedName,
    customGradient,
    selectPalette,
    setPaletteColors,
    setCustomGradient,
    toggleInvert,
    resetToDefault
  };
};

export default usePalette;
