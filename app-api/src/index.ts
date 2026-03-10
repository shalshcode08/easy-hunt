import "dotenv/config";
import express from "express";
import helmet from "helmet";
import cors from "cors";
import compression from "compression";
import { env } from "@/env";
import { httpLogger, logger } from "@/lib/logger";
import { closeDb } from "@/db/client";
import { errorHandler } from "@/middleware/errorHandler";
import { clerkAuth } from "@/middleware/auth";
import { registerRoutes } from "@/routes";

export const app = express();

app.use(httpLogger);
app.use(helmet());
app.use(clerkAuth);
app.use(cors({ origin: env.FRONTEND_URL, credentials: true }));
app.use(compression());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

registerRoutes(app);

app.use(errorHandler);

if (require.main === module) {
  const server = app.listen(env.PORT, () => {
    logger.info(`app-api running on http://localhost:${env.PORT}`);
  });

  const shutdown = async (signal: string) => {
    logger.info(`${signal} received — shutting down`);
    server.close(async () => {
      await closeDb();
      logger.info("shutdown complete");
      process.exit(0);
    });
    setTimeout(() => {
      logger.error("forced shutdown after timeout");
      process.exit(1);
    }, 10_000);
  };

  process.on("SIGTERM", () => shutdown("SIGTERM"));
  process.on("SIGINT", () => shutdown("SIGINT"));
}
