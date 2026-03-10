import rateLimit from "express-rate-limit";
import { createError } from "@/middleware/errorHandler";

export const apiRateLimit = rateLimit({
  windowMs: 60 * 1000,
  max: 60,
  keyGenerator: (req) => (req as any).clerkId ?? "anonymous",
  handler: (_req, _res, next) => {
    next(createError("Too many requests, please slow down.", 429, "RATE_LIMIT_EXCEEDED"));
  },
  standardHeaders: true,
  legacyHeaders: false,
});

export const scrapeRateLimit = rateLimit({
  windowMs: 60 * 1000,
  max: 5,
  keyGenerator: (req) => (req as any).clerkId ?? "anonymous",
  handler: (_req, _res, next) => {
    next(createError("Too many scrape requests.", 429, "RATE_LIMIT_EXCEEDED"));
  },
  standardHeaders: true,
  legacyHeaders: false,
});
