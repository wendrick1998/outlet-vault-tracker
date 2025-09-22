import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";
import { componentTagger } from "lovable-tagger";

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => ({
  server: {
    host: "::",
    port: 8080,
  },
  plugins: [react(), mode === "development" && componentTagger()].filter(Boolean),
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  build: {
    target: "esnext",
    minify: mode === "production" ? "esbuild" : false,
    sourcemap: mode === "development",
    cssCodeSplit: true,
    cssMinify: mode === "production",
    rollupOptions: {
      output: {
        manualChunks: (id) => {
          if (id.includes('node_modules')) {
            if (id.includes('@tanstack/react-query')) return 'query';
            if (id.includes('@supabase')) return 'supabase';
            if (id.includes('@radix-ui')) return 'ui';
            if (id.includes('react-router')) return 'router';
            if (id.includes('recharts')) return 'charts';
            if (id.includes('react') || id.includes('react-dom')) return 'vendor';
            return 'vendor';
          }
          if (id.includes('src/components/ui')) return 'ui-components';
          if (id.includes('src/hooks')) return 'hooks';
          if (id.includes('src/services')) return 'services';
        },
        chunkFileNames: (chunkInfo) => {
          // Stable naming strategy to prevent 404s
          if (chunkInfo.name && chunkInfo.name !== 'index') {
            return `assets/[name]-[hash].js`;
          }
          
          // Use module ID for consistent naming
          if (chunkInfo.facadeModuleId) {
            const moduleName = chunkInfo.facadeModuleId
              .split('/')
              .pop()
              ?.replace(/\.(tsx?|jsx?)$/, '') || 'chunk';
            return `assets/${moduleName}-[hash].js`;
          }
          
          return `assets/chunk-[hash].js`;
        },
        assetFileNames: 'assets/[name]-[hash].[ext]'
      },
    },
    chunkSizeWarningLimit: 500,
    reportCompressedSize: false,
  },
  optimizeDeps: {
    include: [
      "react",
      "react-dom",
      "react-router-dom",
      "@tanstack/react-query",
      "@supabase/supabase-js"
    ],
  },
  test: {
    globals: true,
    environment: "jsdom",
    setupFiles: ["./src/test/setup.ts"],
  },
}));
