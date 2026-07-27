import { defineConfig } from 'vite';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// Detect if running in standalone mode (e.g. CI/hosting) where
// the sibling book-club-universe folder may not exist.
// For local dev: uses shared db from book-club-universe.
// For build/deploy: same — db.js is bundled by Vite at build time.
export default defineConfig({
  resolve: {
    alias: {
      '@db': path.resolve(__dirname, './src/data/db.js'),
      '@desktop': path.resolve(__dirname, '../book-club-universe/src'),
    },
  },
  // Use the local public/ folder (logos copied here for self-contained deploy)
  publicDir: path.resolve(__dirname, 'public'),
  server: {
    port: 5180,
    host: true,
  },
  build: {
    target: 'es2020',
    outDir: 'dist',
  },
});

