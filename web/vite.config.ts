import path from 'node:path';
import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import { defineConfig } from 'vite';
import { changelogPlugin } from '../app/plugins/changelog';

function manualChunks(id: string) {
  if (!id.includes('node_modules')) return undefined;

  if (id.includes('@radix-ui')) return 'radix';
  if (id.includes('@tanstack')) return 'tanstack';
  if (id.includes('framer-motion') || id.includes('/motion/')) return 'motion';
  if (id.includes('@dnd-kit')) return 'dnd-kit';
  if (id.includes('wavesurfer.js')) return 'wavesurfer';

  return 'vendor';
}

export default defineConfig({
  plugins: [react(), tailwindcss(), changelogPlugin(path.resolve(__dirname, '..'))],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, '../app/src'),
    },
  },
  build: {
    outDir: 'dist',
    rollupOptions: {
      output: {
        manualChunks,
      },
    },
  },
});
