// Vitest's own `defineConfig`, which is Vite's plus the `test` block below.
import { defineConfig } from "vitest/config";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import path from "path";

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), tailwindcss()],
  test: {
    // One test reads `index.css` as text, to check the dice keyframe still runs
    // for as long as `settled.ts` holds the Roll's news back. Without this
    // Vitest stands every stylesheet in as an empty string, `?raw` included,
    // and that test has nothing to read.
    css: true,
  },
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
});
