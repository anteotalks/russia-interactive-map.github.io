import { defineConfig, loadEnv, type RsbuildPlugin } from "@rsbuild/core";
import { pluginReact } from "@rsbuild/plugin-react";
import tailwind from "@tailwindcss/postcss";
import { cpSync, existsSync, mkdirSync, readFileSync, rmSync, writeFileSync } from "node:fs";
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
    api.onBeforeBuild(() => {
      // Очищаем react-app/ перед сборкой
      const distPath = api.context.distPath;
      if (existsSync(distPath)) {
        rmSync(distPath, { recursive: true, force: true });
        console.log("[site-layout] cleaned react-app/");
      }
    });
    api.onAfterBuild(() => {
      // Структура сайта:
      //   /           = селектор (выбор версии)
      //   /react-app/ = новая версия (deck.gl)
      //   /old/       = старая версия (Plotly)
      const distPath = api.context.distPath;
      
      // 1) App (deck.gl) -> <root>/react-app/
      // rsbuild собрал app в <root>/, переносим в <root>/react-app/
      try {
        const appDir = join(distPath, "react-app");
        if (!existsSync(appDir)) mkdirSync(appDir, { recursive: true });
        // Переносим index.html и static/ в react-app/
        for (const item of ["index.html", "static"]) {
          const src = join(distPath, item);
          const dst = join(appDir, item);
          if (existsSync(src)) {
            cpSync(src, dst, { recursive: true });
            if (item === "index.html") rmSync(src);
            else rmSync(src, { recursive: true });
          }
        }
        console.log("[site-layout] app -> react-app/");
      } catch (e) {
        console.warn("[site-layout] app move failed:", e);
      }
      
      // 2) Селектор -> корень (<root>/index.html)
      try {
        const selector = readFileSync(join(__dirname, "index.html"), "utf8");
        writeFileSync(join(distPath, "index.html"), selector, "utf8");
        console.log("[site-layout] selector -> root");
      } catch (e) {
        console.warn("[site-layout] selector copy failed:", e);
      }
      
      // 3) Старая (plotly) версия -> <root>/old/
      try {
        const srcOld = join(__dirname, "old");
        const dstOld = join(distPath, "old");
        if (existsSync(srcOld)) {
          if (!existsSync(dstOld)) mkdirSync(dstOld, { recursive: true });
          for (const f of ["index.html", "map.png", "regions.js"]) {
            const sp = join(srcOld, f);
            if (existsSync(sp)) cpSync(sp, join(dstOld, f));
          }
          console.log("[site-layout] old/ -> build");
        }
      } catch (e) {
        console.warn("[site-layout] old/ copy failed:", e);
      }
      
      // 4) Генерация data.js -> <root>/old/data.js
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
