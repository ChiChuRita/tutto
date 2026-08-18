// Vitest's own `defineConfig`, which is Vite's plus the `test` block below.
import { defineConfig } from "vitest/config";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import path from "path";

// https://vite.dev/config/
export default defineConfig({
  // GitHub Pages serves this project under `/tutto/` rather than at a domain
  // root, and every asset URL in the built page has to agree. It arrives as an
  // env var rather than being written down here, because it is true in exactly
  // one place: `npm run dev` and `npm run preview` stay at `/`, and so does any
  // other host this is ever put on.
  //
  // Nothing else has to change for the subpath. A Game is identified by a query
  // parameter and not a path segment (`?game=…`, see `device.ts`), so every URL
  // the app makes is the one served page — there are no deep links for a static
  // host to 404 on, and no SPA fallback to configure.
  base: process.env.BASE_PATH ?? "/",
  plugins: [react(), tailwindcss()],
  test: {
    // Lane worktrees live under `.claude/worktrees/` and are full checkouts of
    // this same project, so the default glob finds every test file once per
    // worktree and reports a suite several times its real size. A run that
    // counts 1450 tests where there are 367 cannot fail honestly, and it also
    // runs code from branches that are not the one being verified.
    exclude: ["**/node_modules/**", "**/dist/**", "**/.claude/worktrees/**"],
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
