import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./index.css";

// Prevent unhandled TMDB/proxy fetch rejections from showing a blank error screen.
// These are transient (missing TMDB id, 404s) and already handled per-call where it matters.
window.addEventListener("unhandledrejection", (e) => {
  const msg = String(e.reason?.message || e.reason || "");
  if (
    msg.includes("TMDB") ||
    msg.includes("warez-proxy") ||
    msg.includes("themoviedb") ||
    msg.includes("Edge function returned") ||
    msg.includes("Failed to fetch") ||
    msg.includes("Load failed")
  ) {
    e.preventDefault();
    console.warn("[suppressed]", msg);
  }
});

window.addEventListener("error", (e) => {
  const msg = String(e.message || "");
  if (
    msg.includes("TMDB") ||
    msg.includes("warez-proxy") ||
    msg.includes("themoviedb") ||
    msg.includes("Edge function returned")
  ) {
    e.preventDefault();
    console.warn("[suppressed]", msg);
  }
});

createRoot(document.getElementById("root")!).render(<App />);
