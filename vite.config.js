import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  root: 'webgl',
  plugins: [react()],
  base: '/scryx/',
  build: {
    outDir: '../scryx',
    emptyOutDir: true,
  },
});
