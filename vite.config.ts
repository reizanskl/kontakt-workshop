import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { fileURLToPath, URL } from 'node:url';

// Relative assets work both at username.github.io/repository/ and on a custom domain.
export default defineConfig({
  base: './',
  plugins: [react()],
  resolve: { alias: { '@': fileURLToPath(new URL('./src', import.meta.url)) } },
  build: {
    rollupOptions: {
      input: {
        main: fileURLToPath(new URL('./index.html', import.meta.url)),
        about: fileURLToPath(new URL('./about/index.html', import.meta.url)),
        crm: fileURLToPath(new URL('./crm/index.html', import.meta.url)),
      },
    },
  },
});
