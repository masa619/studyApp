import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';

export default defineConfig({
  plugins: [react()],
  assetsInclude: ['**/*.JPG'],
  base: '/static/',
  build: {
    manifest: 'manifest.json',
    outDir: 'dist',
    rollupOptions: {
      input: {
        main: path.resolve(__dirname, 'src/main.tsx'),
      },
    },
    assetsDir: 'assets',
    assetsInlineLimit: 0,
  },
  publicDir: 'public',
});

