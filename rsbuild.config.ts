import { defineConfig, loadEnv } from "@rsbuild/core";
import { pluginReact } from "@rsbuild/plugin-react";
import tailwind from "@tailwindcss/postcss";

const { publicVars } = loadEnv({ cwd: "./environments" });

// ВРЕМЕННО ОТКЛЮЧЕНО: siteLayoutPlugin
// Причина: в CI плагин не создаёт dist/ до этапа upload-pages-artifact,
// из-за чего tar падает с "dist: Cannot open: No such file or directory".
// После проверки базовой сборки вернём плагин и отладим отдельно.
//
// import { cpSync, existsSync, mkdirSync, readFileSync, rmSync, writeFileSync } from "node:fs";
// import { join, dirname } from "node:path";
// import { spawnSync } from "node:child_process";
// import { fileURLToPath } from "node:url";
// import type { RsbuildPlugin } from "@rsbuild/core";
//
// const __dirname = dirname(fileURLToPath(import.meta.url));
//
// const siteLayoutPlugin: RsbuildPlugin = {
//   name: "site-layout",
//   setup(api) {
//     api.onBeforeBuild(() => {
//       const distPath = api.context.distPath;
//       if (existsSync(distPath)) {
//         rmSync(distPath, { recursive: true, force: true });
//         console.log("[site-layout] cleaned dist/");
//       }
//     });
//     api.onAfterBuild(() => {
//       const distPath = api.context.distPath;
//
//       // 1) App (deck.gl) -> <root>/dist/react-app/
//       try {
//         const appDir = join(distPath, "react-app");
//         if (!existsSync(appDir)) mkdirSync(appDir, { recursive: true });
//         for (const item of ["index.html", "static"]) {
//           const src = join(distPath, item);
//           const dst = join(appDir, item);
//           if (existsSync(src)) {
//             cpSync(src, dst, { recursive: true });
//             rmSync(src, { recursive: true, force: true });
//           }
//         }
//         console.log("[site-layout] app -> react-app/");
//       } catch (e) {
//         console.warn("[site-layout] app move failed:", e);
//       }
//
//       // 1.1) Данные для app -> <root>/dist/react-app/
//       try {
//         const appDir = join(distPath, "react-app");
//         for (const f of ["data_seva_updated1.csv", "ruregs32.geojson"]) {
//           const src = join(__dirname, f);
//           if (existsSync(src)) {
//             cpSync(src, join(appDir, f));
//             console.log(`[site-layout] ${f} -> react-app/`);
//           } else {
//             console.warn(`[site-layout] ${f} not found in repo root`);
//           }
//         }
//       } catch (e) {
//         console.warn("[site-layout] data copy failed:", e);
//       }
//
//       // 1.2) 404.html -> <root>/dist/404.html
//       try {
//         const src404 = join(__dirname, "404.html");
//         if (existsSync(src404)) {
//           cpSync(src404, join(distPath, "404.html"));
//           console.log("[site-layout] 404.html -> dist/");
//         }
//       } catch (e) {
//         console.warn("[site-layout] 404.html copy failed:", e);
//       }
//
//       // 2) Селектор -> корень (<root>/dist/index.html)
//       try {
//         const selector = readFileSync(join(__dirname, "index.html"), "utf8");
//         writeFileSync(join(distPath, "index.html"), selector, "utf8");
//         console.log("[site-layout] selector -> root");
//       } catch (e) {
//         console.warn("[site-layout] selector copy failed:", e);
//       }
//
//       // 3) Старая (plotly) версия -> <root>/dist/old/
//       try {
//         const srcOld = join(__dirname, "old");
//         const dstOld = join(distPath, "old");
//         if (existsSync(srcOld)) {
//           if (!existsSync(dstOld)) mkdirSync(dstOld, { recursive: true });
//           for (const f of ["index.html", "map.png", "regions.js"]) {
//             const sp = join(srcOld, f);
//             if (existsSync(sp)) cpSync(sp, join(dstOld, f));
//           }
//           console.log("[site-layout] old/ -> build");
//         }
//       } catch (e) {
//         console.warn("[site-layout] old/ copy failed:", e);
//       }
//
//       // 4) Генерация data.js -> <root>/dist/old/data.js
//       try {
//         const r = spawnSync(
//           process.execPath,
//           [join(__dirname, "scripts", "gen-data.js"), join(distPath, "old")],
//           { stdio: "inherit" }
//         );
//         if (r.status !== 0) console.warn("[site-layout] gen-data.js failed");
//       } catch (e) {
//         console.warn("[site-layout] gen-data failed:", e);
//       }
//     });
//   },
// };

export default defineConfig({
  plugins: [pluginReact()],
  source: {
    define: publicVars,
  },
  output: {
    distPath: {
      root: "dist",
    },
    assetPrefix: "./",
  },
  server: {
    cors: {
      origin: "*",
      methods: ["GET"],
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