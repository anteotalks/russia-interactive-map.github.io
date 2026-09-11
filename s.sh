#!/bin/bash
set -e

GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m'

echo -e "${YELLOW}🔹 Создаю резервные копии...${NC}"
TIMESTAMP=$(date +%Y%m%d_%H%M%S)

cp src/entities/location/lib/types.ts "src/entities/location/lib/types.ts.bak_${TIMESTAMP}"
cp src/entities/location/api/locationApi.ts "src/entities/location/api/locationApi.ts.bak_${TIMESTAMP}"
cp src/pages/MapPage/ui/MapPage.tsx "src/pages/MapPage/ui/MapPage.tsx.bak_${TIMESTAMP}"
cp src/widgets/ControlPanel/ui/ControlPanel.tsx "src/widgets/ControlPanel/ui/ControlPanel.tsx.bak_${TIMESTAMP}"

echo -e "${GREEN}✅ Резервные копии созданы${NC}"

python3 << 'PYEOF'
import re
import sys

def fail(msg):
    print(f"❌ Ошибка: {msg}", file=sys.stderr)
    sys.exit(1)

# ------------------------------------------------------------
# 1. types.ts
# ------------------------------------------------------------
path = "src/entities/location/lib/types.ts"
with open(path, "r", encoding="utf-8") as f:
    content = f.read()

if "is_north" in content:
    print("⚠️  types.ts: is_north уже есть, пропускаем")
else:
    old = "    longitude: number;"
    new = "    longitude: number;\n    is_north: number;"
    if old not in content:
        fail("types.ts: не найдена строка 'longitude: number;'")
    content = content.replace(old, new, 1)
    with open(path, "w", encoding="utf-8") as f:
        f.write(content)
    print("✅ types.ts: добавлено поле is_north")

# ------------------------------------------------------------
# 2. locationApi.ts
# ------------------------------------------------------------
path = "src/entities/location/api/locationApi.ts"
with open(path, "r", encoding="utf-8") as f:
    content = f.read()

if "is_north" in content:
    print("⚠️  locationApi.ts: is_north уже есть, пропускаем")
else:
    old = "              longitude: parseEuropeanNumber(row['Долгота']),"
    new = (
        "              longitude: parseEuropeanNumber(row['Долгота']),\n"
        "              is_north: parseInt(row['is_north'], 10) || 0,"
    )
    if old not in content:
        fail("locationApi.ts: не найдена строка 'longitude: parseEuropeanNumber(...)'")
    content = content.replace(old, new, 1)
    with open(path, "w", encoding="utf-8") as f:
        f.write(content)
    print("✅ locationApi.ts: добавлен парсинг is_north")

# ------------------------------------------------------------
# 3. MapPage.tsx
# ------------------------------------------------------------
path = "src/pages/MapPage/ui/MapPage.tsx"
with open(path, "r", encoding="utf-8") as f:
    content = f.read()

if "northFilter" in content:
    print("⚠️  MapPage.tsx: northFilter уже есть, пропускаем")
else:
    # 3.1. Состояние
    old_state = "  const [selectedRegions, setSelectedRegions] = useState<Set<string>>(new Set());"
    new_state = (
        "  const [selectedRegions, setSelectedRegions] = useState<Set<string>>(new Set());\n"
        "  const [northFilter, setNorthFilter] = useState<'all' | 'north' | 'south'>('all');"
    )
    if old_state not in content:
        fail("MapPage.tsx: не найдено объявление selectedRegions")
    content = content.replace(old_state, new_state, 1)

    # 3.2. Фильтрация в filteredLocations
    pattern = re.compile(
        r"(  const filteredLocations = useMemo\(\(\) => \{\n"
        r"    if \(!locations\) return null;\n)"
        r"(    if \(selectedRegions\.size === 0\) return null;\n"
        r"    return locations\.filter\(loc => selectedRegions\.has\(loc\.region\)\);\n"
        r"  \}, \[locations, selectedRegions\]\);)"
    )
    replacement = (
        r"\1"
        r"    let filtered = locations;\n"
        r"    if (selectedRegions.size > 0) {\n"
        r"      filtered = filtered.filter(loc => selectedRegions.has(loc.region));\n"
        r"    }\n"
        r"    if (northFilter === 'north') {\n"
        r"      filtered = filtered.filter(loc => loc.is_north === 1);\n"
        r"    } else if (northFilter === 'south') {\n"
        r"      filtered = filtered.filter(loc => loc.is_north === 0);\n"
        r"    }\n"
        r"    return filtered;\n"
        r"  }, [locations, selectedRegions, northFilter]);"
    )
    new_content, count = pattern.subn(replacement, content)
    if count == 0:
        fail("MapPage.tsx: не найден блок filteredLocations")
    content = new_content

    # 3.3. Пропсы в ControlPanel
    old_prop = "        onCenterSelectedRegions={handleCenterSelectedRegions}"
    new_prop = (
        "        onCenterSelectedRegions={handleCenterSelectedRegions}\n"
        "        northFilter={northFilter}\n"
        "        onNorthFilterChange={setNorthFilter}"
    )
    if old_prop not in content:
        fail("MapPage.tsx: не найден проп onCenterSelectedRegions")
    content = content.replace(old_prop, new_prop, 1)

    with open(path, "w", encoding="utf-8") as f:
        f.write(content)
    print("✅ MapPage.tsx: добавлены northFilter, фильтрация и пропсы")

