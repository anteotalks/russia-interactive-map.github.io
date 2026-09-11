#!/bin/bash

# Цвета для вывода
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

echo -e "${YELLOW}🚀 Начинаю автоматическую настройку деплоя на GitHub Pages...${NC}"

# 1. Получаем имя репозитория из git remote
REPO_NAME=$(git remote get-url origin | sed -E 's/.*\/([^\/]+)\.git/\1/')
if [ -z "$REPO_NAME" ]; then
    echo -e "${RED}❌ Не удалось определить имя репозитория. Убедитесь, что у вас настроен git remote 'origin'.${NC}"
    exit 1
fi
echo -e "${GREEN}✅ Имя репозитория: ${REPO_NAME}${NC}"

# 2. Создаем 404.html в папке public
echo -e "${YELLOW}📄 Создаю public/404.html...${NC}"
cat > public/404.html << EOF
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>Redirecting...</title>
  <script>
    sessionStorage.redirect = location.href;
  </script>
  <meta http-equiv="refresh" content="0;URL='/${REPO_NAME}/'">
</head>
<body>
</body>
</html>
EOF
echo -e "${GREEN}✅ public/404.html создан.${NC}"

# 3. Обновляем rsbuild.config.ts (или создаем, если нет)
# ВАЖНО: Этот шаг может перезаписать ваш файл, если он уже существует!
# Поэтому делаем бэкап.
if [ -f "rsbuild.config.ts" ]; then
    cp rsbuild.config.ts rsbuild.config.ts.bak
    echo -e "${YELLOW}📦 Создана резервная копия rsbuild.config.ts.bak${NC}"
fi

echo -e "${YELLOW}🔧 Настраиваю rsbuild.config.ts...${NC}"
cat > rsbuild.config.ts << EOF
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
    assetPrefix: '/${REPO_NAME}/',
  },
  server: {
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
EOF
echo -e "${GREEN}✅ rsbuild.config.ts обновлен.${NC}"

# 4. Ищем и обновляем App.tsx (или main.tsx, где используется BrowserRouter)
# Это самый рискованный шаг, так как мы пытаемся угадать структуру.
APP_FILE=""
if [ -f "src/App.tsx" ]; then
    APP_FILE="src/App.tsx"
elif [ -f "src/main.tsx" ]; then
    APP_FILE="src/main.tsx"
fi

if [ -n "$APP_FILE" ]; then
    echo -e "${YELLOW}🔧 Проверяю ${APP_FILE} на наличие BrowserRouter...${NC}"
    # Проверяем, есть ли BrowserRouter
    if grep -q "BrowserRouter" "$APP_FILE"; then
        # Делаем бэкап
        cp "$APP_FILE" "${APP_FILE}.bak"
        echo -e "${YELLOW}📦 Создана резервная копия ${APP_FILE}.bak${NC}"
        # Добавляем basename, если его нет
        if ! grep -q "basename=" "$APP_FILE"; then
            # Пытаемся заменить <BrowserRouter> на <BrowserRouter basename="/REPO_NAME/">
            # Это грубая замена, но для большинства случаев сработает
            sed -i "s/<BrowserRouter>/<BrowserRouter basename=\"\/${REPO_NAME}\/\">/g" "$APP_FILE"
            echo -e "${GREEN}✅ В ${APP_FILE} добавлен basename для BrowserRouter.${NC}"
        else
            echo -e "${YELLOW}⚠️ basename уже присутствует в ${APP_FILE}, пропускаю.${NC}"
        fi
    else
        echo -e "${YELLOW}⚠️ BrowserRouter не найден в ${APP_FILE}. Если вы используете HashRouter, этот шаг можно пропустить.${NC}"
    fi
else
    echo -e "${YELLOW}⚠️ Не найден src/App.tsx или src/main.tsx. Пропускаю настройку роутера.${NC}"
fi

# 5. Создаем workflow для GitHub Actions
echo -e "${YELLOW}⚙️ Создаю .github/workflows/deploy.yml...${NC}"
mkdir -p .github/workflows
cat > .github/workflows/deploy.yml << EOF
name: Deploy to GitHub Pages

on:
  push:
    branches: ["main", "master"]
  workflow_dispatch:

permissions:
  contents: read
  pages: write
  id-token: write

concurrency:
  group: "pages"
  cancel-in-progress: false

jobs:
  build:
    runs-on: ubuntu-latest
    steps:
      - name: Checkout
        uses: actions/checkout@v4
      
      - name: Setup pnpm
        uses: pnpm/action-setup@v4
        with:
          version: 10
      
      - name: Setup Node
        uses: actions/setup-node@v4
        with:
          node-version: "20"
          cache: "pnpm"
      
      - name: Install dependencies
        run: pnpm install
      
      - name: Build
        run: pnpm run build
      
      - name: Setup Pages
        uses: actions/configure-pages@v4
      
      - name: Upload artifact
        uses: actions/upload-pages-artifact@v3
        with:
          path: "./dist"

  deploy:
    environment:
      name: github-pages
      url: \${{ steps.deployment.outputs.page_url }}
    runs-on: ubuntu-latest
    needs: build
    steps:
      - name: Deploy to GitHub Pages
        id: deployment
        uses: actions/deploy-pages@v4
EOF
echo -e "${GREEN}✅ .github/workflows/deploy.yml создан.${NC}"

echo ""
echo -e "${GREEN}🎉 Готово! Все файлы настроены.${NC}"
echo -e "${YELLOW}⚠️  ВАЖНО: Проверьте изменения, особенно в ${APP_FILE} и rsbuild.config.ts.${NC}"
echo -e "${YELLOW}   Резервные копии сохранены с расширением .bak${NC}"
echo ""
echo -e "${YELLOW}📝 Дальнейшие шаги:${NC}"
echo "1. Проверьте, что скрипт деплоя в package.json корректен (без флага -e react-app)."
echo "2. Убедитесь, что в настройках репозитория (Settings -> Pages) Source установлен на 'GitHub Actions'."
echo "3. Сделайте коммит и пуш изменений в ветку main:"
echo "   git add ."
echo "   git commit -m 'fix: deploy to github pages'"
echo "   git push origin main"
echo ""
echo -e "${GREEN}После пуша деплой запустится автоматически.${NC}"