import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

// In Docker the backend is reachable as http://backend:8000 (API_TARGET env).
// The QR code address comes from the backend's PUBLIC_URL (see .env.example).
const target = process.env.API_TARGET ?? "http://localhost:8000";

export default defineConfig({
  plugins: [react()],
  server: { proxy: { "/api": { target, changeOrigin: true } } },
});
