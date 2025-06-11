import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";
import { componentTagger } from "lovable-tagger";

export default defineConfig(({ mode }) => ({
  server: {
    host: "::",
    port: 8080,
    historyApiFallback: true,
    proxy: {
      '/api': {
        target: process.env.VITE_API_BASE_URL,
        changeOrigin: true,
        secure: false,
        cookieDomainRewrite: "",
      },
    },
  },
  optimizeDeps: {
    esbuildOptions: {
      target: "es2020",
      define: {
        global: "globalThis",
      },
    },
    include: ["jwt-decode"],  // Ensure jwt-decode is included for optimization
  },
  build: {
    rollupOptions: {
      output: {
        inlineDynamicImports: true,
        exports: "auto",  // ✅ Automatically handle default and named exports
      },
    },
    commonjsOptions: {
      include: [/node_modules/],
      transformMixedEsModules: true,
      dynamicRequireTargets: ["node_modules/jwt-decode/**"],  // ✅ Ensure proper handling of jwt-decode
    },
  },
  plugins: [
    react(),
    mode === 'development' && componentTagger(),
  ].filter(Boolean),
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
    conditions: ["browser", "import", "default"],  // ✅ Ensure compatibility with both ESM and CJS
    extensions: [".ts", ".tsx", ".js", ".json"],
  },
  define: {
    'process.env.NODE_ENV': JSON.stringify(
      mode === 'production' ? 'production' : 'development'
    ),
  },
}));
