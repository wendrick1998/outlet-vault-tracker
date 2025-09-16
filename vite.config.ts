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
            // Core libraries - keep small and essential
            if (id.includes('react/') || id.includes('react-dom/')) return 'react';
            if (id.includes('@tanstack/react-query')) return 'query';
            if (id.includes('@supabase')) return 'supabase';
            
            // UI libraries - group by functionality
            if (id.includes('@radix-ui')) return 'radix-ui';
            if (id.includes('lucide-react')) return 'icons';
            if (id.includes('recharts')) return 'charts';
            
            // Router and navigation
            if (id.includes('react-router')) return 'router';
            
            // Form libraries
            if (id.includes('react-hook-form') || id.includes('@hookform') || id.includes('zod')) return 'forms';
            
            // Utilities and smaller libs
            if (id.includes('clsx') || id.includes('tailwind-merge') || id.includes('class-variance-authority')) return 'utils';
            
            // Date libraries
            if (id.includes('date-fns')) return 'date';
            
            // Large utility libraries
            if (id.includes('xlsx') || id.includes('papaparse')) return 'data-processing';
            
            // Everything else goes to vendor
            return 'vendor';
          }
          
          // Application code splitting by feature
          if (id.includes('src/components/ui/')) return 'ui-components';
          if (id.includes('src/components/optimized/')) return 'optimized-components';
          if (id.includes('src/hooks/')) return 'hooks';
          if (id.includes('src/services/')) return 'services';
          if (id.includes('src/pages/admin/')) return 'admin';
          if (id.includes('src/pages/')) return 'pages';
          if (id.includes('src/lib/')) return 'lib';
        },
        chunkFileNames: (chunkInfo) => {
          // More stable chunk naming to prevent 404s
          if (chunkInfo.name && chunkInfo.name !== 'index') {
            return `assets/${chunkInfo.name}-[hash].js`;
          }
          
          const facadeModuleId = chunkInfo.facadeModuleId 
            ? chunkInfo.facadeModuleId.split('/').pop()?.replace('.tsx', '').replace('.ts', '') || 'chunk'
            : 'chunk';
          return `assets/${facadeModuleId}-[hash].js`;
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
