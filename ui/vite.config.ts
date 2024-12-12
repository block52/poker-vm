import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from 'tailwindcss'; // Change this to default import

// https://vitejs.dev/config/
export default defineConfig({
  css: {
    postcss: {
      plugins: [tailwindcss()], // tailwindcss is now a function
    },
  },
  plugins: [react()],
  build: {
    outDir: "./dist", // Specify output directory (default is dist)
  },
});
