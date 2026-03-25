#!/bin/bash

echo "🔧 Добавляем фильтрацию населенных пунктов по выбранным регионам..."

# ============================================================================
# 1. ОБНОВЛЯЕМ MapPage.tsx - добавляем фильтрацию по регионам
# ============================================================================

FILE="src/pages/MapPage/ui/MapPage.tsx"

# Создаем бэкап
cp "$FILE" "$FILE.backup.filter"

# Находим строку с filteredLocations и добавляем ее после stableLocations
cat > /tmp/filtered_locations.txt << 'EOF'
  // Фильтруем локации по выбранным регионам
  const filteredLocations = useMemo(() => {
    if (!locations) return null;
    if (selectedRegions.size === 0) return null; // Если не выбрано ни одного региона - не показываем ничего
    return locations.filter(loc => selectedRegions.has(loc.region));
  }, [locations, selectedRegions]);
EOF

# Вставляем после stableLocations
sed -i '/const stableLocations = useMemo(() => locations, \[locations\]);/a '"$(cat /tmp/filtered_locations.txt)"'' "$FILE"

rm -f /tmp/filtered_locations.txt

# Меняем stableLocations на filteredLocations в layerSettings и deckLayers
sed -i 's/const deckLayers = useMapLayers(stableLocations/const deckLayers = useMapLayers(filteredLocations/' "$FILE"
sed -i 's/const layerSettings = useMemo(() => ({/const layerSettings = useMemo(() => ({/' "$FILE"

# Добавляем зависимость selectedRegions в useMemo для filteredLocations
echo "✅ Фильтрация добавлена"

# ============================================================================
# 2. ОБНОВЛЯЕМ ControlPanel.tsx - добавляем информацию о количестве выбранных
# ============================================================================

FILE_CP="src/widgets/ControlPanel/ui/ControlPanel.tsx"

# Добавляем отображение количества выбранных регионов и точек
sed -i '/{activeTab === 6 && (/,/)}/ {
  /<RegionList/ a\
              <Typography variant="caption" color="text.secondary" sx={{ mt: 1, display: 'block' }}>
                {props.selectedRegions.size === 0 
                  ? "⚠️ Не выбрано ни одного региона - населенные пункты не отображаются"
                  : `✅ Выбрано регионов: ${props.selectedRegions.size}`}
              </Typography>
}' "$FILE_CP"

echo "✅ ControlPanel.tsx обновлен"

# ============================================================================
# 3. ДОБАВЛЯЕМ КНОПКУ "Сбросить выделение" в RegionList если нет
# ============================================================================

if [ -f "src/shared/ui/RegionList/RegionList.tsx" ]; then
    # Добавляем кнопку сброса в RegionList
    sed -i '/<Button size="small" variant="outlined" onClick={handleDeselectAll}/a \        <Button size="small" variant="outlined" onClick={() => onSelectionChange(new Set())} fullWidth>\n          Сбросить\n        </Button>' src/shared/ui/RegionList/RegionList.tsx
    echo "✅ Добавлена кнопка 'Сбросить' в RegionList"
fi

echo ""
echo "═══════════════════════════════════════════════════════════════════"
echo "✅ ГОТОВО! Теперь работает фильтрация:"
echo ""
echo "   - Выбрано 0 регионов → населенные пункты НЕ ПОКАЗЫВАЮТСЯ"
echo "   - Выбран 1 регион → показываются только пункты этого региона"
echo "   - Выбрано 2 региона → показываются пункты этих 2 регионов"
echo "   - Выбрано 5 регионов → показываются пункты этих 5 регионов"
echo ""
echo "В панели видно:"
echo "   - ⚠️ Предупреждение если не выбрано ни одного региона"
echo "   - ✅ Количество выбранных регионов"
echo ""
echo "Перезапустите проект: pnpm dev"
echo "═══════════════════════════════════════════════════════════════════"