# ------------------------------------------------------------
# 4. ControlPanel.tsx
# ------------------------------------------------------------
path = "src/widgets/ControlPanel/ui/ControlPanel.tsx"
with open(path, "r", encoding="utf-8") as f:
    content = f.read()

if "northFilter" in content:
    print("⚠️  ControlPanel.tsx: northFilter уже есть, пропускаем")
else:
    # 4.1. Пропсы в интерфейсе
    old_iface = "  onCenterSelectedRegions: () => void;"
    new_iface = (
        "  onCenterSelectedRegions: () => void;\n"
        "  northFilter: 'all' | 'north' | 'south';\n"
        "  onNorthFilterChange: (filter: 'all' | 'north' | 'south') => void;"
    )
    if old_iface not in content:
        fail("ControlPanel.tsx: не найден onCenterSelectedRegions в интерфейсе")
    content = content.replace(old_iface, new_iface, 1)

    # 4.2. Деструктуризация — твой реальный формат
    old_destr = "regionsList, selectedRegions, onRegionsSelectionChange, onCenterRegion, onCenterSelectedRegions\n  } = props;"
    new_destr = (
        "regionsList, selectedRegions, onRegionsSelectionChange, onCenterRegion, onCenterSelectedRegions,\n"
        "    northFilter, onNorthFilterChange\n"
        "  } = props;"
    )
    if old_destr not in content:
        fail("ControlPanel.tsx: не найдена деструктуризация onCenterSelectedRegions (проверь формат)")
    content = content.replace(old_destr, new_destr, 1)

    # 4.3. UI на вкладке "Регионы"
    # ВАЖНО: используем обычные " без экранирования
    pattern = re.compile(
        r"(<RegionList\n"
        r"                regions=\{regionsList\}\n"
        r"                selectedRegions=\{selectedRegions\}\n"
        r"                onSelectionChange=\{onRegionsSelectionChange\}\n"
        r"                onCenterRegion=\{onCenterRegion\}\n"
        r"                onCenterSelected=\{onCenterSelectedRegions\}\n"
        r"              />)"
    )

    ui_block = (
        r"\1\n\n"
        r"              <Divider sx={{ my: 2 }} />\n"
        r"              <Typography variant=\"subtitle2\" color=\"primary\">Фильтр по северу</Typography>\n"
        r"              <ToggleButtonGroup\n"
        r"                value={northFilter}\n"
        r"                exclusive\n"
        r"                onChange={(_, val) => val && onNorthFilterChange(val)}\n"
        r"                size=\"small\"\n"
        r"                fullWidth\n"
        r"              >\n"
        r"                <ToggleButton value=\"all\">Все</ToggleButton>\n"
        r"                <ToggleButton value=\"north\">Только север</ToggleButton>\n"
        r"                <ToggleButton value=\"south\">Всё, кроме севера</ToggleButton>\n"
        r"              </ToggleButtonGroup>"
    )
    new_content, count = pattern.subn(ui_block, content)
    if count == 0:
        fail("ControlPanel.tsx: не найден блок RegionList для вставки UI")
    content = new_content

    with open(path, "w", encoding="utf-8") as f:
        f.write(content)
    print("✅ ControlPanel.tsx: добавлены пропсы и UI")

print("\n🎉 Все изменения применены успешно!")
PYEOF

echo ""
echo -e "${GREEN}✅ Готово. Проверь изменения:${NC}"
echo "   git --no-pager diff"
echo ""
echo -e "${YELLOW}⚠️  Если что-то не так — откатись:${NC}"
echo "   git restore ."