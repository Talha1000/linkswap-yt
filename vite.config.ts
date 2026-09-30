import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { resolve } from 'path';
import fs from 'fs';

export default defineConfig({
  plugins: [
    react(),
    {
      name: 'copy-extension-assets',
      closeBundle() {
        // Copy manifest.json to dist
        if (fs.existsSync('manifest.json')) {
          fs.copyFileSync('manifest.json', 'dist/manifest.json');
        }
        // Copy assets directory to dist/assets
        if (fs.existsSync('src/assets')) {
          if (!fs.existsSync('dist/assets')) {
            fs.mkdirSync('dist/assets', { recursive: true });
          }
          const files = fs.readdirSync('src/assets');
          for (const file of files) {
            fs.copyFileSync(`src/assets/${file}`, `dist/assets/${file}`);
          }
        }
        // Ensure content.css is copied to dist/src/content/
        if (fs.existsSync('src/content/content.css')) {
          if (!fs.existsSync('dist/src/content')) {
            fs.mkdirSync('dist/src/content', { recursive: true });
          }
          fs.copyFileSync('src/content/content.css', 'dist/src/content/content.css');
        }
      }
    }
  ],
  build: {
    outDir: 'dist',
    emptyOutDir: true,
    rollupOptions: {
      input: {
        panel: resolve(__dirname, 'src/panel/index.html'),
        popup: resolve(__dirname, 'src/popup/index.html'),
        'src/background/service-worker': resolve(__dirname, 'src/background/service-worker.ts'),
        'src/content/content': resolve(__dirname, 'src/content/content.ts'),
      },
      output: {
        entryFileNames: (chunkInfo) => {
          if (chunkInfo.name === 'src/background/service-worker') {
            return 'src/background/service-worker.js';
          }
          if (chunkInfo.name === 'src/content/content') {
            return 'src/content/content.js';
          }
          return 'assets/[name]-[hash].js';
        },
        chunkFileNames: 'assets/[name]-[hash].js',
        assetFileNames: (assetInfo) => {
          if (assetInfo.name && assetInfo.name.endsWith('.css') && assetInfo.name.includes('content')) {
            return 'src/content/content.css';
          }
          return 'assets/[name]-[hash].[ext]';
        }
      }
    }
  }
});
