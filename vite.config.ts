import react from "@vitejs/plugin-react";
import { visualizer } from "rollup-plugin-visualizer";
import { defineConfig } from "vite";
import VitePluginClean from "vite-plugin-clean";
import viteCompression from "vite-plugin-compression";
import Inspect from "vite-plugin-inspect";

console.log("process.env.NODE_ENV", process.env.NODE_ENV);
const isProd = process.env.NODE_ENV === "production";

const prodPlugins = [
  VitePluginClean(),
  viteCompression({
    verbose: true,
  }),
  viteCompression({
    verbose: true,
    algorithm: "brotliCompress",
    compressionOptions: { level: 5 },
  }),
  visualizer({
    open: true,
    filename: "./dist/stats.html",
  }),
];

const plugins = [react(), Inspect()];

// https://vitejs.dev/config/
export default defineConfig({
  build: {
    minify: "terser",
    terserOptions: {
      maxWorkers: 6,
      compress: {
        drop_console: true,
        drop_debugger: true,
      },
    },
    rollupOptions: {
      output: {
        manualChunks: {
          react: ["react", "react-dom"],
          apexcharts: ["apexcharts"],
        },
      },
    },
  },
  css: {
    preprocessorOptions: {
      scss: {
        api: "modern",
      },
    },
  },
  plugins: isProd ? [...plugins, ...prodPlugins] : plugins,
});
