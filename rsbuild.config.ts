import { defineConfig, loadEnv, type RsbuildPlugin } from "@rsbuild/core";
import { pluginReact } from "@rsbuild/plugin-react";
import tailwind from "@tailwindcss/postcss";
import { cpSync, existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { join, dirname } from "node:path";
import { spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));

const { publicVars } = loadEnv({ cwd: "./environments" });

// После сборки: копируем селектор + старую версию + генерим data.js.
// rsbuild кладёт app (deck.gl) в react-app/, а нам нужен корень сайта = селектор.
const siteLayoutPlugin: RsbuildPlugin = {
  name: "site-layout",
  setup(api) {
    api.onAfterBuild(() => {
      // корень сборки = context.distPath (output.distPath.root = 'react-app')
      // Новая версия (deck.gl) остаётся в <root>/ (react-app/index.html + static/).
      // Селектор кладём в <root>/react-app/index.html — чтобы ./react-app/ открывала выбор.
      const distPath = api.context.distPath;
      // 1) Селектор -> <root>/react-app/index.html
      try {
        const selDir = join(distPath, "react-app");
        if (!existsSync(selDir)) mkdirSync(selDir, { recursive: true });
        const selector = readFileSync(join(__dirname, "index.html"), "utf8");
        writeFileSync(join(selDir, "index.html"), selector, "utf8");
        console.log("[site-layout] selector -> react-app/");
      } catch (e) {
        console.warn("[site-layout] selector copy failed:", e);
      }
      // 2) Старая (plotly) версия -> <root>/old/ (кроме data.js — сгенерим ниже)
      try {
        const srcOld = join(__dirname, "old");
        const dstOld = join(distPath, "old");
        if (existsSync(srcOld)) {
          if (!existsSync(dstOld)) mkdirSync(dstOld, { recursive: true });
          for (const f of ["index.html", "map.png", "regions.js"]) {
            const sp = join(srcOld, f);
            if (existsSync(sp)) cpSync(sp, join(dstOld, f));
          }
          console.log("[site-layout] old/ -> build (без data.js)");
        }
      } catch (e) {
        console.warn("[site-layout] old/ copy failed:", e);
      }
      // 3) Генерация data.js -> react-app/old/data.js (не в git)
      try {
        const r = spawnSync(
          process.execPath,
          [join(__dirname, "scripts", "gen-data.js"), join(distPath, "old")],
          { stdio: "inherit" }
        );
        if (r.status !== 0) console.warn("[site-layout] gen-data.js failed");
      } catch (e) {
        console.warn("[site-layout] gen-data failed:", e);
      }
    });
  },
};

export default defineConfig({
  plugins: [pluginReact(), siteLayoutPlugin],
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
