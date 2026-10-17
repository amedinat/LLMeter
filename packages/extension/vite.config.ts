import { defineConfig } from 'vite';
import { crx } from '@crxjs/vite-plugin';
import manifest from './manifest.config';

export default defineConfig({
  plugins: [crx({ manifest })],
  build: {
    outDir: 'dist',
    emptyOutDir: true,
    sourcemap: false,
    target: 'es2022',
  },
  // crxjs dev server needs a fixed port for HMR inside the extension.
  server: {
    port: 5173,
    strictPort: true,
    hmr: { port: 5173 },
  },
});
