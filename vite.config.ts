import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';
import { fileURLToPath } from 'url';
import { dirname, resolve } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

export default defineConfig({
  plugins: [
    react(),
    tailwindcss(), // Ensure this is active
  ],
  resolve: {
    alias: {
      '@': resolve(__dirname, './src'),
    },
  },
  // Add this block to ensure CSS is handled correctly in the build
  css: {
    transformer: 'lightningcss',
  },
  build: {
    outDir: 'dist',
    cssMinify: 'lightningcss',
    sourcemap: false,
  },
});