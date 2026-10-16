import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';
import { fileURLToPath, URL } from 'node:url';
export default defineConfig({
  base: process.env.VITE_BASE_PATH || '/simple-music-player/',
  plugins: [react()],
  resolve: { alias: Object.fromEntries(['app','features','shared','test'].map(name => [name, fileURLToPath(new URL(`./src/${name}`, import.meta.url))])) },
  test: { environment: 'jsdom', globals: true, setupFiles: ['./src/test/setup.ts'], exclude: ['node_modules/**', 'e2e/**'] },
});
