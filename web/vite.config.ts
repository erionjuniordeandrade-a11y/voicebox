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
  if (id.includes('wavesurfer.js') || id.includes('react-sound-visualizer')) return 'audio-viz';
  if (id.includes('react-hook-form') || id.includes('@hookform/resolvers') || id.includes('/zod/')) {
    return 'forms';
  }
  if (id.includes('date-fns')) return 'date-utils';
  if (id.includes('lucide-react')) return 'icons';
  if (id.includes('@tauri-apps')) return 'tauri';
  if (id.includes('zustand')) return 'state';

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
