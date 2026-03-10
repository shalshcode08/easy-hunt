import { Router, type Application } from "express";
import { requireAuth, requireAdminKey } from "@/middleware/auth";
import { apiRateLimit, scrapeRateLimit } from "@/middleware/rateLimit";
import { healthRouter } from "@/routes/health";
import { docsRouter } from "@/routes/docs";
import { jobsRouter } from "@/routes/jobs";
import { savedRouter } from "@/routes/saved";
import { scrapeRouter } from "@/routes/scrape";

export const registerRoutes = (app: Application) => {
  // ── Public ──────────────────────────────────────────────────────────────────
  app.use("/howareyou", healthRouter);
  app.use("/docs", docsRouter);

  // ── Authenticated v1 ────────────────────────────────────────────────────────
  const v1 = Router();
  v1.use(requireAuth);
  v1.use(apiRateLimit);
  v1.use("/jobs",  jobsRouter);
  v1.use("/saved", savedRouter);
  app.use("/api/v1", v1);

  // ── Admin v1 ────────────────────────────────────────────────────────────────
  const admin = Router();
  admin.use(requireAuth);
  admin.use(requireAdminKey);
  admin.use(scrapeRateLimit);
  admin.use("/scrape", scrapeRouter);
  app.use("/api/v1/admin", admin);
};
