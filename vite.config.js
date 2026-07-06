import { defineConfig } from 'vite';

export default defineConfig({
  base: './',
  server: {
    port: 5199,
    strictPort: true,
    host: true
  },
  build: {
    target: 'es2020',
    chunkSizeWarningLimit: 2000
  }
});
