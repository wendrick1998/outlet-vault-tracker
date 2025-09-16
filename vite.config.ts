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
            if (id.includes('react/') || id.includes('react-dom/')) return 'react-core';
            if (id.includes('@supabase')) return 'supabase';
            if (id.includes('@tanstack/react-query')) return 'react-query';
            if (id.includes('@radix-ui')) return 'radix-ui';
            return 'vendor';
          }
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
