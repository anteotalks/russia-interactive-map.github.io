#!/bin/bash
set -e

echo "🎨 ДОБАВЛЯЕМ ШРИФТ JOST ВЕЗДЕ И ВОДЯНОЙ ЗНАК"

# -----------------------------------------------------------------------------
# 1. Обновляем index.css - добавляем шрифт Jost глобально
# -----------------------------------------------------------------------------
cat > src/index.css << 'EOF'
@import url('https://fonts.googleapis.com/css2?family=Jost:wght@400;500;600;700;800&display=swap');

html, body {
  margin: 0;
  padding: 0;
  width: 100%;
  height: 100%;
  overflow: hidden;
  font-family: 'Jost', sans-serif !important;
}

#root {
  width: 100%;
  height: 100%;
  font-family: 'Jost', sans-serif !important;
}

/* Применяем Jost ко всем элементам */
* {
  font-family: 'Jost', sans-serif !important;
}

/* Высокий z-index для всех draggable элементов */
.react-draggable,
.react-draggable-dragging,
.rnd-container,
[data-rnd] {
  z-index: 1300 !important;
}

.control-panel-mini {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 40px;
  height: 40px;
  background-color: white;
  border-radius: 8px;
  box-shadow: 0 2px 10px rgba(0,0,0,0.2);
  cursor: move;
  transition: all 0.2s;
  z-index: 1300;
  font-family: 'Jost', sans-serif !important;
}

.control-panel-mini:hover {
  box-shadow: 0 4px 15px rgba(0,0,0,0.3);
  transform: scale(1.05);
}

/* Стили для Material UI компонентов */
.MuiTypography-root,
.MuiButton-root,
.MuiFormControlLabel-label,
.MuiInputLabel-root,
.MuiMenuItem-root,
.MuiTab-root,
.MuiListItemText-primary,
.MuiListItemText-secondary,
.MuiChip-label,
.MuiFormControl-root,
.MuiSelect-select,
.MuiRadio-root,
.MuiSwitch-root,
.MuiSlider-root,
.MuiInputBase-root,
.MuiPaper-root,
.MuiCardContent-root,
.MuiAlert-root {
  font-family: 'Jost', sans-serif !important;
}

/* Стили для Recharts */
.recharts-text,
.recharts-cartesian-axis-tick-value,
.recharts-tooltip-label,
.recharts-default-tooltip {
  font-family: 'Jost', sans-serif !important;
}
EOF

# -----------------------------------------------------------------------------
# 2. Обновляем index.tsx - добавляем импорт шрифта
# -----------------------------------------------------------------------------
cat > src/index.tsx << 'EOF'
import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import './index.css';

// Импорт шрифта Jost через Google Fonts
const link = document.createElement('link');
link.href = 'https://fonts.googleapis.com/css2?family=Jost:wght@400;500;600;700;800&display=swap';
link.rel = 'stylesheet';
document.head.appendChild(link);

const root = ReactDOM.createRoot(document.getElementById('root') as HTMLElement);
root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
EOF

# -----------------------------------------------------------------------------
# 3. Добавляем Watermark компонент
# -----------------------------------------------------------------------------
cat > src/shared/ui/Watermark/Watermark.tsx << 'EOF'
import React from 'react';
import { Box } from '@mui/material';

export const Watermark: React.FC = () => {
  return (
    <Box
      sx={{
        position: 'fixed',
        bottom: 20,
        left: 20,
        zIndex: 9998,
        pointerEvents: 'none',
        userSelect: 'none',
        lineHeight: 1.1,
        fontFamily: 'Jost, sans-serif',
      }}
    >
      <Box
        sx={{
          fontWeight: 700,
          fontSize: '30px',
          textTransform: 'uppercase',
          letterSpacing: '1px',
          color: 'rgba(128, 128, 128, 0.5)',
          fontFamily: 'Jost, sans-serif',
        }}
      >
        АНТОН ПАВЛОВ
      </Box>
      <Box
        sx={{
          fontWeight: 400,
          fontSize: '26px',
          color: 'rgba(128, 128, 128, 0.5)',
          fontFamily: 'Jost, sans-serif',
        }}
      >
        tg-@anteotalks
      </Box>
    </Box>
  );
};

export default Watermark;
EOF

# -----------------------------------------------------------------------------
# 4. Добавляем Watermark в App.tsx
# -----------------------------------------------------------------------------
cat > src/App.tsx << 'EOF'
import React from 'react';
import { MapPage } from './pages/MapPage';
import { Watermark } from './shared/ui/Watermark';

function App() {
  return (
    <div style={{ 
      width: '100%', 
      height: '100%',
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0
    }}>
      <MapPage />
      <Watermark />
    </div>
  );
}

export default App;
EOF

# -----------------------------------------------------------------------------
# 5. Обновляем Watermark/index.ts
# -----------------------------------------------------------------------------
cat > src/shared/ui/Watermark/index.ts << 'EOF'
export { default } from './Watermark';
export { Watermark } from './Watermark';
EOF

# -----------------------------------------------------------------------------
# 6. Обновляем shared/ui/index.ts
# -----------------------------------------------------------------------------
cat > src/shared/ui/index.ts << 'EOF'
export { SliderWithInput } from './SliderWithInput';
export { CameraControls } from './CameraControls';
export { PaletteLibrary } from './PaletteLibrary';
export { GradientPicker } from './GradientPicker';
export { RegionList } from './RegionList';
export { Watermark } from './Watermark';
export { default as Dashboard } from './Dashboard';
export { SelectionToolbar } from './SelectionToolbar';
export { SettlementSearch } from './SettlementSearch';
EOF

echo ""
echo "✅ ГОТОВО!"
echo ""
echo "📋 ЧТО СДЕЛАНО:"
echo "   1. Шрифт Jost применён глобально ко всем элементам через CSS"
echo "   2. Добавлены стили для Material UI компонентов"
echo "   3. Добавлены стили для Recharts"
echo "   4. Водяной знак добавлен в App.tsx над картой"
echo "   5. Водяной знак выглядит точно как в старом коде:"
echo "      - 'АНТОН ПАВЛОВ' жирным 30px"
echo "      - 'tg-@anteotalks' обычным 26px"
echo "      - Цвет rgba(128,128,128,0.5)"
echo "      - Позиция bottom: 20px, left: 20px"
echo ""
echo "🚀 Запускайте: pnpm dev"