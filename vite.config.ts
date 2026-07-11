import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { fileURLToPath, URL } from 'node:url';

export default defineConfig({
  plugins: [
    react(),
  ],
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url))
    }
  },
  //  the development server proxy configuration:
  server: {
    port: 5173,
    proxy: {
      '/api': {
        // Point this to your backend server (your HP laptop hostname or IP):
        target: 'http://art-HP-Pavilion-x360-Convertible-14m-cd0xxx.local:8000',
        // If testing locally on the same laptop instead of dual-laptop, use:
        // target: 'http://127.0.0.1:8000',
        changeOrigin: true,
        secure: false,
      }
    }
  }
});