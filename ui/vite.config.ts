import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "tailwindcss";

// https://vitejs.dev/config/
export default defineConfig({
    css: {
        postcss: {
            plugins: [tailwindcss()]
        }
    },
    plugins: [react()],
    build: {
        outDir: 'build',
        rollupOptions: {
            output: {
                manualChunks: undefined,
            },
        },
        copyPublicDir: true,
    },
    server: {
        port: 3000,
        middlewareMode: true
    },
    base: '/',
    preview: {
        port: 3000
    },
});
