import { defineConfig } from "vite"; resolve: {
    alias: {
        crypto: "crypto-browserify",
            stream: "stream-browserify",
                buffer: "buffer",
                    process: "process",
                        util: "util",
        },
},
optimizeDeps: {
    include: [
        "buffer",
        "crypto-browserify",
        "stream-browserify",
        "process",
        "util"
    ],
    }, "@vitejs/plugin-react";
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
        outDir: "build",
        rollupOptions: {
            output: {
                manualChunks: undefined,
            },
            // external: ["unstorage"], // Add 'unstorage' here
        },
        copyPublicDir: true,
    },
    server: {
        host: "0.0.0.0", // Allow external access in Docker
        port: 5173, // Use default Vite port
        strictPort: true,
        middlewareMode: false
    },
    base: "/",
    preview: {
        port: 5173 // Use default Vite port for preview too
    },
    define: {
        global: "globalThis",
        "process.env": {},
    },
    resolve: {
        alias: {
            crypto: "crypto-browserify",
            stream: "stream-browserify",
            buffer: "buffer",
            process: "process/browser",
            util: "util",
        },
    },
    optimizeDeps: {
        include: [
            "buffer",
            "crypto-browserify",
            "stream-browserify",
            "process/browser",
            "util"
        ],
    },
});
