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
    distPath: {
      root: "dist/react-app",
    },
    assetPrefix: "./",
    copy: [
      { from: "data_seva_updated1.csv", to: "." },
      { from: "ruregs32.geojson", to: "." },
    ],
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