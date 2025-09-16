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
            // Core React - máxima prioridade
            if (id.includes('react/') || id.includes('react-dom/')) return 'react-core';
            
            // Supabase - isolado para cache estável
            if (id.includes('@supabase')) return 'supabase';
            
            // React Query - frequentemente usado
            if (id.includes('@tanstack/react-query')) return 'react-query';
            
            // UI Framework - pode ser cached separadamente
            if (id.includes('@radix-ui')) return 'radix-ui';
            if (id.includes('lucide-react')) return 'icons';
            
            // Charts - lazy load quando necessário
            if (id.includes('recharts')) return 'charts';
            
            // Router - pequeno, pode ficar junto
            if (id.includes('react-router')) return 'routing';
            
            // Forms - usado em vários lugares
            if (id.includes('react-hook-form') || id.includes('@hookform') || id.includes('zod')) return 'forms';
            
            // Utils pequenos - agrupar para reduzir requests
            if (
              id.includes('clsx') || 
              id.includes('tailwind-merge') || 
              id.includes('class-variance-authority') ||
              id.includes('date-fns')
            ) return 'utilities';
            
            // Data processing - lazy load
            if (id.includes('xlsx') || id.includes('papaparse')) return 'data-processing';
            
            // Tudo mais em vendor otimizado
            return 'vendor-misc';
          }
          
          // Application code - splitting mais granular
          if (id.includes('src/components/ui/')) return 'ui-system';
          if (id.includes('src/components/optimized/')) return 'performance-components';
          if (id.includes('src/hooks/')) return 'react-hooks';
          if (id.includes('src/services/')) return 'api-services';
          if (id.includes('src/pages/admin/')) return 'admin-pages';
          if (id.includes('src/pages/')) return 'main-pages';
          if (id.includes('src/lib/')) return 'core-lib';
          if (id.includes('src/contexts/')) return 'react-contexts';
        },
        chunkFileNames: (chunkInfo) => {
          // Nomes mais estáveis para prevent 404s
          const name = chunkInfo.name && chunkInfo.name !== 'index' 
            ? chunkInfo.name 
            : 'chunk';
          return `assets/${name}-[hash].js`;
        },
        assetFileNames: (assetInfo) => {
          // Organizar assets por tipo
          if (assetInfo.name?.endsWith('.css')) return 'assets/styles/[name]-[hash][extname]';
          if (assetInfo.name?.match(/\.(png|jpg|jpeg|svg|gif|webp)$/)) return 'assets/images/[name]-[hash][extname]';
          return 'assets/misc/[name]-[hash][extname]';
        }
      },
      // Tree-shaking mais agressivo
      treeshake: {
        moduleSideEffects: false,
        propertyReadSideEffects: false,
        unknownGlobalSideEffects: false,
      },
    },
    chunkSizeWarningLimit: 400, // Mais restritivo
    reportCompressedSize: mode === "development", // Só em dev
  },
  optimizeDeps: {
    include: [
      "react",
      "react-dom",
      "react-router-dom",
      "@tanstack/react-query",
      "@supabase/supabase-js",
      "lucide-react", // Ícones usados em toda parte
      "@radix-ui/react-slot", // Base do shadcn
    ],
    exclude: [
      // Lazy load estes
      "recharts",
      "xlsx", 
      "papaparse"
    ]
  },
  test: {
    globals: true,
    environment: "jsdom",
    setupFiles: ["./src/test/setup.ts"],
  },
}));
