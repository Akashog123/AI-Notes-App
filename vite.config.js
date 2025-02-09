import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
// import tailwindcss from '@tailwindcss/vite'
import path from "path";

export default defineConfig({
  base: "./",
  plugins: [react()],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  server: {
    host: "0.0.0.0",
    allowedHosts: ["pns2zy-5173.csb.app"],
    proxy: {
      "/api": {
        target: "http://localhost:5000",
        changeOrigin: true,
        secure: false,
      },
    },
  },
});
