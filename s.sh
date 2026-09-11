#!/bin/bash
set -e

PROJECT_DIR="/home/anton/Рабочий стол/проекты/russia-interactive-map.github.io"
cd "$PROJECT_DIR" || { echo "❌ Папка не найдена"; exit 1; }

echo "🔧 ПРИМЕНЯЮ ФИЛЬТР «СЕВЕР» В КОДЕ"

# --- Бэкапы ---
mkdir -p .backup_north_code
cp src/entities/location/lib/types.ts .backup_north_code/ 2>/dev/null || true
cp src/entities/location/api/locationApi.ts .backup_north_code/ 2>/dev/null || true
cp src/pages/MapPage/ui/MapPage.tsx .backup_north_code/ 2>/dev/null || true
cp src/widgets/ControlPanel/ui/ControlPanel.tsx .backup_north_code/ 2>/dev/null || true
echo "📦 Бэкап в .backup_north_code/"

# -----------------------------------------------------------------------------
# 1. types.ts — добавляем is_north
# -----------------------------------------------------------------------------
python3 << 'PYEOF'
import io
path = "src/entities/location/lib/types.ts"
with io.open(path, encoding="utf-8") as f:
    content = f.read()

if 'is_north' not in content:
    content = content.replace(
        "    longitude: number;\n};",
        "    longitude: number;\n    is_north?: boolean;\n};"
    )
    with io.open(path, "w", encoding="utf-8") as f:
        f.write(content)
    print("✅ types.ts: is_north добавлен")
else:
    print("⏭️  types.ts: is_north уже есть")
PYEOF

# -----------------------------------------------------------------------------
# 2. locationApi.ts — парсим is_north
# -----------------------------------------------------------------------------
python3 << 'PYEOF'
import io
path = "src/entities/location/api/locationApi.ts"
with io.open(path, encoding="utf-8") as f:
    content = f.read()

if 'is_north' not in content:
    content = content.replace(
        "              longitude: parseEuropeanNumber(row['Долгота']),",
        "              longitude: parseEuropeanNumber(row['Долгота']),\n"
        "              is_north: row['is_north'] === '1',"
    )
    with io.open(path, "w", encoding="utf-8") as f:
        f.write(content)
    print("✅ locationApi.ts: is_north парсится")
else:
    print("⏭️  locationApi.ts: is_north уже парсится")
PYEOF

# -----------------------------------------------------------------------------
# 3. MapPage.tsx — состояние + фильтр + пропсы
# -----------------------------------------------------------------------------
python3 << 'PYEOF'
import io, re
path = "src/pages/MapPage/ui/MapPage.tsx"
with io.open(path, encoding="utf-8") as f:
    content = f.read()

# 3.1 Состояние
if 'northFilterMode' not in content:
    content = content.replace(
        "const [dashboardOpen, setDashboardOpen] = useState(false);",
        "const [dashboardOpen, setDashboardOpen] = useState(false);\n"
        "  const [northFilterMode, setNorthFilterMode] = useState<'all' | 'onlyNorth' | 'excludeNorth'>('all');"
    )
    print("✅ MapPage: state northFilterMode")

# 3.2 Замена filteredLocations (любой вариант)
pattern = re.compile(
    r"  const filteredLocations = useMemo\(\(\) => \{.*?\}, \[.*?\]\);",
    re.DOTALL
)
new_filter = """  const filteredLocations = useMemo(() => {
    if (!locations) return null;

    // Ничего не выбрано — не показываем точки (как раньше)
    if (selectedRegions.size === 0 && northFilterMode === 'all') return null;

    let result = locations;

    // Фильтр по регионам
    if (selectedRegions.size > 0) {
      result = result.filter(loc => selectedRegions.has(loc.region));
    }

    // Фильтр по северу
    if (northFilterMode === 'onlyNorth') {
      result = result.filter(loc => loc.is_north === true);
    } else if (northFilterMode === 'excludeNorth') {
      result = result.filter(loc => loc.is_north !== true);
    }

    return result;
  }, [locations, selectedRegions, northFilterMode]);"""

