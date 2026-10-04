import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

// VITE_BASE lets the GitHub Pages build serve from /<repo>/.
export default defineConfig({
  base: process.env.VITE_BASE ?? "/",
  plugins: [react()],
});
