import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { ConvexAuthProvider } from "@convex-dev/auth/react";
import { ConvexReactClient } from "convex/react";
// The app's one face, self-hosted. Archivo carries the whole sheet off a single
// variable file by moving along its width axis: `wdth 70` for a field legend, 96
// for running text, 112 for a total. Omnibus-Type drew it for highway signage and
// printed forms, which is the job.
//
// There was a second face here — Doto, a dot-matrix, for the figures a terminal
// printed — and it was removed after being measured rather than admired. See
// `--font-receipt` in `index.css` for the numbers.
import "@fontsource-variable/archivo/wdth.css";
import "./index.css";
import App from "./App.tsx";

const convex = new ConvexReactClient(import.meta.env.VITE_CONVEX_URL as string);

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <ConvexAuthProvider client={convex}>
      <App />
    </ConvexAuthProvider>
  </StrictMode>,
);
