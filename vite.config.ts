// import legacy from '@vitejs/plugin-legacy'
import react from "@vitejs/plugin-react";
import { defineConfig } from "vite";
import viteCompression from "vite-plugin-compression";
import Inspect from "vite-plugin-inspect";
import { visualizer } from "rollup-plugin-visualizer";

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
          lodash: ["lodash"],
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
  plugins: [
    react(),
    viteCompression({
      verbose: true,
    }),
    viteCompression({ verbose: true, algorithm: "brotliCompress" }), // brotli
    Inspect(),
    visualizer({
      open: true,
      filename: "./dist/stats.html",
    }),
    // legacy()
  ],
});
