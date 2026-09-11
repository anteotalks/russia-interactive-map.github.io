#!/bin/bash

# ============================================================
# Скрипт реструктуризации Russia Interactive Map
# Создаёт: меню выбора, old/ (Plotly), react-app/ (DeckGL)
# НЕ делает коммит. Только локальные изменения + предпросмотр.
# ============================================================

set -e  # Останавливать скрипт при любой ошибке

# Цвета для вывода
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
CYAN='\033[0;36m'
NC='\033[0m'

echo -e "${CYAN}============================================${NC}"
echo -e "${CYAN}  Russia Interactive Map — Реструктуризация${NC}"
echo -e "${CYAN}============================================${NC}"
echo ""

# ------------------------------------------------------------
# ШАГ 0: Проверка, что мы в корне проекта
# ------------------------------------------------------------
if [ ! -f "package.json" ]; then
    echo -e "${RED}❌ Ошибка: package.json не найден.${NC}"
    echo -e "${RED}   Запустите скрипт из корня проекта.${NC}"
    exit 1
fi

if [ ! -f "rsbuild.config.ts" ]; then
    echo -e "${RED}❌ Ошибка: rsbuild.config.ts не найден.${NC}"
    exit 1
fi

echo -e "${GREEN}✅ Проект найден.${NC}"
echo ""

# ------------------------------------------------------------
# ШАГ 1: Резервные копии
# ------------------------------------------------------------
echo -e "${YELLOW}🔹 Шаг 1: Создание резервных копий...${NC}"

# Резервные копии с датой, чтобы не перезаписывать старые
TIMESTAMP=$(date +%Y%m%d_%H%M%S)

cp rsbuild.config.ts "rsbuild.config.ts.backup_${TIMESTAMP}"
echo -e "${GREEN}   ✅ rsbuild.config.ts.backup_${TIMESTAMP}${NC}"

if [ -f "index.html" ]; then
    cp index.html "index.html.backup_${TIMESTAMP}"
    echo -e "${GREEN}   ✅ index.html.backup_${TIMESTAMP}${NC}"
else
    echo -e "${YELLOW}   ⚠️  index.html не найден в корне (возможно, уже перемещён)${NC}"
fi

echo ""

# ------------------------------------------------------------
# ШАГ 2: Перемещение старой карты в old/
# ------------------------------------------------------------
echo -e "${YELLOW}🔹 Шаг 2: Перемещение старой карты в old/...${NC}"

mkdir -p old

if [ -f "index.html" ]; then
    mv index.html old/index.html
    echo -e "${GREEN}   ✅ index.html → old/index.html${NC}"
else
    echo -e "${YELLOW}   ⚠️  index.html не найден, пропускаем перемещение${NC}"
fi

echo ""

# ------------------------------------------------------------
# ШАГ 3: Создание нового index.html (меню выбора)
# ------------------------------------------------------------
echo -e "${YELLOW}🔹 Шаг 3: Создание меню выбора версий...${NC}"

