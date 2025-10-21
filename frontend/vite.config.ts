import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    proxy: {
      '/auth': {
        target: 'http://localhost:3000',
        changeOrigin: true
      },
      '/todos': {
        target: 'http://localhost:3000',
        changeOrigin: true
      },
      '/habits': {
        target: 'http://localhost:3000',
        changeOrigin: true
      },
      '/healthz': {
        target: 'http://localhost:3000',
        changeOrigin: true
      }
    }
  },
  build: {
    outDir: 'dist',
    sourcemap: true
  }
});
