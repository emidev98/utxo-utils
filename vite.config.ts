import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import legacy from '@vitejs/plugin-legacy'
import nodePolyfills from 'rollup-plugin-polyfill-node'

export default defineConfig({
    plugins: [react(), legacy(), nodePolyfills()],
    optimizeDeps: {
        esbuildOptions: {
            define: {
                global: "globalThis",
            }
        },
    },
    resolve: {
        alias: {
            process: "process/browser",
            stream: "stream-browserify",
            util: "util",
        },
    },
    test: {
      globals: true,
      environment: 'jsdom',
      setupFiles: './src/setupTests.ts',
    }
});
