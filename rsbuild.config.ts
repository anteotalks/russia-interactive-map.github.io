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
    // Сборка новой версии идёт в папку react-app
    distPath: {
      root: 'react-app',
    },
    // КЛЮЧЕВОЕ: относительные пути './'
    assetPrefix: './',
  },
  server: {
    // Убираем 'base', чтобы он не конфликтовал с assetPrefix при сборке
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