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
    // ЯВНО принудительно копировать файлы из public в сборку react-app
    publicDir: {
      copyOnBuild: true,
    },
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