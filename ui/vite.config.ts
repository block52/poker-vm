import path from "path";
import react from "@vitejs/plugin-react";
import legacy from "@vitejs/plugin-legacy";
import { defineConfig } from "vite";

export default defineConfig({
    root: "./public/", // This points to the project root directory
    plugins: [
        react(),
        legacy({
            targets: ["defaults", "not IE 11"]
        })
    ], // Vite React plugin
    resolve: {
        alias: {
            "@": path.resolve(__dirname, "./src") // Alias for `src` directory
        }
    },
    build: {
        outDir: "./dist" // Specify output directory (default is dist)
    }
});
