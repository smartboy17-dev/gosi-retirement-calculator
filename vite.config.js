import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { copyFileSync, mkdirSync } from 'fs'

export default defineConfig({
  plugins: [
    react(),
    {
      name: 'copy-well-known',
      closeBundle() {
        mkdirSync('dist/.well-known', { recursive: true });
        copyFileSync('public/.well-known/assetlinks.json', 'dist/.well-known/assetlinks.json');
      }
    }
  ],
  build: {
    outDir: 'dist',
    assetsInlineLimit: 100000000,
    cssCodeSplit: false,
  }
})
