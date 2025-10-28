import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

// https://vitejs.dev/config/
export default defineConfig({
    plugins: [react()],
    server: {
        proxy: {
            "/api": {
                target: "https://botapi.block52.xyz",
                changeOrigin: true,
                secure: true,
            },
        },
    },
});