if pattern.search(content):
    content = pattern.sub(new_filter, content)
    print("✅ MapPage: filteredLocations обновлён")
else:
    print("❌ MapPage: filteredLocations не найден — проверь вручную")

# 3.3 Пропсы в ControlPanel
if 'northFilterMode={northFilterMode}' not in content:
    content = content.replace(
        "onCenterSelectedRegions={handleCenterSelectedRegions}\n      />",
        "onCenterSelectedRegions={handleCenterSelectedRegions}\n"
        "        northFilterMode={northFilterMode}\n"
        "        onNorthFilterModeChange={setNorthFilterMode}\n"
        "      />"
    )
    print("✅ MapPage: пропсы добавлены")

with io.open(path, "w", encoding="utf-8") as f:
    f.write(content)
PYEOF

# -----------------------------------------------------------------------------
# 4. ControlPanel.tsx — типы, деструктуризация, тумблеры
# -----------------------------------------------------------------------------
python3 << 'PYEOF'
import io
path = "src/widgets/ControlPanel/ui/ControlPanel.tsx"
with io.open(path, encoding="utf-8") as f:
    content = f.read()

# 4.1 Типы пропсов
if 'northFilterMode?:' not in content:
    content = content.replace(
        "onCenterSelectedRegions: () => void;\n}",
        "onCenterSelectedRegions: () => void;\n"
        "  northFilterMode?: 'all' | 'onlyNorth' | 'excludeNorth';\n"
        "  onNorthFilterModeChange?: (mode: 'all' | 'onlyNorth' | 'excludeNorth') => void;\n}"
    )
    print("✅ ControlPanel: типы пропсов")

# 4.2 Деструктуризация
if 'northFilterMode =' not in content:
    content = content.replace(
        "regionsList, selectedRegions, onRegionsSelectionChange, onCenterRegion, onCenterSelectedRegions\n  } = props;",
        "regionsList, selectedRegions, onRegionsSelectionChange, onCenterRegion, onCenterSelectedRegions,\n"
        "    northFilterMode = 'all', onNorthFilterModeChange\n  } = props;"
    )
    print("✅ ControlPanel: деструктуризация")

# 4.3 Тумблеры во вкладке «Регионы»
if 'northFilterMode === ' not in content:
    old_block = """          {activeTab === 6 && (
            <Stack spacing={2}>
              <RegionList"""
    new_block = """          {activeTab === 6 && (
            <Stack spacing={2}>
              <Box sx={{ p: 1.5, bgcolor: '#f5f5f5', borderRadius: 1, mb: 1 }}>
                <Typography variant="subtitle2" color="primary" gutterBottom>
                  Фильтр по северному полигону
                </Typography>
                <FormControlLabel
                  control={<Switch size="small" checked={northFilterMode === 'onlyNorth'}
                    onChange={(e) => onNorthFilterModeChange?.(e.target.checked ? 'onlyNorth' : 'all')} />}
                  label="Только север"
                />
                <FormControlLabel
                  control={<Switch size="small" checked={northFilterMode === 'excludeNorth'}
                    onChange={(e) => onNorthFilterModeChange?.(e.target.checked ? 'excludeNorth' : 'all')} />}
                  label="Исключить север"
                />
              </Box>
              <RegionList"""
    if old_block in content:
        content = content.replace(old_block, new_block)
        print("✅ ControlPanel: тумблеры добавлены")
    else:
        print("❌ ControlPanel: блок вкладки «Регионы» не найден")

with io.open(path, "w", encoding="utf-8") as f:
    f.write(content)
PYEOF

echo ""
echo "✅ ГОТОВО"
echo ""
echo "📋 Проверка:"
echo "  grep -c northFilterMode src/pages/MapPage/ui/MapPage.tsx"
echo "  grep -c northFilterMode src/widgets/ControlPanel/ui/ControlPanel.tsx"
echo "  grep -c is_north src/entities/location/lib/types.ts"
echo "  grep -c is_north src/entities/location/api/locationApi.ts"
echo ""
echo "🚀 Запускай: pnpm dev"
echo "   Вкладка «Регионы» → блок «Фильтр по северному полигону»"