import { defineConfig, loadEnv } from "vite";
import react from "@vitejs/plugin-react";

// https://vite.dev/config/
export default defineConfig(({ command, mode }) => {
  const env = loadEnv(mode, process.cwd(), "");
  const remoteApiTarget = env.VITE_API_URL || "https://manan.digimeck.in";
  const basePath = env.VITE_BASE_PATH || (command === "build" ? "/app/" : "/");
  const localApiTarget =
    env.VITE_LOCAL_API_TARGET ||
    env.VITE_GATEWAY_API_URL ||
    env.VITE_API_URL ||
    "http://127.0.0.1:8000";

  return {
    plugins: [react()],
    // Default base remains /app/ for gateway hosting.
    // For Vercel/standalone hosting, set VITE_BASE_PATH=/.
    base: basePath,
    server: {
      host: "localhost",
      port: 5173,
      proxy: {
        // Proxy remote Employee API in dev mode.
        "/api/v1": {
          target: remoteApiTarget,
          changeOrigin: true,
        },
        // Backward-compat for legacy callers still hitting /api/*
        // Rewrite to /api/v1/* to avoid local 404s during migration.
        "/api": {
          target: remoteApiTarget,
          changeOrigin: true,
          rewrite: (path) => {
            if (path === "/api") return "/api/v1";
            if (path.startsWith("/api/v1/")) return path;
            return path.replace(/^\/api\//, "/api/v1/");
          },
        },
        // Proxy local Flask admin API in dev mode.
        "/admin/api": {
          target: localApiTarget,
          changeOrigin: true,
        },
        "/status": {
          target: localApiTarget,
          changeOrigin: true,
        },
      },
    },
  };
});
