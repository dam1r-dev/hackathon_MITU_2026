import { networkInterfaces } from "node:os";
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

// In Docker the backend is reachable as http://backend:8000 (API_TARGET env).
const target = process.env.API_TARGET ?? "http://localhost:8000";

// Address phones in the room can open, used by the QR page. Inside Docker the
// container IP is useless, so set PUBLIC_URL=http://<laptop-ip>:3000 there.
function lanUrl(): string {
  if (process.env.PUBLIC_URL) return process.env.PUBLIC_URL;
  for (const list of Object.values(networkInterfaces())) {
    for (const a of list ?? []) {
      if (a.family === "IPv4" && !a.internal && !a.address.startsWith("172.")) return `http://${a.address}:3000`;
    }
  }
  return "";
}

export default defineConfig({
  plugins: [react()],
  define: { __LAN_URL__: JSON.stringify(lanUrl()) },
  server: { proxy: { "/api": { target, changeOrigin: true } } },
});