cat > index.html << 'HTMLEOF'
<!DOCTYPE html>
<html lang="ru">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Russia Interactive Map — выбор версии</title>
    <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body {
            font-family: 'Jost', 'Segoe UI', -apple-system, sans-serif;
            background: linear-gradient(135deg, #1a1a2e 0%, #16213e 100%);
            min-height: 100vh;
            display: flex;
            align-items: center;
            justify-content: center;
            color: #fff;
        }
        .container {
            text-align: center;
            padding: 40px 20px;
            max-width: 720px;
            width: 100%;
        }
        h1 {
            font-size: 2.5rem;
            margin-bottom: 10px;
            font-weight: 700;
            letter-spacing: 1px;
        }
        .subtitle {
            color: rgba(255,255,255,0.55);
            margin-bottom: 48px;
            font-size: 1.1rem;
            font-weight: 400;
        }
        .cards {
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 24px;
        }
        @media (max-width: 600px) {
            .cards { grid-template-columns: 1fr; }
            h1 { font-size: 1.8rem; }
            .subtitle { font-size: 0.95rem; margin-bottom: 32px; }
        }
        .card {
            background: rgba(255,255,255,0.07);
            border: 1px solid rgba(255,255,255,0.12);
            border-radius: 16px;
            padding: 36px 24px;
            text-decoration: none;
            color: #fff;
            transition: all 0.25s ease;
            display: flex;
            flex-direction: column;
            align-items: center;
            gap: 10px;
            cursor: pointer;
        }
        .card:hover {
            background: rgba(255,255,255,0.13);
            transform: translateY(-4px);
            box-shadow: 0 12px 32px rgba(0,0,0,0.45);
            border-color: rgba(255,255,255,0.25);
        }
        .card .icon { font-size: 2.8rem; margin-bottom: 4px; }
        .card .title { font-size: 1.3rem; font-weight: 600; }
        .card .desc { font-size: 0.85rem; color: rgba(255,255,255,0.45); line-height: 1.45; }
        .card.old { border-left: 4px solid #f39c12; }
        .card.new { border-left: 4px solid #3498db; }
        .footer {
            margin-top: 48px;
            font-size: 0.8rem;
            color: rgba(255,255,255,0.25);
        }
    </style>
</head>
<body>
    <div class="container">
        <h1>Russia Interactive Map</h1>
        <p class="subtitle">Выберите версию визуализации</p>
        <div class="cards">
            <a href="./old/" class="card old">
                <span class="icon">🗺️</span>
                <span class="title">Старая версия</span>
                <span class="desc">Plotly · Классическая карта<br>населённых пунктов России</span>
            </a>
            <a href="./react-app/" class="card new">
                <span class="icon">🚀</span>
                <span class="title">Новая версия</span>
                <span class="desc">Deck.gl + TypeScript<br>Интерактивная 3D-визуализация</span>
            </a>
        </div>
        <p class="footer">Антон Павлов · tg-@anteotalks</p>
    </div>
</body>
</html>
HTMLEOF

echo -e "${GREEN}   ✅ Меню выбора создано в index.html${NC}"
echo ""

# ------------------------------------------------------------
# ШАГ 4: Обновление rsbuild.config.ts
# ------------------------------------------------------------
echo -e "${YELLOW}🔹 Шаг 4: Настройка rsbuild.config.ts...${NC}"

cat > rsbuild.config.ts << 'CONFIGEOF'
import { defineConfig, loadEnv } from "@rsbuild/core";
import { pluginReact } from "@rsbuild/plugin-react";
import tailwind from "@tailwindcss/postcss";

const { publicVars } = loadEnv({ cwd: "./environments" });

export default defineConfig({
  plugins: [pluginReact()],
  source: {
    define: publicVars,
  },
  output: {
    // Сборка новой версии идёт в папку react-app, а не в корень
    distPath: {
      root: 'react-app',
    },
    // Все статические ресурсы будут загружаться с префиксом /react-app/
    assetPrefix: '/react-app/',
  },
  server: {
    // Локальный dev-сервер тоже будет отдавать приложение по пути /react-app/
    base: '/react-app/',
    cors: {
      origin: '*',
      methods: ['GET'],
    },
  },
  tools: {
    postcss: {
      postcssOptions: {
        plugins: [tailwind],
      },
    },
  },
});
CONFIGEOF

echo -e "${GREEN}   ✅ rsbuild.config.ts обновлён${NC}"
echo ""

# ------------------------------------------------------------
# ШАГ 5: Установка зависимостей
# ------------------------------------------------------------
echo -e "${YELLOW}🔹 Шаг 5: Установка зависимостей...${NC}"

if command -v pnpm &> /dev/null; then
    pnpm install
    echo -e "${GREEN}   ✅ Зависимости установлены через pnpm${NC}"
elif command -v npm &> /dev/null; then
    npm install
    echo -e "${GREEN}   ✅ Зависимости установлены через npm${NC}"
else
    echo -e "${RED}❌ Не найден ни pnpm, ни npm. Установите Node.js.${NC}"
    exit 1
fi

echo ""

# ------------------------------------------------------------
# ШАГ 6: Сборка проекта
# ------------------------------------------------------------
echo -e "${YELLOW}🔹 Шаг 6: Сборка новой версии...${NC}"

if command -v pnpm &> /dev/null; then
    pnpm run build
else
    npm run build
fi

echo -e "${GREEN}   ✅ Сборка завершена. Проверьте папку react-app/${NC}"
echo ""

# ------------------------------------------------------------
# ШАГ 7: Проверка результата сборки
# ------------------------------------------------------------
echo -e "${YELLOW}🔹 Шаг 7: Проверка результата...${NC}"

if [ -f "react-app/index.html" ]; then
    echo -e "${GREEN}   ✅ react-app/index.html существует${NC}"
else
    echo -e "${RED}   ❌ react-app/index.html НЕ найден!${NC}"
    echo -e "${RED}      Проверьте настройки distPath в rsbuild.config.ts${NC}"
    exit 1
fi

if [ -f "old/index.html" ]; then
    echo -e "${GREEN}   ✅ old/index.html существует${NC}"
else
    echo -e "${YELLOW}   ⚠️  old/index.html не найден${NC}"
fi

echo ""

# ------------------------------------------------------------
# ШАГ 8: Локальный предпросмотр
# ------------------------------------------------------------
echo -e "${CYAN}============================================${NC}"
echo -e "${CYAN}  ЛОКАЛЬНЫЙ ПРЕДПРОСМОТР${NC}"
echo -e "${CYAN}============================================${NC}"
echo ""
echo -e "  ${GREEN}Меню:${NC}          http://localhost:3000/"
echo -e "  ${GREEN}Старая версия:${NC}  http://localhost:3000/old/"
echo -e "  ${GREEN}Новая версия:${NC}  http://localhost:3000/react-app/"
echo ""
echo -e "  Нажмите ${YELLOW}Ctrl+C${NC}, чтобы остановить сервер."
echo ""

npx serve . -p 3000