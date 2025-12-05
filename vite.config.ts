import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  // Base '/' because we are deploying to a subdomain (engine.madebyclick.com), not a subdirectory.
  base: '/',
  build: {
    chunkSizeWarningLimit: 1000,
    rollupOptions: {
      output: {
        manualChunks: {
          vendor: ['react', 'react-dom'],
          konva: ['konva', 'react-konva'],
          ui: ['lucide-react', 'framer-motion']
        }
      }
    }
  }
});