import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

// `npm run build` outputs to dist/, which Express serves (see backend/server.js)
export default defineConfig({
  plugins: [react()]
});
