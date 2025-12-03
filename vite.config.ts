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
          // Split vendor code into separate chunks for better caching
          if (id.includes('node_modules')) {
            // React core and routing
            if (id.includes('react') || id.includes('react-dom') || id.includes('wouter')) {
              return 'react-vendor';
            }
            // tRPC and React Query
            if (id.includes('@trpc') || id.includes('@tanstack/react-query')) {
              return 'trpc-vendor';
            }
            // Radix UI components - split into smaller chunks
            if (id.includes('@radix-ui')) {
              return 'ui-vendor';
            }
            // Chart libraries
            if (id.includes('chart.js') || id.includes('recharts')) {
              return 'chart-vendor';
            }
            // Utility libraries
            if (id.includes('i18next') || id.includes('date-fns') || id.includes('zod')) {
              return 'utils-vendor';
            }
            // FullCalendar components
            if (id.includes('@fullcalendar')) {
              return 'calendar-vendor';
            }
            // Everything else
            return 'vendor';
          }
        },
      },
    },
    chunkSizeWarningLimit: 600, // Increased slightly to account for vendor chunks
    minify: 'esbuild',
    target: 'es2020', // Modern target for smaller bundles
    cssCodeSplit: true, // Split CSS for better caching
    sourcemap: false, // Disable sourcemaps in production for smaller builds
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
