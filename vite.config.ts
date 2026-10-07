import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

// base relativa para poder publicarlo en cualquier hosting estático (o subcarpeta).
export default defineConfig({
  plugins: [react()],
  base: "./",
});
