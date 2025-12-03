import { jsxLocPlugin } from "@builder.io/vite-plugin-jsx-loc";
import tailwindcss from "@tailwindcss/vite";
import react from "@vitejs/plugin-react";
import fs from "node:fs";
import path from "path";
import { defineConfig } from "vite";
import { vitePluginManusRuntime } from "vite-plugin-manus-runtime";


const plugins = [react(), tailwindcss(), jsxLocPlugin(), vitePluginManusRuntime()];

export default defineConfig({
  plugins,
  resolve: {
    alias: {
      "@": path.resolve(import.meta.dirname, "client", "src"),
      "@shared": path.resolve(import.meta.dirname, "shared"),
      "@assets": path.resolve(import.meta.dirname, "attached_assets"),
    },
  },
  envDir: path.resolve(import.meta.dirname),
  root: path.resolve(import.meta.dirname, "client"),
  publicDir: path.resolve(import.meta.dirname, "client", "public"),
  build: {
    outDir: path.resolve(import.meta.dirname, "dist/public"),
    emptyOutDir: true,
    rollupOptions: {
      output: {
        manualChunks: (id) => {
          // Aggressive code splitting for better caching and parallel loading
          if (id.includes('node_modules')) {
            // Core React dependencies
            if (id.includes('react/') || id.includes('react-dom/')) {
              return 'react-core';
            }
            // Router
            if (id.includes('wouter')) {
              return 'router';
            }
            // tRPC and React Query
            if (id.includes('@trpc') || id.includes('@tanstack/react-query')) {
              return 'trpc-vendor';
            }
            // UI components (Radix)
            if (id.includes('@radix-ui')) {
              return 'ui-vendor';
            }
            // Charts - lazy load these
            if (id.includes('chart.js') || id.includes('recharts') || id.includes('react-chartjs')) {
              return 'chart-vendor';
            }
            // Calendar libraries - lazy load
            if (id.includes('react-big-calendar') || id.includes('date-fns')) {
              return 'calendar-vendor';
            }
            // i18n
            if (id.includes('i18next') || id.includes('react-i18next')) {
              return 'i18n-vendor';
            }
            // Utilities
            if (id.includes('zod') || id.includes('clsx') || id.includes('class-variance-authority')) {
              return 'utils-vendor';
            }
            // Icons
            if (id.includes('lucide-react')) {
              return 'icons-vendor';
            }
            // Everything else
            return 'vendor';
          }
        },
      },
    },
    chunkSizeWarningLimit: 300,
    minify: 'esbuild',
    // Enable source map for production debugging (optional, can disable for smaller size)
    sourcemap: false,
    // Optimize dependencies
    target: 'es2020',
    cssCodeSplit: true,
  },
  server: {
    host: true,
    allowedHosts: [
      ".manuspre.computer",
      ".manus.computer",
      ".manus-asia.computer",
      ".manuscomputer.ai",
      ".manusvm.computer",
      "localhost",
      "127.0.0.1",
    ],
    fs: {
      strict: true,
      deny: ["**/.*"],
    },
  },
});
