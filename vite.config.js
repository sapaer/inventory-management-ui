import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { mockPublicReviews } from "./vite.reviewsMock.js";

export default defineConfig({
  plugins: [react(), mockPublicReviews()],
  build: {
    outDir: "build",
  },
  server: {
    port: 5173,
    proxy: {
      "/api": {
        target: "https://inventory-management-ivjd.onrender.com",
        bypass(req) {
          if (req.url?.split("?")[0] === "/api/v1/public/reviews") return req.url;
        },
      },
      "/health": "https://inventory-management-ivjd.onrender.com",
      "/actuator": "https://inventory-management-ivjd.onrender.com",
    },
  },
});
