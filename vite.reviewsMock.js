import { DUMMY_REVIEWS } from "./src/data/reviewsDummy.js";

/** Serves dummy reviews in local Vite so the homepage can fetch like production. */
export function mockPublicReviews() {
  return {
    name: "mock-public-reviews",
    configureServer(server) {
      server.middlewares.use((req, res, next) => {
        const url = req.url?.split("?")[0];
        if (req.method !== "GET" || url !== "/api/v1/public/reviews") {
          next();
          return;
        }
        res.setHeader("Content-Type", "application/json");
        res.end(JSON.stringify({ success: true, data: DUMMY_REVIEWS }));
      });
    },
  };
}
