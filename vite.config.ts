import path from 'path';
import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig(({ mode }) => {
    const env = loadEnv(mode, '.', '');
    const backendUrl = env.VITE_BACKEND_API_URL || 'http://localhost:3001';
    return {
      server: {
        port: 5173,
        host: '0.0.0.0',
        proxy: {
          '/api': {
            target: backendUrl,
            changeOrigin: true,
            secure: false,
          },
          '/api/twitter': {
            target: 'https://api.twitter.com',
            changeOrigin: true,
            rewrite: (path) => path.replace(/^\/api\/twitter/, ''),
          },
        },
      },
      plugins: [react()],
      build: {
        // Optimize bundle splitting
        rollupOptions: {
          output: {
            manualChunks: {
              'react-vendor': ['react', 'react-dom'],
              'icons': ['lucide-react'],
              'charts': ['recharts'],
            },
          },
        },
        // Increase chunk size warning limit
        chunkSizeWarningLimit: 1000,
        // Enable minification
        minify: 'terser',
        terserOptions: {
          compress: {
            drop_console: mode === 'production',
            drop_debugger: mode === 'production',
          },
        },
        // Enable sourcemaps for debugging in production
        sourcemap: mode !== 'production',
      },
      // Optimize dependencies
      optimizeDeps: {
        include: ['react', 'react-dom', 'lucide-react'],
      },
      define: {
        'process.env.API_KEY': JSON.stringify(env.GEMINI_API_KEY),
        'process.env.GEMINI_API_KEY': JSON.stringify(env.GEMINI_API_KEY)
      },
      resolve: {
        alias: {
          '@': path.resolve(__dirname, '.'),
        }
      }
    };
});
